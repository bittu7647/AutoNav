import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { getHeightColor } from '../algorithms/elevationGrid';

// ── ElevationGrid (InstancedMesh) ───────────────────────────
const ElevationGrid = React.memo(({ cells }) => {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current || !cells || cells.length === 0) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const cellHeight = 0.05;
      const size = c.cellSize * 0.95;

      // Convert to Three.js coordinates
      // LIDAR_TOP (c.gx, c.gy) is X=Forward, Y=Left.
      // ThreeJS: X=Right, -Z=Forward.
      // So ThreeJS X = -c.gy (-Left = Right). ThreeJS Z = -c.gx (-Forward).
      dummy.position.set(-c.gy, Math.max(0, c.elevation / 2), -c.gx);
      dummy.scale.set(size, cellHeight, size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      color.copy(getHeightColor(c.elevation));
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [cells]);

  if (!cells || cells.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, cells.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial transparent={false} />
    </instancedMesh>
  );
});

// ── Road Markings (Mile-markers + Lane Dashes) ─────────────────
const RoadMarkings = React.memo(() => {
  const markingColor = '#FFFFFF';

  return (
    <group position={[0, 0.1, 0]}>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={`dash-fwd-${i}`} position={[0, 0, -2 - i * 5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 2.5]} />
          <meshBasicMaterial color={markingColor} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {[25, 50, 75, 100].map((dist) => (
        <group key={`dist-${dist}`} position={[0, 0, -dist]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[40, 0.1]} />
            <meshBasicMaterial color={markingColor} transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// ── Vehicle Marker ───────────────────────────────────────────
const VehicleMarker = React.memo(({ steeringAngle = 0 }) => (
  // Removed the manual -90 degree rotation to perfectly align with the obstacles
  <group position={[0, 0.75, 0]} rotation={[0, steeringAngle, 0]}>
    {/* Sleek, semi-transparent high-tech body resembling obstacle bounding boxes */}
    <mesh>
      <boxGeometry args={[2.0, 1.5, 4.5]} />
      <meshBasicMaterial color="#2DD4BF" transparent opacity={0.3} />
    </mesh>
    
    {/* Wireframe overlay for premium tech look */}
    <mesh>
      <boxGeometry args={[2.0, 1.5, 4.5]} />
      <meshBasicMaterial color="#2DD4BF" wireframe transparent opacity={0.8} />
    </mesh>

    {/* Front direction indicator (solid white line so the front is obvious) */}
    <mesh position={[0, 0.2, -2.25]}>
      <boxGeometry args={[2.0, 0.4, 0.1]} />
      <meshBasicMaterial color="#FFFFFF" />
    </mesh>

    {/* LiDAR Sensor pod on roof */}
    <mesh position={[0, 0.85, 0.5]}>
      <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
      <meshBasicMaterial color="#0f172a" />
    </mesh>
    <mesh position={[0, 0.85, 0.5]}>
      <cylinderGeometry args={[0.45, 0.45, 0.1, 16]} />
      <meshBasicMaterial color="#2DD4BF" wireframe />
    </mesh>
  </group>
));

// ── Ego Trajectory (Real NuScenes Data) ──────────────────────
const EgoTrajectory = React.memo(({ trajectory }) => {
  // trajectory is an array of {x, y, yaw} in ego-relative coords
  // x = forward in NuScenes, y = left in NuScenes
  // Map to ThreeJS: ThreeJS X = -y (NuScenes left → ThreeJS left), ThreeJS Z = -x (NuScenes forward → ThreeJS forward)
  
  const { pastGeometry, futureGeometry, currentIndex } = useMemo(() => {
    if (!trajectory || trajectory.length < 2) {
      return { pastGeometry: null, futureGeometry: null, currentIndex: -1 };
    }

    // Find the current frame index (x=0, y=0)
    let curIdx = trajectory.findIndex(p => p.x === 0 && p.y === 0);
    if (curIdx === -1) curIdx = Math.floor(trajectory.length / 2);

    // Convert trajectory points to ThreeJS coordinates
    const toVec = (p) => new THREE.Vector3(-p.y, 0.15, -p.x);

    // Past points (up to and including current)
    const pastPts = trajectory.slice(0, curIdx + 1).map(toVec);
    // Future points (current and onward)
    const futurePts = trajectory.slice(curIdx).map(toVec);

    let pastGeo = null;
    let futureGeo = null;

    if (pastPts.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(pastPts);
      pastGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    }
    if (futurePts.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(futurePts);
      futureGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    }

    return { pastGeometry: pastGeo, futureGeometry: futureGeo, currentIndex: curIdx };
  }, [trajectory]);

  return (
    <group>
      {/* Past trail — faded */}
      {pastGeometry && (
        <line geometry={pastGeometry}>
          <lineBasicMaterial color="#64748b" linewidth={2} transparent opacity={0.4} />
        </line>
      )}
      {/* Future path — bright teal glow */}
      {futureGeometry && (
        <>
          <line geometry={futureGeometry}>
            <lineBasicMaterial color="#2DD4BF" linewidth={4} transparent opacity={0.25} />
          </line>
          <line geometry={futureGeometry}>
            <lineBasicMaterial color="#FFFFFF" linewidth={2} transparent opacity={0.85} />
          </line>
        </>
      )}
    </group>
  );
});

// ── Obstacle Bounds ──────────────────────────────────────────
const ObstacleBoxes = React.memo(({ objects }) => {
  if (!objects || objects.length === 0) return null;
  return (
    <group>
      {objects.map((obj, idx) => {
        const [w, l, h] = obj.size || [1, 1, 1];
        const [tx, ty, tz] = obj.position || [0, 0, 0];
        
        const posX = -ty;
        const posZ = -tx;
        const posY = tz + 1;

        let shape;
        const t = obj.type;
        if (t === 'Car' || t === 'Truck' || t === 'Bus' || t === 'Vehicle') {
          shape = (
            <mesh scale={[w, 1.5, l]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#F5A623" transparent opacity={0.6} />
            </mesh>
          );
        } else if (t === 'Pedestrian') {
          shape = (
            <mesh scale={[w, 1.5, w]}>
              <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
              <meshBasicMaterial color="#F5A623" transparent opacity={0.8} />
            </mesh>
          );
        } else if (t === 'Barrier') {
          shape = (
            <mesh scale={[1.5, 1.5, 1.5]} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#64748b" transparent opacity={0.7} />
            </mesh>
          );
        } else if (t === 'Traffic Cone' || t === 'Cone') {
          shape = (
            <mesh scale={[1, 1.5, 1]}>
              <coneGeometry args={[0.5, 1, 4]} />
              <meshBasicMaterial color="#64748b" transparent opacity={0.7} />
            </mesh>
          );
        } else {
          shape = (
            <mesh scale={[w, 1.5, l]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#475569" transparent opacity={0.5} />
            </mesh>
          );
        }
        
        return (
          <group key={idx} position={[posX, posY, posZ]} rotation={[0, obj.yaw || 0, 0]}>
            {shape}
          </group>
        );
      })}
    </group>
  );
});

// ── Ground Plane ─────────────────────────────────────────────
const Ground = React.memo(() => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <planeGeometry args={[600, 600]} />
      <meshBasicMaterial color="#05050A" />
    </mesh>
    <gridHelper args={[600, 300, '#1A1A24', '#0A0A10']} position={[0, -0.19, 0]} />
  </group>
));

// ── Main MapViewer ───────────────────────────────────────────
const MapViewer = React.memo(({ mapCells, frameData }) => {
  const steeringAngle = useMemo(() => {
    if (frameData?.ego_trajectory && frameData.ego_trajectory.length > 0) {
      let curIdx = frameData.ego_trajectory.findIndex(p => p.x === 0 && p.y === 0);
      if (curIdx === -1) curIdx = Math.floor(frameData.ego_trajectory.length / 2);
      
      const nextPt = frameData.ego_trajectory[curIdx + 1];
      if (nextPt) {
        return nextPt.yaw * 1.5; 
      }
    }
    return 0;
  }, [frameData]);

  return (
    <div className="w-full h-full absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
      <Canvas style={{ background: '#131314' }}>
        <OrthographicCamera
          makeDefault
          position={[0, 120, 20]}
          zoom={5}
          near={-500}
          far={1000}
        />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 50, 20]} intensity={1.0} />

        <ElevationGrid cells={mapCells} />
        <RoadMarkings />
        <VehicleMarker steeringAngle={steeringAngle} />
        <EgoTrajectory trajectory={frameData?.ego_trajectory} />
        <ObstacleBoxes objects={frameData?.objects} />
        <Ground />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enablePan={true}
          screenSpacePanning={true}
          panSpeed={1.5}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
          }}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, -20]}
          minZoom={2}
          maxZoom={50}
        />
      </Canvas>
    </div>
  );
});

export default MapViewer;
