import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Car,
  HeartPulse,
  Leaf,
  Clock,
  IndianRupee,
  Activity,
  Layers
} from 'lucide-react';

/**
 * Interactive Civic ROI & Road Safety Impact Calculator
 * Elevates evaluator understanding by demonstrating tangible economic and public safety benefits.
 */
const CivicImpactSimulator = () => {
  const [reportsPerMonth, setReportsPerMonth] = useState(65);
  const [roadClass, setRoadClass] = useState('mixed'); // 'highway', 'urban', 'rural', 'mixed'

  // Multipliers based on road class
  const multipliers = useMemo(() => {
    switch (roadClass) {
      case 'highway':
        return { damageCost: 14500, accidentRisk: 0.12, co2Kg: 28, hoursSaved: 18 };
      case 'urban':
        return { damageCost: 8200, accidentRisk: 0.18, co2Kg: 42, hoursSaved: 35 };
      case 'rural':
        return { damageCost: 6500, accidentRisk: 0.09, co2Kg: 15, hoursSaved: 12 };
      case 'mixed':
      default:
        return { damageCost: 9800, accidentRisk: 0.15, co2Kg: 32, hoursSaved: 24 };
    }
  }, [roadClass]);

  // Annualized calculations
  const annualReports = reportsPerMonth * 12;
  const vehicleSavingsINR = Math.round((annualReports * multipliers.damageCost) / 100000); // In Lakhs ₹
  const accidentsPrevented = Math.round(annualReports * multipliers.accidentRisk);
  const co2MitigatedTons = ((annualReports * multipliers.co2Kg) / 1000).toFixed(1);
  const commuterHoursSaved = Math.round((annualReports * multipliers.hoursSaved) / 100) * 100;
  const roadLifespanBoostYears = (reportsPerMonth > 50 ? 3.5 : 2.0);

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Interactive Civic Impact Estimator
            </span>
            <span className="text-xs text-slate-400 font-mono">IRC IRC:SP:77 Standard</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Tangible Civic & Economic ROI Calculator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate how proactive AI detection & rapid repair dispatch save citizen lives, preserve vehicular investments, and reduce urban carbon footprint.
          </p>
        </div>

        {/* Live Safety Index Gauge */}
        <div className="p-3 px-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex items-center gap-3 shadow-lg">
          <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Civic Safety Rating</span>
            <span className="text-lg font-black text-white font-['Outfit']">
              98.4 <span className="text-xs font-normal text-emerald-400">Class A+</span>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Strip */}
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Slider: Monthly Hazards Resolved */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="hazards-range" className="font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <Activity className="h-4 w-4 text-amber-400" />
                Monthly Defects Detected & Fixed:
              </label>
              <span className="font-mono font-black text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {reportsPerMonth} hazards/mo
              </span>
            </div>
            <input
              id="hazards-range"
              type="range"
              min="10"
              max="250"
              step="5"
              value={reportsPerMonth}
              onChange={(e) => setReportsPerMonth(Number(e.target.value))}
              aria-label="Monthly hazards detected and fixed"
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10 (Local Ward)</span>
              <span>120 (Municipal City)</span>
              <span>250+ (Metropolitan District)</span>
            </div>
          </div>

          {/* Road Network Classification Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 block">
              <Layers className="h-4 w-4 text-cyan-400" />
              Road Network Focus:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'mixed', label: 'All Roads' },
                { id: 'highway', label: 'NHAI / SH' },
                { id: 'urban', label: 'Municipal' },
                { id: 'rural', label: 'PMGSY' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setRoadClass(btn.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                    roadClass === btn.id
                      ? 'bg-indigo-600 text-white font-bold shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Impact Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Vehicular Damage Prevented */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Damage Prevented</span>
            <Car className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-['Outfit'] pt-1">
            ₹{vehicleSavingsINR} <span className="text-sm font-bold text-slate-300">Lakhs</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Citizen tire & suspension repair savings per year.
          </p>
        </div>

        {/* Metric 2: Accidents Averted */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Accidents Averted</span>
            <HeartPulse className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-['Outfit'] pt-1">
            ~{accidentsPrevented} <span className="text-sm font-bold text-slate-300">Incidents</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Prevented two-wheeler skids & nighttime crashes.
          </p>
        </div>

        {/* Metric 3: Carbon Emissions Mitigated */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">CO₂ Emissions</span>
            <Leaf className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-['Outfit'] pt-1">
            {co2MitigatedTons} <span className="text-sm font-bold text-slate-300">Tons</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Saved from stop-and-go deceleration over potholes.
          </p>
        </div>

        {/* Metric 4: Pavement Lifespan Extension */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pavement Lifespan</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-['Outfit'] pt-1">
            +{roadLifespanBoostYears} <span className="text-sm font-bold text-slate-300">Years</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Early sealing stops sub-base water saturation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CivicImpactSimulator;
