import React from 'react';
import {
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Heart,
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';

/**
 * Citizen Safety Contribution & Impact Level Widget
 * Gives citizens immediate feedback on their contribution to community road safety.
 */
const CitizenSafetyImpactBadge = ({ complaints = [] }) => {
  const totalReports = complaints.length;
  const resolvedReports = complaints.filter(
    (c) => ['Closed', 'Repair Completed', 'Resolved'].includes(c.status)
  ).length;

  // Compute Civic Guardian Level
  let level = 'Civic Sentinel';
  let badgeColor = 'from-amber-500 to-orange-500';
  let nextMilestone = 5;
  let currentProgress = totalReports;
  let levelNumber = 1;

  if (totalReports >= 15) {
    level = 'Master Road Guardian';
    badgeColor = 'from-emerald-400 to-cyan-500';
    levelNumber = 4;
    nextMilestone = 25;
  } else if (totalReports >= 8) {
    level = 'Senior Civic Inspector';
    badgeColor = 'from-indigo-400 to-purple-500';
    levelNumber = 3;
    nextMilestone = 15;
  } else if (totalReports >= 3) {
    level = 'Pavement Watcher';
    badgeColor = 'from-cyan-400 to-blue-500';
    levelNumber = 2;
    nextMilestone = 8;
  }

  const progressPercent = Math.min(100, Math.round((currentProgress / nextMilestone) * 100));
  const estimatedSafetyPoints = (totalReports * 50) + (resolvedReports * 150);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${badgeColor} p-0.5 shadow-lg flex items-center justify-center`}>
            <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <Award className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Civic Level {levelNumber}
              </span>
              <span className="text-xs text-slate-400">Community Safety Impact</span>
            </div>
            <h3 className="text-lg font-black text-white font-['Outfit'] mt-0.5">
              {level}
            </h3>
          </div>
        </div>

        {/* Safety Score Meter */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Civic Impact Points</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {estimatedSafetyPoints} <span className="text-xs font-normal text-slate-400">pts</span>
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Verified Repairs</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {resolvedReports} <span className="text-xs font-normal text-slate-400">fixed</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress towards next level */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Progress to Level {levelNumber + 1}: <strong className="text-white">{currentProgress} / {nextMilestone} Reports</strong>
          </span>
          <span className="font-mono text-cyan-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${badgeColor} transition-all duration-700`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Safety impact breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400 text-[10px] block">Potholes Neutralized</span>
          <strong className="text-emerald-400 font-mono text-sm">{resolvedReports}</strong>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400 text-[10px] block">Active Dispatches</span>
          <strong className="text-amber-400 font-mono text-sm">{totalReports - resolvedReports}</strong>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400 text-[10px] block">Commuters Protected</span>
          <strong className="text-cyan-400 font-mono text-sm">~{totalReports * 850}+</strong>
        </div>
      </div>
    </div>
  );
};

export default CitizenSafetyImpactBadge;
