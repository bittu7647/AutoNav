import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ currentTime }) => {
  const mainNav = [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '🗺️', label: 'Live Map', path: '/map' },
    { icon: '📡', label: 'Sensor Fusion', path: '/sensors' },
    { icon: '🎯', label: 'Object Detection', path: '/objects' },
  ];

  const analysisNav = [
    { icon: '🛤️', label: 'Path Planning', path: '/pathing' },
    { icon: '📈', label: 'Statistics', path: '/stats' },
    { icon: '🔔', label: 'Alerts', path: '/alerts' },
    { icon: '📋', label: 'Logs', path: '/logs' },
  ];

  const systemNav = [
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  const timeStr = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const dateStr = currentTime.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const renderNavItems = (items) =>
    items.map((item, idx) => (
      <NavLink
        to={item.path}
        key={idx}
        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        style={{ textDecoration: 'none' }}
      >
        <span className="nav-icon">{item.icon}</span>
        {item.label}
      </NavLink>
    ));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">FN</div>
        <div className="sidebar-brand-text">
          <h2>FoveaNav</h2>
          <span>2.5D Perception System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {renderNavItems(mainNav)}
        
        <div className="sidebar-section-label" style={{ marginTop: '8px' }}>Analysis</div>
        {renderNavItems(analysisNav)}
        
        <div className="sidebar-section-label" style={{ marginTop: '8px' }}>System</div>
        {renderNavItems(systemNav)}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-clock">
          <span className="clock-icon">🕐</span>
          <div>
            <div className="clock-time">{timeStr}</div>
            <div className="clock-date">{dateStr}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
