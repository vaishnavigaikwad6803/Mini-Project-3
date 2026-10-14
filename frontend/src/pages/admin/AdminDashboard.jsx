import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { complaintService } from '../../services/complaintService';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Loader from '../../components/common/Loader';
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
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  Shield,
  Users,
  Building2,
  HardHat,
  FileText,
  Wrench,
  CheckCircle2,
  Cpu,
  BarChart3,
  TrendingUp,
  MapPin,
  ArrowRight,
  Download,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';

const COLORS = ['#f59e0b', '#6366f1', '#06b6d4', '#10b981', '#a855f7', '#ef4444'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const loadData = () => {
    setError('');
    Promise.all([
      adminService.getDashboardData(),
      complaintService.getComplaints().catch(() => [])
    ])
      .then(([dashData, complaintsData]) => {
        setData(dashData);
        setComplaints(complaintsData || []);
      })
      .catch((err) => {
        console.error("Error loading admin dashboard:", err);
        setError('Unable to aggregate analytics from backend services. Please check connection.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const complaints = await complaintService.getComplaints();
      if (!complaints || complaints.length === 0) {
        alert("No complaints available to export.");
        return;
      }
      const headers = ["ID", "Road Name", "Road Type", "District", "State", "Status", "Priority", "AI Defect", "AI Confidence", "Authority", "Engineer Name", "Created At"];
      const rows = complaints.map((c) => [
        c.id,
        `"${(c.road_name || '').replace(/"/g, '""')}"`,
        c.road_type || 'N/A',
        c.district || 'N/A',
        c.state || 'N/A',
        c.status || 'N/A',
        c.priority || 'N/A',
        c.primary_damage_type || 'N/A',
        c.ai_confidence ? `${Math.round(c.ai_confidence * 100)}%` : 'N/A',
        `"${(c.authority_name || 'Unassigned').replace(/"/g, '""')}"`,
        `"${(c.engineer_name || 'Unassigned').replace(/"/g, '""')}"`,
        new Date(c.created_at).toISOString(),
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `RoadGuard_Complaints_Audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export complaints CSV:", err);
      alert("Failed to export complaints audit data.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Loader text="Aggregating system analytics & charts..." />;

  const stats = data?.stats || {};

  const activeComplaints = complaints.filter((c) =>
    ['Repair In Progress', 'Repair Started', 'Inspection Completed', 'Inspection Pending', 'Engineer Assigned', 'Authority Verification', 'Under Review'].includes(c.status)
  );

  const resolvedComplaints = complaints.filter((c) =>
    ['Closed', 'Repair Completed', 'Resolved'].includes(c.status)
  );

  const aiComplaints = complaints.filter((c) =>
    (c.ai_confidence && c.ai_confidence >= 0.85) || c.status === 'AI Analyzed'
  );

  const getFilteredComplaints = () => {
    switch (activeFilter) {
      case 'ACTIVE':
        return activeComplaints;
      case 'RESOLVED':
        return resolvedComplaints;
      case 'AI':
        return aiComplaints;
      case 'ALL':
      default:
        return complaints;
    }
  };

  const displayedComplaints = getFilteredComplaints();
  const totalComplaintsCount = stats.total_complaints || complaints.length || 0;
  const activeRepairsCount = stats.active_repairs || activeComplaints.length || 0;
  const completedRepairsCount = stats.completed_repairs || resolvedComplaints.length || 0;
  const aiAvgConfidence = `${Math.round((stats.avg_ai_confidence || 0.88) * 100)}%`;

  return (
    <div className="space-y-8 pb-12">

      {/* Error state banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => { setLoading(true); loadData(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                System Administrator
              </span>
              <span className="text-xs text-slate-400">RoadGuard AI Core v1.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Executive Analytics & Infrastructure Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring across road authorities, YOLOv8 computer vision triage, and lifecycle resolution rates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 hover:border-amber-500/50 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Export all complaints to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Exporting...' : 'Export CSV Audit'}
            </button>
            <Link
              to="/admin/authorities"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Authorities ({stats.total_authorities})
            </Link>
            <Link
              to="/admin/users"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Users ({stats.total_users})
            </Link>
            <Link
              to="/admin/complaints"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              All Complaints
            </Link>
          </div>
        </div>
      </div>

      {/* ── 1. Data Visualizations Grid (Swapped to Top) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Road Type Distribution Donut Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Complaints by Road Classification
              </h3>
              <p className="text-xs text-slate-400">Jurisdiction distribution across highways & streets</p>
            </div>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.road_type_distribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name.split('/')[0]} (${(percent * 100).toFixed(0)}%)`}
                >
                  {(data?.road_type_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Damage Types Classified Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                AI Detected Road Damage Types
              </h3>
              <p className="text-xs text-slate-400">Potholes, cracks & surface degradation</p>
            </div>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Cpu className="h-4 w-4" />
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.damage_type_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Monthly Trends Area Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Monthly Intake vs Resolution Rate
              </h3>
              <p className="text-xs text-slate-400">Trend velocity of reported vs repaired road defects</p>
            </div>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_trends || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="complaints" name="Complaints Logged" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorComplaints)" />
                <Area type="monotone" dataKey="resolved" name="Repairs Verified & Closed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 2. Clickable KPI Stats Grid (Swapped Below Visualizations) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Road Complaints"
          value={totalComplaintsCount}
          subtitle="System-wide reports"
          icon={FileText}
          color="amber"
          onClick={() => setActiveFilter('ALL')}
          isActive={activeFilter === 'ALL'}
        />
        <StatsCard
          title="Active Repairs"
          value={activeRepairsCount}
          subtitle="In-progress field operations"
          icon={Wrench}
          color="purple"
          onClick={() => setActiveFilter(activeFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          isActive={activeFilter === 'ACTIVE'}
        />
        <StatsCard
          title="Resolved & Closed"
          value={completedRepairsCount}
          subtitle="Quality verified"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => setActiveFilter(activeFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          isActive={activeFilter === 'RESOLVED'}
        />
        <StatsCard
          title="AI Confidence Avg"
          value={aiAvgConfidence}
          subtitle="YOLOv8 Neural Detection"
          icon={Cpu}
          color="cyan"
          onClick={() => setActiveFilter(activeFilter === 'AI' ? 'ALL' : 'AI')}
          isActive={activeFilter === 'AI'}
        />
      </div>

      {/* ── 3. Interactive Filtered Complaints Register ── */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                {activeFilter === 'ACTIVE'
                  ? '⚡ Active Field Repairs'
                  : activeFilter === 'RESOLVED'
                  ? '✅ Resolved & Closed'
                  : activeFilter === 'AI'
                  ? '🤖 High AI Confidence'
                  : '📋 All System Complaints'}
              </span>
              <span className="text-xs text-slate-400">
                {displayedComplaints.length} {displayedComplaints.length === 1 ? 'complaint' : 'complaints'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-['Outfit'] mt-1">
              {activeFilter === 'ACTIVE'
                ? 'Active Road Repair Deployments'
                : activeFilter === 'RESOLVED'
                ? 'Closed & Verified Complaints'
                : activeFilter === 'AI'
                ? 'AI Neural Classification Triage'
                : 'System Complaints Directory'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={
                activeFilter === 'ACTIVE'
                  ? '/admin/complaints?status=Repair%20In%20Progress'
                  : activeFilter === 'RESOLVED'
                  ? '/admin/complaints?status=Closed'
                  : '/admin/complaints'
              }
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1.5"
            >
              Open in Complaints Hub <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {displayedComplaints.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No complaints found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Road Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">AI Defect</th>
                  <th className="py-3 px-4">Authority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedComplaints.slice(0, 6).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      #{c.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white max-w-[200px] truncate">
                      {c.road_name}
                    </td>
                    <td className="py-3 px-4">
                      <RoadTypeBadge type={c.road_type} />
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{c.primary_damage_type || 'Road Defect'}</span>
                        {c.ai_confidence && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-semibold">
                            {Math.round(c.ai_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate">
                      {c.authority_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/citizen/complaint/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-amber-400" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authority Performance Breakdown Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-['Outfit']">
              Authority Resolution Performance
            </h3>
            <p className="text-xs text-slate-400">Jurisdiction compliance and repair turnaround speed</p>
          </div>
          <Link
            to="/admin/authorities"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            Configure Authorities <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Authority Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Total Assigned</th>
                <th className="py-3 px-4">In Progress</th>
                <th className="py-3 px-4">Resolved</th>
                <th className="py-3 px-4">Avg Resolution (Days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(data?.authority_performance || []).map((ap, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-white">{ap.authority_name}</td>
                  <td className="py-3.5 px-4 text-slate-300">{ap.authority_type}</td>
                  <td className="py-3.5 px-4 font-bold text-amber-400">{ap.total_assigned}</td>
                  <td className="py-3.5 px-4 text-purple-400 font-semibold">{ap.in_progress}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{ap.completed}</td>
                  <td className="py-3.5 px-4 text-cyan-400">{ap.avg_resolution_days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards for Authority Performance */}
        <div className="sm:hidden space-y-3">
          {(data?.authority_performance || []).map((ap, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{ap.authority_name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{ap.authority_type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total</span>
                  <strong className="text-amber-400 font-bold">{ap.total_assigned}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Active</span>
                  <strong className="text-purple-400 font-bold">{ap.in_progress}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Closed</span>
                  <strong className="text-emerald-400 font-bold">{ap.completed}</strong>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                <span>Avg. Resolution Speed:</span>
                <span className="text-cyan-400 font-semibold">{ap.avg_resolution_days} days</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
