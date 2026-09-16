import React from 'react';
import { useOutletContext } from 'react-router-dom';

const ObjectDetection = () => {
  const { frameData } = useOutletContext();
  const objects = frameData?.objects || [];

  return (
    <div className="flex-1 p-gutter flex flex-col gap-gutter overflow-hidden">
      <div className="flex flex-col gap-xs shrink-0">
        <h1 className="font-h1 text-h1 text-on-surface">Object Analysis</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Live telemetry and spatial dimensions</p>
      </div>

      <div className="flex-1 bg-[#101112] border border-[#232426] rounded flex flex-col overflow-hidden">
        <div className="p-sm px-md border-b border-[#1B1C1E] flex justify-between items-center">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Detected Obstacles
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1B1C1E] bg-[#151617] sticky top-0">
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">ID</th>
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Type</th>
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Category</th>
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Dist (m)</th>
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Pos (X,Y,Z)</th>
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Dim (W,L,H)</th>
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Pts</th>
                <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Risk</th>
              </tr>
            </thead>
            <tbody>
              {objects.map((obj, idx) => (
                <tr key={idx} className="border-b border-[#1B1C1E] hover:bg-[#151617] h-[32px]">
                  <td className="py-xs px-md font-mono-data text-[12px] text-on-surface">{obj.id}</td>
                  <td className="py-xs px-md font-body-md text-[12px] text-on-surface">{obj.type}</td>
                  <td className="py-xs px-md font-mono-data text-[12px] text-on-surface-variant">{obj.category}</td>
                  <td className={`py-xs px-md font-mono-data text-[12px] ${obj.urgency === 'high' ? 'text-error' : 'text-on-surface'}`}>
                    {obj.distance}
                  </td>
                  <td className="py-xs px-md font-mono-data text-[12px] text-on-surface-variant">
                    {obj.position.join(', ')}
                  </td>
                  <td className="py-xs px-md font-mono-data text-[12px] text-on-surface-variant">
                    {obj.size.join(' × ')}
                  </td>
                  <td className="py-xs px-md font-mono-data text-[12px] text-on-surface">{obj.num_lidar_pts}</td>
                  <td className="py-xs px-md">
                    <div className="flex items-center gap-sm">
                      <div className={`w-[6px] h-[6px] rounded-full ${obj.urgency === 'high' ? 'bg-error' : 'bg-secondary'}`}></div>
                      <span className={`font-mono-data text-[10px] uppercase tracking-widest ${obj.urgency === 'high' ? 'text-error' : 'text-secondary'}`}>
                        {obj.urgency}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {objects.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-xl font-mono-data text-[12px] text-on-surface-variant">
                    No objects detected in current frame.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetection;
