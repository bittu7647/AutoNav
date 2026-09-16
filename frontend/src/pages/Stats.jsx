import React from 'react';

const Stats = () => {
  // Real values from autonomous_navigation_final_validation_report.json
  const stats = {
    mIOU: 0.7626695409164687,
    fps: 26.70956980941407,
    inferenceMs: 37.81490449982812,
    params: 669763,
    memoryReduction: 99.89709187499999,
    pointsPerSec: 927338.6092012444,
    classDistribution: {
      terrain: 37.98,
      static: 20.54,
      dynamic: 41.46
    }
  };

  return (
    <div className="p-xl fade-in max-w-4xl">
      <header className="mb-xl">
        <h1 className="font-h1 text-h1 font-bold text-on-background mb-xs">Model Validation Statistics</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Final validation report for the Tesla T4 trained checkpoint (autonomous_navigation_best_model.pt).
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
        {/* Metric Cards */}
        <div className="bg-[#101112] border border-[#1B1C1E] p-md rounded flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="font-label text-label uppercase text-on-surface-variant tracking-widest mb-md">Mean IOU</div>
          <div className="font-mono-data text-4xl text-primary mb-xs">{(stats.mIOU * 100).toFixed(2)}%</div>
          <div className="font-body-md text-body-md text-on-surface-variant">Validation dataset accuracy</div>
        </div>

        <div className="bg-[#101112] border border-[#1B1C1E] p-md rounded flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="font-label text-label uppercase text-on-surface-variant tracking-widest mb-md">Inference Speed</div>
          <div className="font-mono-data text-4xl text-secondary mb-xs">{stats.fps.toFixed(1)} <span className="text-xl">FPS</span></div>
          <div className="font-body-md text-body-md text-on-surface-variant">{stats.inferenceMs.toFixed(2)}ms per frame</div>
        </div>

        <div className="bg-[#101112] border border-[#1B1C1E] p-md rounded flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-tertiary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="font-label text-label uppercase text-on-surface-variant tracking-widest mb-md">Model Size</div>
          <div className="font-mono-data text-4xl text-tertiary mb-xs">669<span className="text-xl">k</span></div>
          <div className="font-body-md text-body-md text-on-surface-variant">Trainable parameters</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="bg-[#101112] border border-[#1B1C1E] rounded">
          <div className="border-b border-[#1B1C1E] px-md py-sm font-label uppercase text-on-surface-variant tracking-widest">
            Pipeline Performance
          </div>
          <div className="p-md flex flex-col gap-sm">
            <div className="flex justify-between items-center border-b border-[#1B1C1E]/50 pb-sm">
              <span className="font-body text-on-surface">Memory Reduction</span>
              <span className="font-mono-data text-primary">{stats.memoryReduction.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#1B1C1E]/50 pb-sm">
              <span className="font-body text-on-surface">Processing Throughput</span>
              <span className="font-mono-data text-secondary">{(stats.pointsPerSec / 1000).toFixed(1)}k pts/s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body text-on-surface">Input Features</span>
              <span className="font-mono-data text-tertiary">4 (X, Y, Z, Intensity)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#101112] border border-[#1B1C1E] rounded">
          <div className="border-b border-[#1B1C1E] px-md py-sm font-label uppercase text-on-surface-variant tracking-widest">
            Class Distribution
          </div>
          <div className="p-md flex flex-col gap-md">
            <div>
              <div className="flex justify-between font-label-sm text-on-surface mb-xs">
                <span>Dynamic Objects</span>
                <span>{stats.classDistribution.dynamic}%</span>
              </div>
              <div className="w-full bg-[#1B1C1E] h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${stats.classDistribution.dynamic}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-label-sm text-on-surface mb-xs">
                <span>Drivable Terrain</span>
                <span>{stats.classDistribution.terrain}%</span>
              </div>
              <div className="w-full bg-[#1B1C1E] h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: `${stats.classDistribution.terrain}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-label-sm text-on-surface mb-xs">
                <span>Static Environment</span>
                <span>{stats.classDistribution.static}%</span>
              </div>
              <div className="w-full bg-[#1B1C1E] h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full" style={{ width: `${stats.classDistribution.static}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
