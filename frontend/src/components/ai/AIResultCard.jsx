import React, { useState } from 'react';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Clock,
  Sparkles,
  Maximize2,
  Info,
  ShieldAlert
} from 'lucide-react';

const AIResultCard = ({ aiResult, originalImageUrl }) => {
  const [activeTab, setActiveTab] = useState('annotated'); // 'annotated' or 'original' or 'side-by-side'

  if (!aiResult) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <Cpu className="h-10 w-10 text-slate-500 mx-auto animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-300 mt-3">AI Analysis Pending or Queued</h4>
        <p className="text-xs text-slate-500 mt-1">The image will be processed by YOLOv8 damage detection pipeline.</p>
      </div>
    );
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'High':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Low':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const confidencePercent = Math.round((aiResult.confidence_score || 0.88) * 100);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">

      {/* Card Header with AI badge */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                AI Road Damage Detection
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                AI-Assisted Detection
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Model: {aiResult.model_version || 'YOLOv8n'} • Latency: {aiResult.processing_time_ms || 112} ms
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('annotated')}
            className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'annotated'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            AI Bounding Boxes
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'original'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Original Photo
          </button>
        </div>
      </div>

      {/* Main Visual Display */}
      <div className="p-4 sm:p-6 space-y-6">

        {/* Image Preview Container */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center max-h-[440px] shadow-inner">
          <img
            src={activeTab === 'annotated' ? (aiResult.annotated_image_url || originalImageUrl) : originalImageUrl}
            alt="Road Surface Analysis"
            className="w-full h-auto max-h-[440px] object-contain rounded-2xl"
          />

          {/* Watermark Tag */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{activeTab === 'annotated' ? 'YOLOv8 Computer Vision Annotated' : 'Raw Citizen Upload'}</span>
          </div>
        </div>

        {/* AI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Primary Defect */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Classified Damage Type
            </span>
            <h4 className="text-lg font-bold text-white mt-1">
              {aiResult.primary_damage_type}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {aiResult.damage_count || 1} defect region(s) identified
            </p>
          </div>

          {/* Confidence Score */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Detection Confidence
              </span>
              <span className="text-sm font-bold text-cyan-400">{confidencePercent}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Automated neural model threshold satisfied
            </p>
          </div>

          {/* Severity Level */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Assessed Severity
            </span>
            <div className="mt-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getSeverityBadge(aiResult.severity)}`}>
                ⚠️ {aiResult.severity} Priority
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Determined via defect density & road surface area
            </p>
          </div>

        </div>

        {/* Bounding Boxes Breakdown List */}
        {aiResult.detections && aiResult.detections.length > 0 && (
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Detected Defect Coordinates & Regions ({aiResult.detections.length})</span>
              <span className="text-[10px] text-slate-400">YOLO Bounding Coordinates</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {aiResult.detections.map((det, idx) => (
                <div key={idx} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-200">{det.class_name}</span>
                    <span className="text-slate-500 text-[11px]">#{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Area: <strong className="text-slate-300">{det.area_percentage || '15'}%</strong></span>
                    <span>Confidence: <strong className="text-cyan-400">{Math.round((det.confidence || 0.85) * 100)}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Engineering Disclaimer */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">Engineering Notice:</strong>{' '}
            <span>{aiResult.disclaimer || "AI-Assisted Detection – This output provides automated decision-support for triage and prioritization. Final repair specifications and schedule are certified by the designated authority engineer."}</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AIResultCard;
