import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MoveHorizontal,
  Maximize2,
  Calendar,
  HardHat,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

/**
 * Interactive Before & After Repair Comparison Slider
 * Allows citizens and authorities to slide between the initial damaged road photo
 * and the verified post-repair photo with engineering inspection stamp.
 */
const RepairBeforeAfterSlider = ({
  beforeImage,
  afterImage,
  damageType = 'Road Defect',
  repairDate,
  engineerName,
  cost,
  materialsUsed,
  height = 'h-80 sm:h-96'
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percent = (x / rect.width) * 100;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    setSliderPosition(percent);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  if (!beforeImage && !afterImage) return null;

  // If only one image is available, show standard card
  if (!afterImage || !beforeImage) {
    const singleImg = afterImage || beforeImage;
    const isAfter = !!afterImage;
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            {isAfter ? 'Restoration Evidence Photo' : 'Initial Citizen Defect Photo'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isAfter ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {isAfter ? 'Verified Repair' : 'Damage Reported'}
          </span>
        </div>
        <div className={`relative ${height} rounded-xl overflow-hidden border border-slate-800`}>
          <img src={singleImg} alt="Road Site" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-5 sm:p-6 space-y-4">
      {/* Header with Title & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-white font-['Outfit'] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Before & After Repair Restoration Inspection
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              100% Resolved
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Drag the interactive split-slider or select quick viewpoints to inspect pavement quality.
          </p>
        </div>

        {/* Quick Viewport Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setSliderPosition(100)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              sliderPosition === 100
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Damage Only
          </button>
          <button
            type="button"
            onClick={() => setSliderPosition(50)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              sliderPosition === 50
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            50 / 50 Split
          </button>
          <button
            type="button"
            onClick={() => setSliderPosition(0)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              sliderPosition === 0
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Restored Only
          </button>
        </div>
      </div>

      {/* Interactive Visual Comparison Container */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className={`relative ${height} w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl select-none cursor-ew-resize group bg-slate-950`}
      >
        {/* Layer 1: AFTER Image (Full container width, placed in background) */}
        <img
          src={afterImage}
          alt="After Restoration"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* After Badge Overlay (Right Top) */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-lg pointer-events-none">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Restored Pavement</span>
        </div>

        {/* Layer 2: BEFORE Image (Clipped dynamically based on slider position) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Original Road Defect"
            className="absolute inset-y-0 left-0 h-full object-cover max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%'
            }}
          />
          {/* Before Badge Overlay (Left Top) */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Reported Defect ({damageType})</span>
          </div>
        </div>

        {/* Layer 3: Vertical Divider Handle */}
        <div
          className="absolute inset-y-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.7)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Center Circular Grabber Button */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-slate-950 border-2 border-white shadow-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110">
            <MoveHorizontal className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Hint banner at bottom */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-300 font-medium shadow-md">
            ◀ Drag left/right to compare ▶
          </span>
        </div>
      </div>

      {/* Engineering Certification Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Inspecting Engineer</span>
          <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
            <HardHat className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{engineerName || 'Assigned Officer'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sign-off Date</span>
          <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{repairDate || 'Verified'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Materials Specified</span>
          <div className="mt-1 font-medium text-slate-300 truncate" title={materialsUsed || 'Bituminous Macadam / Tack Coat'}>
            {materialsUsed || 'Bituminous Macadam'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">IRC Compliance</span>
          <div className="flex items-center gap-1.5 mt-1 font-bold text-cyan-300">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>IRC:SP:77 Pavement Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairBeforeAfterSlider;
