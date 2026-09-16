// SemanticDistribution.jsx — Elevation Statistics (Donut Chart)
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { calculateElevationStats } from '../algorithms/elevationGrid';

const SemanticDistribution = ({ mapCells }) => {
  const data = useMemo(() => {
    if (!mapCells || mapCells.length === 0) return [];
    return calculateElevationStats(mapCells);
  }, [mapCells]);

  if (!data || data.length === 0) {
    return <div className="p-md text-on-surface-variant font-mono-data text-[12px]">Waiting for data...</div>;
  }

  return (
    <div className="flex items-center justify-between h-full px-xs">
      <div className="w-24 h-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={45}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#101112', border: '1px solid #1B1C1E', fontSize: 10, color: '#e5e2e3', borderRadius: 4 }}
              itemStyle={{ color: '#e5e2e3', fontFamily: 'Inter' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 flex flex-col gap-xs ml-md overflow-y-auto">
        {data.map((item) => (
          <div key={item.name} className="flex justify-between items-center group cursor-pointer border-b border-[#1B1C1E] pb-[2px]">
            <div className="flex items-center gap-sm">
              <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: item.color }} />
              <div className="font-mono-data text-[12px] text-on-surface">{item.name}</div>
            </div>
            <div className="font-mono-data text-[11px] text-on-surface-variant group-hover:text-secondary">{item.value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SemanticDistribution;
