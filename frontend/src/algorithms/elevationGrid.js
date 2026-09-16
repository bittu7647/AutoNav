// ──────────────────────────────────────────────────────────────
//  elevationGrid.js — Core algorithms for 2.5D elevation mapping
// ──────────────────────────────────────────────────────────────
import * as THREE from 'three';

/**
 * Height-based color mapping (matches reference: blue→cyan→green→yellow→orange→red)
 */
export function getHeightColor(elevation) {
  const color = new THREE.Color();

  if (elevation <= -1.5) {
    color.setHex(0x0033CC); // Deep Blue
  } else if (elevation <= -0.5) {
    color.setHex(0x0077DD); // Blue
  } else if (elevation <= 0.0) {
    color.setHex(0x00AACC); // Cyan
  } else if (elevation <= 0.5) {
    color.setHex(0x00BB44); // Green
  } else if (elevation <= 1.0) {
    color.setHex(0x55BB00); // Yellow-Green
  } else if (elevation <= 1.5) {
    color.setHex(0xAABB00); // Yellow
  } else if (elevation <= 2.0) {
    color.setHex(0xDD8800); // Orange
  } else if (elevation <= 2.5) {
    color.setHex(0xDD4400); // Red-Orange
  } else {
    color.setHex(0xCC0000); // Red
  }

  return color;
}

/**
 * Semantic class color mapping
 */
export function getSemanticColor(semanticClass) {
  switch (semanticClass) {
    case 0: return new THREE.Color(0x222222); // Drivable → dark gray (road)
    case 1: return null; // Elevated → use height color
    case 2: return null; // Obstacle/vegetation → use height color
    default: return new THREE.Color(0x333333); // Unknown → dark
  }
}

/**
 * Process raw map API data into structured cells
 */
export function processElevationGrid(mapData) {
  if (!mapData || !mapData.grid_x) return [];

  const cells = [];
  const count = mapData.grid_x.length;

  for (let i = 0; i < count; i++) {
    const gx = Number(mapData.grid_x[i]);
    const gy = Number(mapData.grid_y[i]);
    const elevation = Number(mapData.elevation[i]);
    const semanticClass = Number(mapData.semantic_class[i]);
    const cellSize = Number(mapData.cell_size[i]) || 0.5;
    const confidence = Number(mapData.confidence[i]) || 0;

    if (isNaN(gx) || isNaN(gy) || isNaN(elevation)) continue;

    cells.push({ gx, gy, elevation, semanticClass, cellSize, confidence });
  }

  return cells;
}

/**
 * Convert dynamic frame point cloud into a 2.5D grid
 */
export function processFrameToGrid(frameData, cellSize = 1.0) {
  if (!frameData || !frameData.points || !frameData.points.xyz) return [];
  
  const { xyz, semantic_class, intensity } = frameData.points;
  const grid = new Map();
  
  // xyz is an array of [x, y, z]
  for (let i = 0; i < xyz.length; i++) {
    const pt = xyz[i];
    const x = pt[0];
    const y = pt[1];
    const z = pt[2];
    
    // If semantic_class is missing, infer it from height. 
    // Usually ground is around z=0 or z=-1.8. Let's say z < 0 is road (0), z > 0 is obstacle (3).
    const sem = semantic_class ? semantic_class[i] : (z < 0.0 ? 0 : 3);
    
    // Discard noise or extreme outliers
    if (z > 10 || z < -5) continue;
    
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    const key = `${gx},${gy}`;
    
    if (!grid.has(key)) {
      grid.set(key, { gx, gy, height: z, semantic: sem });
    } else {
      const cell = grid.get(key);
      cell.height = Math.max(cell.height, z);
      // Keep the most "important" semantic class (e.g. objects > drivable)
      if (sem > cell.semantic) {
        cell.semantic = sem;
      }
    }
  }
  
  return Array.from(grid.values()).map(c => ({
    gx: c.gx * cellSize + (cellSize / 2),
    gy: c.gy * cellSize + (cellSize / 2),
    elevation: c.height,
    semanticClass: c.semantic,
    cellSize: cellSize
  }));
}

/**
 * Generate elevation profile (cross-section) data for Recharts
 * Takes a horizontal slice at a given Y value
 */
export function generateElevationProfile(cells, sliceY = 0, tolerance = 5) {
  const sliceCells = cells
    .filter(c => Math.abs(c.gy - sliceY) < tolerance)
    .sort((a, b) => a.gx - b.gx);

  return sliceCells.map(c => ({
    distance: c.gx,
    height: Math.max(-2.5, Math.min(3.5, c.elevation)),
    semanticClass: c.semanticClass,
  }));
}

/**
 * Calculate elevation statistics for the donut chart
 */
export function calculateElevationStats(cells) {
  const total = cells.length || 1;
  let drivable = 0, elevated = 0, lowArea = 0, obstacle = 0, unknown = 0;

  for (const c of cells) {
    if (c.semanticClass === 0) {
      if (c.elevation < -1.0) lowArea++;
      else drivable++;
    } else if (c.semanticClass === 1) {
      elevated++;
    } else if (c.semanticClass === 2) {
      obstacle++;
    } else {
      unknown++;
    }
  }

  return [
    { name: 'Drivable Area', value: +(drivable / total * 100).toFixed(1), color: '#2DD4BF' },
    { name: 'Elevated', value: +(elevated / total * 100).toFixed(1), color: '#F5A623' },
    { name: 'Low Area', value: +(lowArea / total * 100).toFixed(1), color: '#334155' },
    { name: 'Obstacle', value: +(obstacle / total * 100).toFixed(1), color: '#e2e8f0' },
    { name: 'Unknown', value: +(unknown / total * 100).toFixed(1), color: '#1e293b' },
  ];
}

// ── Generate Navigation Path & Steering ────────────────────────
let smoothedSteering = 0;
let smoothedTargetX = 0;

export function generateNavigationPathAndSteering(objects = []) {
  const points = [];
  
  // Find obstacles in front of the vehicle
  let closestObstacle = null;
  let minDistance = Infinity;

  // Track the lane center roughly
  let laneCenterBias = 0;

  for (const obj of objects) {
    const forwardDist = obj.position[0];
    const lateralDist = obj.position[1];
    
    // Only care about objects in front
    if (forwardDist > 0 && forwardDist < 60) {
      if (Math.abs(lateralDist) < 2.0) {
        const dist = Math.sqrt(forwardDist**2 + lateralDist**2);
        if (dist < minDistance) {
          minDistance = dist;
          closestObstacle = obj;
        }
      } else if (lateralDist > 2.0 && lateralDist < 6.0) {
        // Obstacle on the left, biases us slightly right
        laneCenterBias -= 0.1;
      } else if (lateralDist < -2.0 && lateralDist > -6.0) {
        // Obstacle on the right, biases us slightly left
        laneCenterBias += 0.1;
      }
    }
  }

  // Calculate target X deviation to avoid the obstacle, but smoothly
  let targetX = laneCenterBias; 
  if (closestObstacle && minDistance < 25) {
    const lateralDist = closestObstacle.position[1];
    // Gentle swerve away from obstacle
    targetX = lateralDist > 0 ? -1.5 : 1.5; 
  }

  // Smooth the steering and target using simple exponential smoothing
  smoothedTargetX += (targetX - smoothedTargetX) * 0.1;
  
  // Calculate steering angle based on swerve
  const targetSteering = smoothedTargetX > 0 ? 0.05 : (smoothedTargetX < 0 ? -0.05 : 0);
  smoothedSteering += (targetSteering - smoothedSteering) * 0.15;

  // Generate beautiful autopilot path points
  for (let z = 0; z >= -80; z -= 1) {
    let x = 0;
    // Smooth transition to targetX using a bezier-like curve
    if (z < -5) {
      const progress = Math.min(1, (-z - 5) / 40); 
      // Cubic easing: 3p^2 - 2p^3
      const ease = progress * progress * (3 - 2 * progress);
      x = smoothedTargetX * ease;
    }
    points.push(new THREE.Vector3(x, 0.1, z));
  }
  
  return { points, steeringAngle: smoothedSteering };
}
