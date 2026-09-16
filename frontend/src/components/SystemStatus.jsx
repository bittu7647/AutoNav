import React from 'react';

const SystemStatus = ({ stats }) => {
  const items = [
    { icon: '📡', label: 'LiDAR', value: 'Active', status: 'running' },
    { icon: '📷', label: 'Camera', value: 'Active', status: 'running' },
    { icon: '🧭', label: 'IMU', value: 'Active', status: 'running' },
    { icon: '📍', label: 'GPS', value: 'Active', status: 'running' },
    { icon: '🎯', label: 'Localization', value: 'OK', status: 'ok' },
    { icon: '🗺️', label: 'Mapping', value: 'OK', status: 'ok' },
  ];

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">System Status</span>
        <span className="card-badge success">All OK</span>
      </div>
      <div className="card-body">
        <div className="status-list">
          {items.map((item, idx) => (
            <div key={idx} className="status-item">
              <div className="status-item-left">
                <span className="status-item-icon">{item.icon}</span>
                <span className="status-item-label">{item.label}</span>
              </div>
              <span className={`status-item-value ${item.status}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
