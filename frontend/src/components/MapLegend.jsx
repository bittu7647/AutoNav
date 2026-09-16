// MapLegend.jsx — Color-coded legend matching the reference
import React from 'react';

const legendItems = [
  { label: 'Drivable Area', color: '#888888' },
  { label: 'Elevated Area', color: '#DD4400' },
  { label: 'Low Area / Depression', color: '#0077DD' },
  { label: 'Obstacle', color: '#DDAA00' },
  { label: 'Tree / Vegetation', color: '#44AA00' },
  { label: 'Unknown', color: '#333333' },
];

const MapLegend = () => (
  <div>
    <div className="section-title">Legend</div>
    {legendItems.map(item => (
      <div key={item.label} className="legend-item">
        <div className="legend-swatch" style={{ backgroundColor: item.color }} />
        <span>{item.label}</span>
      </div>
    ))}
  </div>
);

export default MapLegend;
