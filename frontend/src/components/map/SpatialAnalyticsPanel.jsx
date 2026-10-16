import React, { useState, useMemo } from 'react';
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
  CartesianGrid
} from 'recharts';
import {
  MapPin,
  TrendingUp,
  Layers,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2
} from 'lucide-react';

const ROAD_COLORS = {
  'National Highway': '#f59e0b',
  'State Highway': '#06b6d4',
  'Major District Road': '#a855f7',
  'Other District Road': '#3b82f6',
  'Village Road': '#10b981',
  'Urban Road': '#ec4899'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 shadow-xl text-xs space-y-1">
        <p className="font-bold text-white">{label || payload[0].name}</p>
        {payload.map((p, idx) => (
          <p key={idx} className="font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Spatial Analytics Panel for Public GIS Map
 * Visualizes geographic defect density across Maharashtra districts and road networks.
 */
const SpatialAnalyticsPanel = ({
  complaints = [],
  selectedDistrict,
  onSelectDistrict,
  selectedRoadType,
  onSelectRoadType,
  selectedSeverity,
  onSelectSeverity
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // 1. Top Districts Leaderboard
  const districtData = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const dist = c.district || 'Other';
      if (!map[dist]) {
        map[dist] = { name: dist, total: 0, resolved: 0, active: 0 };
      }
      map[dist].total++;
      if (['Closed', 'Repair Completed', 'Resolved'].includes(c.status)) {
        map[dist].resolved++;
      } else {
        map[dist].active++;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [complaints]);

  // 2. Road Network Distribution
  const roadTypeData = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const type = c.road_type || 'Urban Road';
      map[type] = (map[type] || 0) + 1;
    });

    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      color: ROAD_COLORS[name] || '#64748b'
    })).sort((a, b) => b.count - a.count);
  }, [complaints]);

  // 3. Severity Distribution
  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    complaints.forEach((c) => {
      const s = c.ai_severity || c.priority || 'Medium';
      if (counts[s] !== undefined) counts[s]++;
      else counts['Medium']++;
    });
    return counts;
  }, [complaints]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden transition-all">
      {/* Collapsible Header */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white font-['Outfit']">
                Spatial GIS Analytics & Hotspot Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Live Spatial Data
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive district concentration, jurisdiction hierarchy, and risk priority filters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Clear Filter if active */}
          {(selectedDistrict || selectedRoadType || selectedSeverity) && (
            <button
              type="button"
              onClick={() => {
                onSelectDistrict && onSelectDistrict('');
                onSelectRoadType && onSelectRoadType('');
                onSelectSeverity && onSelectSeverity('');
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              Reset Filters
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <span>{isOpen ? 'Collapse Analytics' : 'Expand Analytics'}</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-6">

          {/* Quick Severity Filter Strip */}
          <div className="flex flex-wrap items-center gap-2.5 pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" /> Filter Map:
            </span>

            <button
              type="button"
              onClick={() => onSelectSeverity && onSelectSeverity(selectedSeverity === 'Critical' ? '' : 'Critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedSeverity === 'Critical'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md ring-2 ring-rose-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
              <span>Critical ({severityCounts.Critical})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSeverity && onSelectSeverity(selectedSeverity === 'High' ? '' : 'High')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedSeverity === 'High'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-md ring-2 ring-orange-500/30'
                  : 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span>High ({severityCounts.High})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSeverity && onSelectSeverity(selectedSeverity === 'Medium' ? '' : 'Medium')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedSeverity === 'Medium'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Medium ({severityCounts.Medium})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSeverity && onSelectSeverity(selectedSeverity === 'Low' ? '' : 'Low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedSeverity === 'Low'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Low ({severityCounts.Low})</span>
            </button>
          </div>

          {/* Visual Grid: District Hotspots + Road Classification Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left (7 cols): Top District Hotspots with Resolution Bars */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    Top Maharashtra District Hotspots
                  </h3>
                  <p className="text-[11px] text-slate-400">Click a district to focus the map</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Active vs Restored
                </span>
              </div>

              <div className="space-y-2.5">
                {districtData.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No district spatial data available.</p>
                ) : (
                  districtData.map((d) => {
                    const isSelected = selectedDistrict === d.name;
                    const resolvedPct = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
                    return (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => onSelectDistrict && onSelectDistrict(isSelected ? '' : d.name)}
                        className={`w-full p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400/50 shadow-lg'
                            : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="text-amber-400 font-mono">📍</span> {d.name}
                            {isSelected && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                                Active Filter
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-rose-400 font-mono font-bold">{d.active} open</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-emerald-400 font-mono font-bold">{d.resolved} fixed</span>
                            <span className="text-slate-400 font-mono">({resolvedPct}%)</span>
                          </div>
                        </div>

                        {/* Dual colored stacked progress bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${resolvedPct}%` }}
                            title={`${d.resolved} Resolved`}
                          />
                          <div
                            className="bg-rose-500 h-full transition-all duration-500"
                            style={{ width: `${100 - resolvedPct}%` }}
                            title={`${d.active} Active`}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right (5 cols): Road Hierarchy Donut Chart */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    Road Division Hierarchy
                  </h3>
                  <p className="text-[11px] text-slate-400">Jurisdiction classification breakdown</p>
                </div>
              </div>

              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roadTypeData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {roadTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onSelectRoadType && onSelectRoadType(selectedRoadType === entry.name ? '' : entry.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Road Type Pills */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {roadTypeData.slice(0, 4).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onSelectRoadType && onSelectRoadType(selectedRoadType === item.name ? '' : item.name)}
                    className={`p-1.5 px-2 rounded-xl border text-left flex items-center justify-between text-[11px] transition-all ${
                      selectedRoadType === item.name
                        ? 'bg-slate-800 border-cyan-400 ring-1 ring-cyan-400/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium truncate">{item.name.replace(' Road', '')}</span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialAnalyticsPanel;
