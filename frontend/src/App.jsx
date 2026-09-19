import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import ObjectDetection from './pages/ObjectDetection';
import Sensors from './pages/Sensors';
import Pathing from './pages/Pathing';
import Stats from './pages/Stats';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import { NavLink } from 'react-router-dom';

const PlaceholderPage = ({ title }) => (
  <div className="flex-1 p-gutter flex flex-col gap-gutter">
    <div className="flex flex-col gap-xs mb-sm">
      <h1 className="font-h1 text-h1 text-on-surface">{title}</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">In development</p>
    </div>
    <div className="flex-1 bg-[#101112] border border-[#1B1C1E] rounded flex items-center justify-center">
      <div className="flex flex-col items-center gap-sm text-outline-variant">
        <span className="material-symbols-outlined text-[48px]">construction</span>
        <span className="font-mono-data text-mono-data">Module not yet available</span>
      </div>
    </div>
  </div>
);

const NavItem = ({ to, icon, label, end = false }) => (
  <NavLink 
    to={to} 
    end={end}
    className={({ isActive }) => 
      `group flex items-center gap-sm px-md py-xs font-label-sm text-label-sm uppercase tracking-widest transition-all ${
        isActive 
        ? 'text-secondary dark:text-secondary bg-surface-container-low border-r-2 border-secondary' 
        : 'text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
      }`
    }
  >
    <span className="material-symbols-outlined">{icon}</span> {label}
  </NavLink>
);

const MainLayout = ({ contextValue, scenes, selectedScene, setSelectedScene, isPlaying, setIsPlaying, currentFrameIdx, setCurrentFrameIdx, frames }) => (
  <>
    {/* SideNavBar (Desktop) */}
    <nav className="hidden md:flex flex-col h-full fixed left-0 top-0 z-40 w-64 pt-md pb-lg bg-surface-container-lowest border-r border-outline-variant">
      <div className="px-md mb-lg flex items-center gap-sm">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
        <div>
          <h1 className="font-h4 text-h4 text-on-surface">AUTONAV</h1>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-xs px-sm">
        <NavItem to="/dashboard" icon="dashboard" label="Dashboard" />
        <NavItem to="/map" icon="map" label="Live Map" />
        <NavItem to="/objects" icon="view_in_ar" label="Objects" />
        <NavItem to="/sensors" icon="sensors" label="Sensors" />
        <NavItem to="/pathing" icon="route" label="Pathing" />
        <NavItem to="/stats" icon="analytics" label="Stats" />
      </div>
      <div className="px-md mt-auto flex flex-col gap-sm">
        {/* Playback Controls matching Romer Terminal button style */}
        <div className="bg-[#101112] border border-[#1B1C1E] rounded p-xs flex flex-col gap-xs mb-sm">
          <select
            className="w-full bg-[#151617] text-on-surface border-none text-[10px] font-mono-data p-1 outline-none"
            value={selectedScene?.token || ''}
            onChange={(e) => setSelectedScene(scenes.find(s => s.token === e.target.value))}
          >
            {scenes.map(s => (
              <option key={s.token} value={s.token}>{s.name}</option>
            ))}
          </select>
          <div className="flex justify-between items-center text-on-surface px-1">
            <button onClick={() => setCurrentFrameIdx(prev => Math.max(0, prev - 1))} className="hover:text-secondary">
              <span className="material-symbols-outlined text-[16px]">skip_previous</span>
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-secondary text-secondary">
              <span className="material-symbols-outlined text-[20px]">{isPlaying ? 'pause_circle' : 'play_circle'}</span>
            </button>
            <button onClick={() => setCurrentFrameIdx(prev => Math.min(frames.length - 1, prev + 1))} className="hover:text-secondary">
              <span className="material-symbols-outlined text-[16px]">skip_next</span>
            </button>
          </div>
        </div>
        <div className="mt-md border-t border-outline-variant pt-md flex items-center gap-sm">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-background font-bold">A</div>
          <div className="font-mono-data text-mono-data text-on-surface">System Admin</div>
        </div>
      </div>
    </nav>

    {/* Main Content Area */}
    <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-y-auto overflow-x-hidden bg-background">
      {/* TopNavBar (Mobile mainly) */}
      <header className="flex justify-between items-center h-12 px-md w-full sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-outline-variant md:hidden">
        <div className="font-h3 text-h3 font-bold tracking-tighter text-on-background">AUTONAV</div>
        <div className="flex items-center gap-md text-on-surface-variant">
          <span className="material-symbols-outlined cursor-pointer hover:text-on-surface transition-colors">menu</span>
        </div>
      </header>

      <Outlet context={contextValue} />
    </main>
  </>
);

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scenes, setScenes] = useState([]);
  const [selectedScene, setSelectedScene] = useState(null);
  const [frames, setFrames] = useState([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [frameData, setFrameData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraUrl, setCameraUrl] = useState('');
  const [cameraUrlLeft, setCameraUrlLeft] = useState('');
  const [cameraUrlRight, setCameraUrlRight] = useState('');
  const [layers, setLayers] = useState({ points: true, objects: true });
  const [frameTimestamp, setFrameTimestamp] = useState('');

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load scenes + stats on mount
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/scenes`).then(r => r.json()),
      fetch(`${API}/api/stats`).then(r => r.json()),
    ]).then(([scenesData, statsData]) => {
      setScenes(scenesData);
      setStats(statsData);
      if (scenesData.length > 0) {
        setSelectedScene(scenesData[0]);
      }
    }).catch(err => console.error('Failed to load initial data', err));
  }, []);

  // Load frames when scene changes
  useEffect(() => {
    if (!selectedScene) return;
    fetch(`${API}/api/scene/${selectedScene.token}/frames`)
      .then(r => r.json())
      .then(framesData => {
        setFrames(framesData);
        setCurrentFrameIdx(0);
      });
  }, [selectedScene]);

  // Load frame data when frame index changes
  useEffect(() => {
    if (frames.length === 0) return;
    const frame = frames[currentFrameIdx];
    if (!frame) return;

    setLoading(true);
    fetch(`${API}/api/frame/${frame.token}`)
      .then(r => r.json())
      .then(data => {
        setFrameData(data);
        setLoading(false);
        // Set camera URLs
        setCameraUrl(`${API}/api/frame/${frame.token}/camera/CAM_FRONT`);
        setCameraUrlLeft(`${API}/api/frame/${frame.token}/camera/CAM_FRONT_LEFT`);
        setCameraUrlRight(`${API}/api/frame/${frame.token}/camera/CAM_FRONT_RIGHT`);
        // Format timestamp
        const ts = new Date(frame.timestamp / 1000); // nuScenes uses microseconds
        setFrameTimestamp(ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch(err => {
        console.error('Failed to load frame', err);
        setLoading(false);
      });
  }, [frames, currentFrameIdx]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentFrameIdx(prev => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [isPlaying, frames]);

  const toggleLayer = useCallback((layer) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const layerControls = {
    ...layers,
    toggle: toggleLayer,
  };

  const contextValue = {
    frameData,
    loading,
    stats,
    cameraUrl,
    cameraUrlLeft,
    cameraUrlRight,
    layerControls,
    currentFrameIdx,
    totalFrames: frames.length,
    frameTimestamp,
  };

  return (
    <Routes>
      <Route element={<MainLayout 
        contextValue={contextValue}
        scenes={scenes}
        selectedScene={selectedScene}
        setSelectedScene={setSelectedScene}
        stats={stats}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentFrameIdx={currentFrameIdx}
        setCurrentFrameIdx={setCurrentFrameIdx}
        frames={frames}
        frameTimestamp={frameTimestamp}
        currentTime={currentTime}
      />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<LiveMap />} />
        <Route path="/objects" element={<ObjectDetection />} />
        <Route path="/sensors" element={<Sensors />} />
        <Route path="/pathing" element={<Pathing />} />
        <Route path="/stats" element={<Stats />} />
      </Route>
    </Routes>
  );
}

export default App;
