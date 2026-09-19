import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import MapViewer from '../components/MapViewer';
import DetectedObjects from '../components/DetectedObjects';
import SemanticDistribution from '../components/SemanticDistribution';
import PathPlanning from '../components/PathPlanning';

const MetricCard = ({ title, value, subtext, color = "secondary", dotColor = "bg-secondary", isSubError = false }) => (
  <div className="bg-[#101112] border border-[#1B1C1E] rounded p-md card-inner-glow relative overflow-hidden">
    <div className={`absolute top-md right-md w-[6px] h-[6px] rounded-full ${dotColor}`}></div>
    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">{title}</div>
    <div className="font-h2 text-h2 text-on-surface">{value}</div>
    <div className={`font-mono-data text-mono-data mt-xs ${isSubError ? 'text-error' : 'text-[#9A9DA3]'}`}>{subtext}</div>
  </div>
);

const Dashboard = () => {
  const {
    frameData,
    loading,
    stats,
    cameraUrl,
    cameraUrlLeft,
    cameraUrlRight,
    layerControls,
  } = useOutletContext();

  const [mapCells, setMapCells] = React.useState([]);

  React.useEffect(() => {
    if (!frameData) return;
    import('../algorithms/elevationGrid').then(({ processFrameToGrid }) => {
      setMapCells(processFrameToGrid(frameData, 0.2));
    });
  }, [frameData]);

  return (
    <div className="p-gutter flex flex-col gap-gutter flex-1 h-full overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-xs mb-sm shrink-0">
        <h1 className="font-h1 text-h1 text-on-surface">Command dashboard</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Live operating layer for focused teams</p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter shrink-0">
        <MetricCard title="Speed" value="25.4 km/h" subtext="+2.1 vs target" />
        <MetricCard title="Heading" value="89.7°" subtext="Trajectory nominal" />
        <MetricCard title="System Mode" value="AUTO" subtext="Localization OK" dotColor="bg-secondary" />
      </div>

      {/* Central Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter flex-1 min-h-[400px]">
        {/* Main Graph Area (Span 2 cols) */}
        <div className="lg:col-span-2 bg-[#151617] border border-[#232426] rounded flex flex-col overflow-hidden relative">
          <div className="p-sm px-md border-b border-[#1B1C1E] flex justify-between items-center bg-[#101112]">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest flex items-center gap-sm">
              <span className="material-symbols-outlined text-[16px]">map</span> Live Map
            </div>
          </div>
          <div className="flex-1 relative bg-background">
            {loading && !frameData ? (
              <div className="flex items-center justify-center w-full h-full text-on-surface-variant font-mono-data">
                 Loading frame data...
              </div>
            ) : (
              <MapViewer mapCells={mapCells} frameData={frameData} layers={layerControls} />
            )}
          </div>
        </div>

        {/* Right Side List (Span 1 col) - Camera Feeds */}
        <div className="bg-[#101112] border border-[#232426] rounded flex flex-col overflow-hidden">
          <div className="p-sm px-md border-b border-[#1B1C1E] flex justify-between items-center">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest flex items-center gap-sm">
              <span className="material-symbols-outlined text-[16px]">sensors</span> Signal Feeds
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-sm">
            <div className="flex flex-col gap-xs">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">Front Center</span>
              <div className="w-full h-32 bg-black border border-[#1B1C1E] rounded overflow-hidden">
                {cameraUrl && <img src={cameraUrl} alt="Front" className="w-full h-full object-cover" />}
              </div>
            </div>
            
            <div className="flex flex-col gap-xs">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">Semantic Point Cloud</span>
              <div className="w-full h-32 bg-black border border-[#1B1C1E] rounded overflow-hidden relative">
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/model_outputs/autonomous_navigation_semantic_map.png`}
                  alt="LiDAR Point Cloud"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter h-72 shrink-0">
        <div className="bg-[#101112] border border-[#232426] rounded flex flex-col overflow-hidden">
          <div className="p-sm px-md border-b border-[#1B1C1E] flex justify-between items-center">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Obstacles</div>
          </div>
          <div className="flex-1 overflow-y-auto p-sm">
            <DetectedObjects objects={frameData?.objects} />
          </div>
        </div>

        <div className="bg-[#101112] border border-[#232426] rounded flex flex-col overflow-hidden">
          <div className="p-sm px-md border-b border-[#1B1C1E] flex justify-between items-center">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Elevation Statistics</div>
          </div>
          <div className="flex-1 overflow-hidden p-sm">
            <SemanticDistribution mapCells={mapCells} />
          </div>
        </div>
        
        <div className="bg-[#101112] border border-[#232426] rounded flex flex-col overflow-hidden">
          <div className="p-sm px-md border-b border-[#1B1C1E] flex justify-between items-center">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Path Planning</div>
          </div>
          <div className="flex-1 overflow-hidden p-sm">
            <PathPlanning frameData={frameData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
