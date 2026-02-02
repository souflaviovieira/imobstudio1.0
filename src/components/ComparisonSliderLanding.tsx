
import React, { useState, useRef, useEffect } from 'react';

interface ComparisonSliderProps {
  before: string; // Original image
  after: string;  // Edited image
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ before, after }) => {
  const [position, setPosition] = useState(50);
  const [isInteracting, setIsInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const newPos = ((x - rect.left) / rect.width) * 100;
    setPosition(Math.min(Math.max(newPos, 0), 100));
  };

  const handleInteractionStart = () => setIsInteracting(true);
  const handleInteractionEnd = () => setIsInteracting(false);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-ew-resize bg-[#0E1117] border border-[#1E293B] shadow-2xl group select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      {/* Base Layer: Original Image (Antes) - Darker/Duller */}
      <img
        src={before}
        alt="Original"
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
        style={{ filter: 'brightness(0.8) contrast(0.9) saturate(0.8)' }}
      />

      {/* Overlay Layer: Edited Image (Depois) with Clip Path - Enhanced */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none transition-[clip-path] duration-75"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          zIndex: 2,
        }}
      >
        <img
          src={after}
          alt="Processed"
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
          style={{ filter: 'brightness(1.1) contrast(1.1) saturate(1.2)' }}
        />
      </div>

      {/* Divider Line and Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[#00FFAA] z-10 pointer-events-none shadow-[0_0_15px_rgba(0,255,170,0.5)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#00FFAA] border-4 border-[#0E1117] shadow-xl flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-[#0E1117] rounded-full" />
            <div className="w-0.5 h-3 bg-[#0E1117] rounded-full" />
          </div>
        </div>
      </div>

      {/* Persistent Visual Cues */}
      <div className={`absolute top-6 left-6 z-20 transition-opacity duration-300 ${isInteracting ? 'opacity-100' : 'opacity-40'}`}>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white">Antes</span>
        </div>
      </div>

      <div className={`absolute top-6 right-6 z-20 transition-opacity duration-300 ${isInteracting ? 'opacity-100' : 'opacity-40'}`}>
        <div className="bg-[#00FFAA]/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#00FFAA]/30">
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#00FFAA]">Depois</span>
        </div>
      </div>
    </div>
  );
};

export default ComparisonSlider;
