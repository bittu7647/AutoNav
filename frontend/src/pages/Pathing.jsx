import React from 'react';
import { useOutletContext } from 'react-router-dom';

const Pathing = () => {
  const { frameData } = useOutletContext();
  
  // Extract only future trajectory points (where x > 0 or whatever logic matches "future" points)
  // For NuScenes ego_trajectory, the current point is 0,0. We'll show the whole trajectory or next 10 points.
  const trajectory = frameData?.ego_trajectory || [];
  
  // Find current index
  let curIdx = trajectory.findIndex(p => p.x === 0 && p.y === 0);
  if (curIdx === -1) curIdx = Math.floor(trajectory.length / 2);

  // Take the next 15 waypoints
  const waypoints = trajectory.slice(curIdx, curIdx + 15);

  return (
    <div className="p-xl fade-in max-w-5xl">
      <header className="mb-xl">
        <h1 className="font-h1 text-h1 font-bold text-on-background mb-xs">Path Planning</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Real-time local trajectory waypoints derived from NuScenes ego pose data.
        </p>
      </header>

      {waypoints.length > 0 ? (
        <div className="bg-[#101112] border border-[#1B1C1E] rounded overflow-hidden">
          <div className="grid grid-cols-4 px-md py-sm bg-[#151617] border-b border-[#1B1C1E] font-label text-label uppercase text-on-surface-variant tracking-widest">
            <div className="col-span-1">Waypoint (t)</div>
            <div className="col-span-1 text-center">Forward (X)</div>
            <div className="col-span-1 text-center">Lateral (Y)</div>
            <div className="col-span-1 text-right">Yaw Heading</div>
          </div>

          <div className="flex flex-col">
            {waypoints.map((pt, idx) => (
              <div key={idx} className={`grid grid-cols-4 px-md py-md border-b border-[#1B1C1E]/50 items-center hover:bg-[#151617]/50 transition-colors ${idx === 0 ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                <div className="font-mono-data col-span-1 flex items-center gap-2">
                  <span className={idx === 0 ? 'text-primary font-bold' : 'text-on-surface-variant'}>
                    {idx === 0 ? 'Current' : `t + ${idx}`}
                  </span>
                </div>
                <div className="font-mono-data text-on-surface col-span-1 text-center">
                  {pt.x.toFixed(3)} m
                </div>
                <div className="font-mono-data text-on-surface col-span-1 text-center">
                  {pt.y.toFixed(3)} m
                </div>
                <div className="font-mono-data text-secondary col-span-1 text-right">
                  {(pt.yaw * (180 / Math.PI)).toFixed(2)}&deg;
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-xl text-center text-on-surface-variant font-mono-data border border-dashed border-[#1B1C1E] rounded">
          Waiting for trajectory data stream...
        </div>
      )}
    </div>
  );
};

export default Pathing;
