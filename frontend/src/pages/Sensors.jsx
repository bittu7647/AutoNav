import React from 'react';

const Sensors = () => {
  const sensors = [
    {
      name: "LIDAR_TOP",
      type: "LiDAR",
      hz: 20,
      details: "32-beam, 20Hz spin, 360-degree FOV",
      status: "ACTIVE"
    },
    {
      name: "CAM_FRONT",
      type: "Camera",
      hz: 12,
      details: "1600x900 resolution, 70-degree FOV",
      status: "ACTIVE"
    },
    {
      name: "CAM_FRONT_LEFT",
      type: "Camera",
      hz: 12,
      details: "1600x900 resolution, 70-degree FOV",
      status: "ACTIVE"
    },
    {
      name: "CAM_FRONT_RIGHT",
      type: "Camera",
      hz: 12,
      details: "1600x900 resolution, 70-degree FOV",
      status: "ACTIVE"
    },
    {
      name: "RADAR_FRONT",
      type: "Radar",
      hz: 13,
      details: "FMCW Radar, 77GHz",
      status: "ACTIVE"
    }
  ];

  return (
    <div className="p-xl fade-in max-w-5xl">
      <header className="mb-xl">
        <h1 className="font-h1 text-h1 font-bold text-on-background mb-xs">Sensor Fusion</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          NuScenes Dataset hardware configuration and telemetry rates.
        </p>
      </header>

      <div className="bg-[#101112] border border-[#1B1C1E] rounded overflow-hidden">
        <div className="grid grid-cols-5 px-md py-sm bg-[#151617] border-b border-[#1B1C1E] font-label text-label uppercase text-on-surface-variant tracking-widest">
          <div className="col-span-1">Sensor Name</div>
          <div className="col-span-1">Modality</div>
          <div className="col-span-1 text-center">Update Rate</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Details</div>
        </div>

        <div className="flex flex-col">
          {sensors.map((sensor, idx) => (
            <div key={idx} className="grid grid-cols-5 px-md py-md border-b border-[#1B1C1E]/50 items-center hover:bg-[#151617]/50 transition-colors">
              <div className="font-mono-data text-primary col-span-1">{sensor.name}</div>
              <div className="col-span-1">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  sensor.type === 'LiDAR' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                  sensor.type === 'Camera' ? 'bg-primary/10 text-primary border border-primary/20' :
                  'bg-tertiary/10 text-tertiary border border-tertiary/20'
                }`}>
                  {sensor.type}
                </span>
              </div>
              <div className="font-mono-data text-on-surface col-span-1 text-center">{sensor.hz} Hz</div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-green-400 font-label-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  {sensor.status}
                </span>
              </div>
              <div className="font-body-md text-body-md text-on-surface-variant col-span-1 text-right">{sensor.details}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sensors;
