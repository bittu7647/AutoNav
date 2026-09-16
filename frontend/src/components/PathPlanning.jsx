import React, { useEffect, useRef, useMemo } from 'react';
import { generateNavigationPathAndSteering } from '../algorithms/elevationGrid';

const PathPlanning = ({ frameData }) => {
  const canvasRef = useRef(null);

  const { points, steeringAngle } = useMemo(() => {
    return generateNavigationPathAndSteering(frameData?.objects || []);
  }, [frameData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear & Fill background
    ctx.fillStyle = '#101112'; // match Romer bg
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height - 20;

    // Draw road
    ctx.fillStyle = '#151617';
    ctx.beginPath();
    ctx.moveTo(cx - 30, canvas.height);
    ctx.lineTo(cx - 10, 0);
    ctx.lineTo(cx + 40, 0);
    ctx.lineTo(cx + 30, canvas.height);
    ctx.fill();

    // Draw dashed lane markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx - 15, canvas.height);
    ctx.lineTo(cx + 10, 0);
    ctx.stroke();

    // Map function to translate ThreeJS coords to canvas coords
    // ThreeJS Z (0 to -80) maps to canvas Y (cy to 0)
    // ThreeJS X (-10 to 10) maps to canvas X (cx - 50 to cx + 50)
    const scaleZ = cy / 80;
    const scaleX = 50 / 10;
    
    // Draw green path
    ctx.strokeStyle = '#2DD4BF'; // Teal
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    
    if (points && points.length > 0) {
      points.forEach((p, idx) => {
        const px = cx + p.x * scaleX;
        const py = cy + p.z * scaleZ;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Draw dynamic obstacles
    ctx.fillStyle = '#F5A623';
    if (frameData?.objects) {
      frameData.objects.forEach(obj => {
        // obj.position is [rel_x, rel_y, rz]
        // rel_x is forward (ThreeJS -Z) -> 0 to 80
        // rel_y is left (ThreeJS -X) -> left is negative lateral
        const forward = obj.position[0];
        const left = obj.position[1];
        
        if (forward > 0 && forward <= 80 && Math.abs(left) <= 10) {
          const px = cx - left * scaleX;
          const py = cy - forward * scaleZ;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw vehicle
    ctx.save();
    ctx.translate(cx, cy - 10);
    ctx.rotate(-steeringAngle);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-6, -10, 12, 20); // centered rect
    ctx.restore();

  }, [points, steeringAngle, frameData]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#101112]">
      <canvas 
        ref={canvasRef} 
        width={180} 
        height={140} 
        className="block"
      />
    </div>
  );
};

export default PathPlanning;
