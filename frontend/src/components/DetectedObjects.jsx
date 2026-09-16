import React from 'react';

const DetectedObjects = ({ objects }) => {
  if (!objects || objects.length === 0) {
    return <div className="p-md text-on-surface-variant font-mono-data text-[12px]">No obstacles detected.</div>;
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-[#1B1C1E] bg-[#151617]">
          <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Type</th>
          <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">Distance</th>
          <th className="py-xs px-md font-label-sm text-[10px] text-outline-variant uppercase">ID</th>
        </tr>
      </thead>
      <tbody>
        {objects.slice(0, 8).map((obj, i) => {
          const dist = Math.sqrt(obj.position[0]**2 + obj.position[1]**2).toFixed(1);
          return (
            <tr key={i} className="border-b border-[#1B1C1E] hover:bg-[#151617] h-[32px]">
              <td className="py-xs px-md font-body-md text-[12px] text-on-surface-variant">{obj.type}</td>
              <td className="py-xs px-md font-mono-data text-[12px] text-on-surface">{dist}m</td>
              <td className="py-xs px-md font-mono-data text-[12px] text-outline-variant">#{i+1}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DetectedObjects;
