import json
import numpy as np

def get_yaw(q):
    return np.arctan2(2.0 * (q[0] * q[3] + q[1] * q[2]), 1.0 - 2.0 * (q[2] * q[2] + q[3] * q[3]))

# NuScenes sample ego pose (yaw = 90 deg -> facing North)
q = [0.7071068, 0, 0, 0.7071068]
ego_yaw = get_yaw(q)
print(f"Ego yaw: {np.degrees(ego_yaw)}")

# Object at [0, 10, 0] (North of ego)
ego_x, ego_y = 0, 0
gx, gy = 0, 10

rx, ry = gx - ego_x, gy - ego_y
rel_x = rx * np.cos(-ego_yaw) - ry * np.sin(-ego_yaw)
rel_y = rx * np.sin(-ego_yaw) + ry * np.cos(-ego_yaw)

print(f"Object North (0, 10) -> rel_x: {rel_x}, rel_y: {rel_y}")

# Object at [10, 0, 0] (East of ego)
gx, gy = 10, 0
rx, ry = gx - ego_x, gy - ego_y
rel_x = rx * np.cos(-ego_yaw) - ry * np.sin(-ego_yaw)
rel_y = rx * np.sin(-ego_yaw) + ry * np.cos(-ego_yaw)

print(f"Object East (10, 0) -> rel_x: {rel_x}, rel_y: {rel_y}")
