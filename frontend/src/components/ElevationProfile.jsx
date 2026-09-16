// ElevationProfile.jsx — Side View (2.5D Profile) using Recharts (HMR trigger)
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generateElevationProfile } from '../algorithms/elevationGrid';

const ElevationProfile = ({ mapCells }) => {
  const profileData = useMemo(() => {
    if (!mapCells || mapCells.length === 0) return [];
    // Take a slice at y=0 (middle of the scene)
    return generateElevationProfile(mapCells, 0, 5);
  }, [mapCells]);

  // To make the chart look like a blocky elevation map, we use step curve
  // and color gradients matching the height colorbar.
  
  if (!profileData || profileData.length === 0) {
    return <div className="loading">Waiting for elevation data...</div>;
  }

  return (
    <div className="elevation-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={profileData}
          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#2DD4BF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={true} />
          <XAxis 
            dataKey="distance" 
            type="number"
            domain={[-30, 30]}
            tickCount={7}
            stroke="#555555" 
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
          />
          <YAxis 
            domain={[-2.5, 3.5]} 
            tickCount={7}
            stroke="#555555" 
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
          <Area 
            type="step" 
            dataKey="height" 
            stroke="#2DD4BF" 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill="url(#colorHeight)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ElevationProfile;
