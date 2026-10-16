import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Line
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  HardHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Cpu,
  Layers,
  IndianRupee
} from 'lucide-react';

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981'
};

const DEFECT_COLORS = ['#f59e0b', '#06b6d4', '#6366f1', '#10b981', '#ec4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs space-y-1">
        <p className="font-bold text-white">{label || payload[0].name}</p>
        {payload.map((p, idx) => (
          <p key={idx} className="font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: {p.value} {p.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Authority Dashboard Visual Intelligence Suite
 * Gives road authority executives complete visual control over defect severity,
 * budget projections, engineer bandwidth, and SLA compliance.
 */
const AuthorityVisualSuite = ({
  complaints = [],
  engineers = [],
  onFilterBySeverity,
  onFilterByEngineer,
  activeFilter
}) => {
  // 1. Compute Severity Distribution
  const severityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    complaints.forEach((c) => {
      const sev = c.ai_severity || c.priority || 'Medium';
      if (counts[sev] !== undefined) {
        counts[sev]++;
      } else {
        counts['Medium']++;
      }
    });

    return [
      { name: 'Critical', count: counts.Critical, color: SEVERITY_COLORS.Critical, sla: '24h SLA' },
      { name: 'High', count: counts.High, color: SEVERITY_COLORS.High, sla: '48h SLA' },
      { name: 'Medium', count: counts.Medium, color: SEVERITY_COLORS.Medium, sla: '7d SLA' },
      { name: 'Low', count: counts.Low, color: SEVERITY_COLORS.Low, sla: '14d SLA' }
    ].filter((item) => item.count > 0);
  }, [complaints]);

  // 2. Compute Defect Types & Budget Projection
  const defectData = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const type = c.primary_damage_type || 'Pothole';
      if (!map[type]) {
        map[type] = { count: 0, totalCost: 0 };
      }
      map[type].count++;
      // Approximate restoration unit cost based on defect type (in ₹)
      const unitCost = type.toLowerCase().includes('pothole')
        ? 8500
        : type.toLowerCase().includes('crack')
        ? 4500
        : type.toLowerCase().includes('rutting')
        ? 18000
        : 6500;
      map[type].totalCost += (c.repair?.actual_cost || unitCost);
    });

    return Object.entries(map).map(([name, val]) => ({
      name: name.length > 14 ? name.substring(0, 12) + '...' : name,
      fullName: name,
      incidents: val.count,
      estCostK: Math.round(val.totalCost / 1000) // in Thousands (k)
    })).sort((a, b) => b.incidents - a.incidents).slice(0, 5);
  }, [complaints]);

  // 3. Compute Engineer Workload vs Max Capacity (threshold 10)
  const engineerWorkloadData = useMemo(() => {
    return engineers.slice(0, 6).map((eng) => {
      const activeTasks = complaints.filter(
        (c) => c.engineer_id === eng.id && !['Closed', 'Repair Completed', 'Resolved'].includes(c.status)
      ).length;
      return {
        name: eng.full_name?.split(' ')[0] || eng.employee_id,
        fullName: eng.full_name,
        activeTasks,
        capacity: 10,
        available: Math.max(0, 10 - activeTasks)
      };
    });
  }, [complaints, engineers]);

  // 4. SLA Compliance Rate
  const slaMetrics = useMemo(() => {
    const resolved = complaints.filter((c) => ['Closed', 'Repair Completed', 'Resolved'].includes(c.status));
    const total = complaints.length;
    const rate = total > 0 ? Math.round((resolved.length / total) * 100) : 0;
    const criticalCount = complaints.filter(
      (c) => ['Critical', 'High'].includes(c.ai_severity || c.priority) && !['Closed', 'Repair Completed'].includes(c.status)
    ).length;

    return { resolvedCount: resolved.length, total, rate, criticalCount };
  }, [complaints]);

  return (
    <div className="space-y-6">
      {/* Visual Analytics Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white font-['Outfit'] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            Authority Visual Intelligence & Operational Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry on triage severity, field engineer capacities, restoration costs, and SLA compliance.
          </p>
        </div>

        {/* Quick SLA Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-400">Jurisdiction SLA Rate:</span>
            <strong className="text-emerald-400 font-mono text-sm">{slaMetrics.rate}%</strong>
          </div>
          {slaMetrics.criticalCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>{slaMetrics.criticalCount} Critical Priority Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 3 Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Triage Severity & SLA Urgency Donut */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-rose-400" />
                Damage Severity & SLA Urgency
              </h3>
              <p className="text-[11px] text-slate-400">Risk classification for engineer dispatch</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {complaints.length} Total
            </span>
          </div>

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                >
                  {severityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-transform hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-white font-['Outfit']">
                {severityData.find((s) => s.name === 'Critical')?.count || 0}
              </span>
              <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wide">Critical</span>
            </div>
          </div>

          {/* Severity Legend Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            {severityData.map((item) => (
              <div
                key={item.name}
                className="p-1.5 px-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-semibold text-slate-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-white text-[11px]">{item.count}</span>
                  <span className="text-[9px] text-slate-500">({item.sla})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Defect Type vs Estimated Budget Bar Chart */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-amber-400" />
                Defect Types & Budget Impact
              </h3>
              <p className="text-[11px] text-slate-400">Incident count & est. repair expense</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ₹ (k) / Incidents
            </span>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectData} margin={{ top: 10, right: 10, left: -25, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="incidents"
                  name="Incidents"
                  fill="#06b6d4"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="estCostK"
                  name="Est. Cost (₹k)"
                  fill="#f59e0b"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Incidents
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Estimated Cost (₹ in thousands)
            </span>
          </div>
        </div>

        {/* 3. Field Engineer Workload & Dispatch Capacity */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-1.5">
                <HardHat className="h-4 w-4 text-blue-400" />
                Engineer Workload & Dispatch Availability
              </h3>
              <p className="text-[11px] text-slate-400">Active maintenance tasks vs quota</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {engineers.length} Staff
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-52 pr-1">
            {engineerWorkloadData.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No registered engineers in jurisdiction.
              </div>
            ) : (
              engineerWorkloadData.map((eng) => {
                const loadPercent = Math.min(100, (eng.activeTasks / eng.capacity) * 100);
                const isOverloaded = eng.activeTasks >= 8;
                return (
                  <div
                    key={eng.name}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{eng.fullName}</span>
                      <span className={`font-mono text-[11px] font-bold ${isOverloaded ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {eng.activeTasks} / {eng.capacity} tasks
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded ? 'bg-rose-500' : eng.activeTasks > 4 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Optimal Workload Quota: 10 tasks</span>
            <span className="text-emerald-400 font-semibold">Available for Dispatch</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthorityVisualSuite;
