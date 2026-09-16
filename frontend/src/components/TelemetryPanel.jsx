import React, { useState, useEffect } from 'react';

const TelemetryPanel = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    latency: 0,
    pointsPerSecond: 0,
    meanConfidence: 0,
  });

  useEffect(() => {
    // Simulate real-time updates for telemetry
    const interval = setInterval(() => {
      setMetrics({
        fps: Math.floor(Math.random() * (60 - 45 + 1)) + 45,
        latency: (Math.random() * (35 - 30) + 30).toFixed(1),
        pointsPerSecond: Math.floor(1025000 + Math.random() * 5000),
        meanConfidence: (0.91 + Math.random() * 0.02).toFixed(2),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(20, 20, 25, 0.85)',
      padding: '20px',
      borderRadius: '12px',
      color: '#fff',
      fontFamily: '"Inter", sans-serif',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: '250px'
    }}>
      <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: '600', color: '#4ADE80' }}>
        Telemetry & Performance
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="metric-box">
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>FPS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.fps}</div>
        </div>
        <div className="metric-box">
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Latency (ms)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.latency}</div>
        </div>
        <div className="metric-box">
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Points/sec</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(metrics.pointsPerSecond / 1000000).toFixed(2)}M</div>
        </div>
        <div className="metric-box">
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Confidence</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{metrics.meanConfidence}</div>
        </div>
      </div>

      <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#E5E7EB' }}>Foveated Map Specs</div>
        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
          <span>0-10m radius:</span> <span style={{ color: '#fff' }}>5cm cells</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
          <span>10-20m radius:</span> <span style={{ color: '#fff' }}>10cm cells</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
          <span>20-40m radius:</span> <span style={{ color: '#fff' }}>20cm cells</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
          <span>40-100m radius:</span> <span style={{ color: '#fff' }}>50cm cells</span>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
