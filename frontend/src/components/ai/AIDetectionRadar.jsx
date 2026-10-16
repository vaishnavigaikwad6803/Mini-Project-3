import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import {
  Cpu,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Flame,
  Gauge,
  Sparkles,
  Info
} from 'lucide-react';

/**
 * AI Multi-Vector Damage Profiler & Radar Chart
 * Gives evaluator & engineers a deep, 360-degree understanding of road damage metrics.
 */
const AIDetectionRadar = ({ aiResult, priority = 'Medium', roadType = 'City Road' }) => {
  if (!aiResult) return null;

  const confidenceScore = Math.round((aiResult.confidence_score || 0.88) * 100);
  const damageType = aiResult.primary_damage_type || 'Road Defect';
  const severity = aiResult.severity || priority || 'Medium';

  // Compute multi-vector dimensions
  let depthScore = 60;
  let trafficRisk = 55;
  let spreadArea = Math.min(100, Math.max(30, (aiResult.damage_count || 1) * 32));
  let repairUrgency = 60;
  let weatherRisk = 65;

  const dLower = damageType.toLowerCase();
  const sLower = severity.toLowerCase();

  if (dLower.includes('pothole') || dLower.includes('deep')) {
    depthScore = sLower === 'critical' ? 95 : sLower === 'high' ? 82 : 65;
    trafficRisk = sLower === 'critical' ? 92 : sLower === 'high' ? 78 : 60;
    weatherRisk = 88;
  } else if (dLower.includes('crack') || dLower.includes('alligator')) {
    depthScore = 50;
    trafficRisk = 45;
    spreadArea = sLower === 'critical' ? 90 : 75;
    weatherRisk = 92; // Water ingress causes foundation failure
  } else if (dLower.includes('rut') || dLower.includes('depression')) {
    depthScore = 75;
    trafficRisk = 80;
    spreadArea = 70;
    weatherRisk = 60;
  }

  if (sLower === 'critical') {
    repairUrgency = 98;
  } else if (sLower === 'high') {
    repairUrgency = 84;
  } else if (sLower === 'medium') {
    repairUrgency = 65;
  } else {
    repairUrgency = 40;
  }

  // Adjust traffic risk based on road class
  const rLower = (roadType || '').toLowerCase();
  if (rLower.includes('national') || rLower.includes('expressway') || rLower.includes('nh')) {
    trafficRisk = Math.min(100, trafficRisk + 18);
  } else if (rLower.includes('state') || rLower.includes('sh')) {
    trafficRisk = Math.min(100, trafficRisk + 10);
  }

  const radarData = [
    { subject: 'AI Confidence', value: confidenceScore, fullMark: 100 },
    { subject: 'Structural Depth', value: depthScore, fullMark: 100 },
    { subject: 'Traffic Hazard', value: trafficRisk, fullMark: 100 },
    { subject: 'Area Spread', value: spreadArea, fullMark: 100 },
    { subject: 'Repair Urgency', value: repairUrgency, fullMark: 100 },
    { subject: 'Water Vulnerability', value: weatherRisk, fullMark: 100 },
  ];

  // Unified Road Hazard Severity Index (RHSI) out of 100
  const rhsiScore = Math.round(
    (confidenceScore * 0.15) +
    (depthScore * 0.25) +
    (trafficRisk * 0.25) +
    (spreadArea * 0.15) +
    (repairUrgency * 0.20)
  );

  const getRHSIColor = (score) => {
    if (score >= 80) return { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30', label: 'CRITICAL RISK' };
    if (score >= 65) return { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', label: 'HIGH RISK' };
    if (score >= 45) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', label: 'MODERATE RISK' };
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', label: 'LOW RISK' };
  };

  const rhsiInfo = getRHSIColor(rhsiScore);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/95 shadow-xl p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-white font-['Outfit'] flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              AI Multi-Vector Hazard Fingerprint
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold uppercase">
              Radar Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic structural risk evaluation combining neural inference, traffic load, and water ingress vulnerability.
          </p>
        </div>

        {/* Hazard Score Pill */}
        <div className={`px-3.5 py-1.5 rounded-2xl ${rhsiInfo.bg} border ${rhsiInfo.border} flex items-center gap-2.5 shadow-md`}>
          <Gauge className={`h-4 w-4 ${rhsiInfo.text}`} />
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold leading-none">Hazard Index</span>
            <span className={`text-base font-black font-['Outfit'] ${rhsiInfo.text}`}>
              {rhsiScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart + Dimensional Score Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Chart (7 cols) */}
        <div className="lg:col-span-7 h-64 sm:h-72 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 9 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs shadow-xl space-y-1">
                        <p className="font-bold text-white">{data.subject}</p>
                        <p className="text-cyan-400 font-mono font-bold">
                          Index: {data.value}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Radar
                name="Defect Severity"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="#06b6d4"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown Metric Tiles (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {radarData.map((item) => (
            <div
              key={item.subject}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="space-y-1 flex-1 pr-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{item.subject}</span>
                  <span className="font-mono font-bold text-cyan-300">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      item.value >= 80 ? 'bg-rose-500' : item.value >= 65 ? 'bg-orange-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engineering Recommendation Alert */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs">
        <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-slate-300">
          <strong className="text-white">Prescribed Engineering Remedy:</strong>{' '}
          {damageType.toLowerCase().includes('pothole')
            ? 'Cold-pour bituminous mastic filling with 2-layer compaction within specified SLA window.'
            : damageType.toLowerCase().includes('crack')
            ? 'Polymer-modified bitumen sealant crack-routing to prevent sub-base water softening.'
            : 'Milling of distorted asphalt profile followed by dense bitumen macadam overlay.'}
        </div>
      </div>
    </div>
  );
};

export default AIDetectionRadar;
