import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MapViewer from '../components/MapViewer';

const LiveMap = () => {
  const { frameData, loading, layerControls } = useOutletContext();

  return (
    <div className="flex-1 p-gutter flex flex-col gap-gutter overflow-hidden">
      <div className="flex flex-col gap-xs shrink-0">
        <h1 className="font-h1 text-h1 text-on-surface">Live 3D Map</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">High resolution environment reconstruction</p>
      </div>
      
      <div className="flex-1 bg-[#151617] border border-[#232426] rounded flex flex-col overflow-hidden relative">
        <div className="p-sm px-md border-b border-[#1B1C1E] flex justify-between items-center bg-[#101112] z-10">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            3D Workspace
          </div>
        </div>
        <div className="flex-1 relative bg-background">
          {loading && !frameData ? (
            <div className="flex items-center justify-center w-full h-full text-on-surface-variant font-mono-data">Loading map data...</div>
          ) : (
            <MapViewer frameData={frameData} layers={layerControls} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
