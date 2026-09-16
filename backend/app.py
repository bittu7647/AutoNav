from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import json
import os
import struct

app = FastAPI(title="FoveaNav API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ──────────────────────────────────────────────────────────
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
NUSCENES_DIR = os.path.join(BASE_DIR, "nuscenes_mini")
META_DIR = os.path.join(NUSCENES_DIR, "v1.0-mini")
SAMPLES_DIR = os.path.join(NUSCENES_DIR, "samples")
MODEL_DIR = os.path.join(BASE_DIR, "autonomous nav")

# ── Load nuScenes tables once at startup ───────────────────────────
def load_table(name):
    with open(os.path.join(META_DIR, f"{name}.json")) as f:
        rows = json.load(f)
    return {r["token"]: r for r in rows}

scenes_table = load_table("scene")
samples_table = load_table("sample")
sample_data_table = load_table("sample_data")
annotations_table = load_table("sample_annotation")
categories_table = load_table("category")
instances_table = load_table("instance")
ego_poses_table = load_table("ego_pose")
calibrated_sensors_table = load_table("calibrated_sensor")
sensors_table = load_table("sensor")

# Load validation report & metadata
with open(os.path.join(MODEL_DIR, "autonomous_navigation_final_validation_report.json")) as f:
    validation_report = json.load(f)
with open(os.path.join(MODEL_DIR, "autonomous_navigation_metadata.json")) as f:
    model_metadata = json.load(f)

# Pre-load the existing processed data (single frame)
processed_points = np.load(os.path.join(MODEL_DIR, "autonomous_navigation_semantic_points.npz"))
processed_map = np.load(os.path.join(MODEL_DIR, "autonomous_navigation_2_5d_map.npz"))

# Build a lookup: (sample_token, channel) → sample_data entry
# The channel is determined from the sensor via calibrated_sensor
sample_data_index = {}  # {(sample_token, channel_name): sample_data_dict}
for sd_token, sd in sample_data_table.items():
    if not sd.get("is_key_frame", False):
        continue
    # Get channel from calibrated_sensor → sensor
    cs_token = sd.get("calibrated_sensor_token", "")
    cs = calibrated_sensors_table.get(cs_token, {})
    sensor_token = cs.get("sensor_token", "")
    sensor = sensors_table.get(sensor_token, {})
    channel = sensor.get("channel", "")
    if not channel:
        # Fallback: extract channel from filename (e.g., "samples/CAM_FRONT/...")
        parts = sd.get("filename", "").replace("\\", "/").split("/")
        if len(parts) >= 2:
            channel = parts[1]  # e.g., "CAM_FRONT"
    sample_data_index[(sd["sample_token"], channel)] = sd

print(f"[STARTUP] Built sample_data_index with {len(sample_data_index)} entries")


# ── Helpers ────────────────────────────────────────────────────────
def get_sample_data_for_sample(sample_token, sensor_channel):
    """Get the sample_data entry for a given sample and sensor channel."""
    return sample_data_index.get((sample_token, sensor_channel))


def load_lidar_points(filepath):
    """Load nuScenes LiDAR binary file. Format: N x 5 float32 (x, y, z, intensity, ring)."""
    points = np.fromfile(filepath, dtype=np.float32).reshape(-1, 5)
    return points


def get_annotations_for_sample(sample_token, ego_translation=None, ego_yaw=0.0):
    """Get all 3D bounding box annotations for a given sample.
    
    Args:
        sample_token: The sample to get annotations for.
        ego_translation: [x, y, z] global position of the ego vehicle.
                         If provided, positions/distances are ego-relative.
        ego_yaw: The yaw rotation of the ego vehicle in radians.
    """
    sample = samples_table.get(sample_token)
    if not sample:
        return []
    
    ego_x = ego_translation[0] if ego_translation else 0.0
    ego_y = ego_translation[1] if ego_translation else 0.0
    ego_z = ego_translation[2] if ego_translation else 0.0
    
    # Simple yaw from quaternion [w, x, y, z]
    def get_yaw(q):
        return np.arctan2(2.0 * (q[0] * q[3] + q[1] * q[2]), 1.0 - 2.0 * (q[2] * q[2] + q[3] * q[3]))
        
    result = []
    
    # Iterate all annotations and filter by sample
    for ann_token, ann in annotations_table.items():
        if ann["sample_token"] == sample_token:
            # Resolve category through instance → category chain
            instance = instances_table.get(ann.get("instance_token", ""), {})
            cat = categories_table.get(instance.get("category_token", ""), {})
            cat_name = cat.get("name", "unknown")
            
            # Simplify category name
            if "vehicle.car" in cat_name:
                obj_type = "Car"
            elif "vehicle.truck" in cat_name:
                obj_type = "Truck"
            elif "vehicle.bus" in cat_name:
                obj_type = "Bus"
            elif "vehicle.motorcycle" in cat_name:
                obj_type = "Motorcycle"
            elif "vehicle.bicycle" in cat_name:
                obj_type = "Bicycle"
            elif "vehicle.construction" in cat_name:
                obj_type = "Construction Vehicle"
            elif "vehicle.emergency" in cat_name:
                obj_type = "Emergency Vehicle"
            elif "vehicle.trailer" in cat_name:
                obj_type = "Trailer"
            elif "human.pedestrian" in cat_name:
                obj_type = "Pedestrian"
            elif "animal" in cat_name:
                obj_type = "Animal"
            elif "movable_object.barrier" in cat_name:
                obj_type = "Barrier"
            elif "movable_object.trafficcone" in cat_name:
                obj_type = "Traffic Cone"
            elif "static_object" in cat_name:
                obj_type = "Static Object"
            else:
                obj_type = cat_name
            
            # Calculate ego-relative position and distance
            gx, gy, gz = ann["translation"]
            rx, ry, rz = gx - ego_x, gy - ego_y, gz - ego_z
            
            # Rotate position by ego yaw to get true relative coords
            rel_x = rx * np.cos(-ego_yaw) - ry * np.sin(-ego_yaw)
            rel_y = rx * np.sin(-ego_yaw) + ry * np.cos(-ego_yaw)
            
            distance = float(np.sqrt(rel_x**2 + rel_y**2))
            
            # Calculate relative yaw for the object
            obj_yaw = get_yaw(ann["rotation"])
            rel_yaw = obj_yaw - ego_yaw
            
            # Determine urgency based on ego-relative distance
            if distance < 10:
                urgency = "high"
            elif distance < 25:
                urgency = "medium"
            else:
                urgency = "low"

            result.append({
                "id": ann_token[:8],
                "type": obj_type,
                "category": cat_name,
                "distance": round(distance, 1),
                "position": [round(rel_x, 1), round(rel_y, 1), round(rz, 1)],
                "size": [round(s, 1) for s in ann["size"]],  # width, length, height
                "yaw": round(rel_yaw, 3),
                "height": round(rz, 1),
                "urgency": urgency,
                "visibility": ann.get("visibility_token", ""),
                "num_lidar_pts": ann.get("num_lidar_pts", 0),
            })
    
    # Sort by distance
    result.sort(key=lambda x: x["distance"])
    return result


# ── API Endpoints ──────────────────────────────────────────────────

@app.get("/api/scenes")
def list_scenes():
    """List all available driving scenes."""
    result = []
    for token, scene in scenes_table.items():
        result.append({
            "token": token,
            "name": scene["name"],
            "description": scene["description"],
            "nbr_samples": scene["nbr_samples"],
            "first_sample_token": scene["first_sample_token"],
        })
    return result


@app.get("/api/scene/{scene_token}/frames")
def list_frames(scene_token: str):
    """List all keyframes in a scene, in order."""
    scene = scenes_table.get(scene_token)
    if not scene:
        return JSONResponse({"error": "Scene not found"}, 404)
    
    frames = []
    current_token = scene["first_sample_token"]
    idx = 0
    while current_token and current_token in samples_table:
        sample = samples_table[current_token]
        frames.append({
            "token": current_token,
            "timestamp": sample["timestamp"],
            "index": idx,
        })
        current_token = sample.get("next", "")
        idx += 1
    
    return frames


@app.get("/api/frame/{sample_token}")
def get_frame(sample_token: str):
    """Get full frame data: LiDAR points (subsampled) + metadata."""
    sample = samples_table.get(sample_token)
    if not sample:
        return JSONResponse({"error": "Frame not found"}, 404)
    
    # Get LiDAR data and ego pose
    lidar_sd = get_sample_data_for_sample(sample_token, "LIDAR_TOP")
    points_data = None
    ego_translation = None
    if lidar_sd:
        # Get ego pose for this frame (ego-relative coordinate transform)
        ego_pose = ego_poses_table.get(lidar_sd.get("ego_pose_token", ""), {})
        ego_translation = ego_pose.get("translation", [0, 0, 0])
        ego_rotation = ego_pose.get("rotation", [1, 0, 0, 0])
        
        def get_yaw_local(q):
            return float(np.arctan2(2.0 * (q[0] * q[3] + q[1] * q[2]), 1.0 - 2.0 * (q[2] * q[2] + q[3] * q[3])))
            
        ego_yaw = get_yaw_local(ego_rotation)
        
        lidar_path = os.path.join(NUSCENES_DIR, lidar_sd["filename"])
        if os.path.exists(lidar_path):
            raw_points = load_lidar_points(lidar_path)
            # Subsample for performance (every 2nd point)
            step = max(1, len(raw_points) // 15000)
            sub = raw_points[::step]
            points_data = {
                "xyz": sub[:, :3].tolist(),
                "intensity": sub[:, 3].tolist(),
                "total_points": len(raw_points),
                "displayed_points": len(sub),
            }
    
    # Get camera file paths (just the filenames for the image endpoints)
    cameras = {}
    for cam in ["CAM_FRONT", "CAM_FRONT_LEFT", "CAM_FRONT_RIGHT", "CAM_BACK", "CAM_BACK_LEFT", "CAM_BACK_RIGHT"]:
        cam_sd = get_sample_data_for_sample(sample_token, cam)
        if cam_sd:
            cameras[cam] = cam_sd["filename"]
    
    # Get annotations with ego-relative coordinates
    objects = get_annotations_for_sample(sample_token, ego_translation, ego_yaw)
    
    # Compute semantic-like stats from annotations
    obj_counts = {}
    for obj in objects:
        t = obj["type"]
        obj_counts[t] = obj_counts.get(t, 0) + 1
    
    # ── Compute real ego trajectory from neighboring frames ──
    def get_yaw(q):
        return float(np.arctan2(2.0 * (q[0] * q[3] + q[1] * q[2]),
                                1.0 - 2.0 * (q[2] * q[2] + q[3] * q[3])))

    # Current ego pose
    cur_ego_pose_token = ""
    if lidar_sd:
        cur_ego_pose_token = lidar_sd.get("ego_pose_token", "")
    cur_ego = ego_poses_table.get(cur_ego_pose_token, {})
    cur_trans = cur_ego.get("translation", [0, 0, 0])
    cur_rot = cur_ego.get("rotation", [1, 0, 0, 0])
    cur_yaw = get_yaw(cur_rot)

    # Walk backward and forward through frames to collect ego poses
    ego_trajectory = []

    def sample_to_ego_relative(s_token):
        """Get ego pose for a sample and transform to current-frame-relative coords."""
        s_lidar = get_sample_data_for_sample(s_token, "LIDAR_TOP")
        if not s_lidar:
            return None
        ep = ego_poses_table.get(s_lidar.get("ego_pose_token", ""), {})
        t = ep.get("translation", [0, 0, 0])
        r = ep.get("rotation", [1, 0, 0, 0])
        # Global offset from current ego
        dx = t[0] - cur_trans[0]
        dy = t[1] - cur_trans[1]
        # Rotate into current ego's local frame
        cos_y = float(np.cos(-cur_yaw))
        sin_y = float(np.sin(-cur_yaw))
        rel_x = dx * cos_y - dy * sin_y
        rel_y = dx * sin_y + dy * cos_y
        rel_yaw = get_yaw(r) - cur_yaw
        return {"x": round(rel_x, 2), "y": round(rel_y, 2), "yaw": round(rel_yaw, 3)}

    # Collect past frames (up to 10 back)
    past_points = []
    tk = sample.get("prev", "")
    for _ in range(10):
        if not tk or tk not in samples_table:
            break
        pt = sample_to_ego_relative(tk)
        if pt:
            past_points.append(pt)
        tk = samples_table[tk].get("prev", "")
    past_points.reverse()

    # Current frame (origin)
    ego_trajectory = past_points + [{"x": 0, "y": 0, "yaw": 0}]

    # Collect future frames (up to 10 forward)
    tk = sample.get("next", "")
    for _ in range(10):
        if not tk or tk not in samples_table:
            break
        pt = sample_to_ego_relative(tk)
        if pt:
            ego_trajectory.append(pt)
        tk = samples_table[tk].get("next", "")

    prev_token = sample.get("prev", "")
    next_token = sample.get("next", "")

    return {
        "token": sample_token,
        "timestamp": sample["timestamp"],
        "points": points_data,
        "cameras": cameras,
        "objects": objects,
        "object_summary": obj_counts,
        "total_objects": len(objects),
        "prev_frame": prev_token if prev_token else None,
        "next_frame": next_token if next_token else None,
        "ego_yaw": round(cur_yaw, 4),
        "ego_trajectory": ego_trajectory,
    }


@app.get("/api/frame/{sample_token}/camera/{camera}")
def get_camera_image(sample_token: str, camera: str):
    """Serve a camera image for a given frame and camera direction."""
    cam_sd = get_sample_data_for_sample(sample_token, camera)
    if not cam_sd:
        return JSONResponse({"error": "Camera not found"}, 404)
    
    img_path = os.path.join(NUSCENES_DIR, cam_sd["filename"])
    if os.path.exists(img_path):
        return FileResponse(img_path, media_type="image/jpeg")
    return JSONResponse({"error": "Image file not found"}, 404)


@app.get("/api/processed/points")
def get_processed_points():
    """Get the pre-processed semantic points from the trained model output."""
    return {
        "xyz": processed_points["xyz"][::2].tolist(),
        "semantic_class": processed_points["semantic_class"][::2].tolist(),
        "confidence": processed_points["confidence"][::2].tolist(),
        "total_points": len(processed_points["xyz"]),
    }


@app.get("/api/processed/map")
def get_processed_map():
    """Get the pre-processed 2.5D adaptive map."""
    return {
        "grid_x": processed_map["grid_x"].tolist(),
        "grid_y": processed_map["grid_y"].tolist(),
        "elevation": processed_map["elevation"].tolist(),
        "semantic_class": processed_map["semantic_class"].tolist(),
        "confidence": processed_map["confidence"].tolist(),
        "cell_size": processed_map["cell_size"].tolist(),
        "point_count": processed_map["point_count"].tolist(),
        "total_cells": len(processed_map["grid_x"]),
    }


@app.get("/api/validation_report")
def get_validation_report():
    """Get the model validation report."""
    return validation_report


@app.get("/api/metadata")
def get_metadata():
    """Get the model metadata."""
    return model_metadata


@app.get("/api/stats")
def get_stats():
    """Get aggregate statistics from both the validation report and processed data."""
    return {
        "model": {
            "parameters": validation_report["model"]["parameters"],
            "validation_miou": round(validation_report["model"]["validation_miou"] * 100, 1),
            "gpu": validation_report["gpu"],
        },
        "performance": {
            "mean_fps": round(validation_report["validation"]["mean_frame_fps"], 1),
            "mean_inference_ms": round(validation_report["validation"]["mean_inference_ms"], 1),
            "mean_points_per_second": round(validation_report["validation"]["mean_points_per_second"]),
            "mean_confidence": round(validation_report["validation"]["mean_confidence"], 3),
            "memory_reduction_percent": round(validation_report["validation"]["mean_memory_reduction_percent"], 1),
        },
        "semantic_distribution": validation_report["aggregate_class_distribution"],
        "adaptive_grid": model_metadata["adaptive_2_5d"],
    }


# Serve sensor images as static files
app.mount("/nuscenes", StaticFiles(directory=NUSCENES_DIR), name="nuscenes")
# Serve model output images
app.mount("/model_outputs", StaticFiles(directory=MODEL_DIR), name="model_outputs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
