import React, { useState, useEffect } from 'react';

const ObjectDetectionList = () => {
  const [objects, setObjects] = useState([
    { id: 1, type: 'Pedestrian', distance: '4.2m', urgency: 'high' },
    { id: 2, type: 'Static (Pole)', distance: '12.5m', urgency: 'low' },
    { id: 3, type: 'Dynamic (Car)', distance: '22.1m', urgency: 'medium' },
  ]);

  useEffect(() => {
    // Simulate real-time object detection feed
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newObj = {
          id: Date.now(),
          type: Math.random() > 0.5 ? 'Pedestrian' : 'Dynamic (Car)',
          distance: (Math.random() * 30 + 2).toFixed(1) + 'm',
          urgency: Math.random() > 0.5 ? 'high' : 'medium'
        };
        setObjects(prev => [newObj, ...prev].slice(0, 5));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(20, 20, 25, 0.85)',
      padding: '20px',
      borderRadius: '12px',
      color: '#fff',
      fontFamily: '"Inter", sans-serif',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      width: '280px'
    }}>
      <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: '600', color: '#F87171' }}>
        Live Objects
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {objects.map(obj => (
          <div key={obj.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            borderLeft: `4px solid ${obj.urgency === 'high' ? '#EF4444' : obj.urgency === 'medium' ? '#F59E0B' : '#10B981'}`
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{obj.type}</div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Distance: {obj.distance}</div>
            </div>
            {obj.urgency === 'high' && (
              <span style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#FCA5A5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>ALERT</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ObjectDetectionList;
