import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import StatsCard from '../../components/common/StatsCard';
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
  ArrowRight
} from 'lucide-react';

const COLORS = ['#f59e0b', '#6366f1', '#06b6d4', '#10b981', '#a855f7', '#ef4444'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardData()
      .then((res) => setData(res))
      .catch((err) => console.error("Error loading admin dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Aggregating system analytics & charts..." />;

  const stats = data?.stats || {};

  return (
    <div className="space-y-8 pb-12">
      
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Road Complaints"
          value={stats.total_complaints || 0}
          subtitle="System-wide reports"
          icon={FileText}
          color="amber"
        />
        <StatsCard
          title="Active Repairs"
          value={stats.active_repairs || 0}
          subtitle="In-progress field operations"
          icon={Wrench}
          color="purple"
        />
        <StatsCard
          title="Resolved & Closed"
          value={stats.completed_repairs || 0}
          subtitle="Quality verified"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="AI Confidence Avg"
          value={`${Math.round((stats.avg_ai_confidence || 0.88) * 100)}%`}
          subtitle="YOLOv8 Neural Detection"
          icon={Cpu}
          color="cyan"
        />
      </div>

      {/* Primary Analytics Charts Grid */}
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
              <PieChart className="h-4 w-4" />
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

        <div className="overflow-x-auto">
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
      </div>

    </div>
  );
};

export default AdminDashboard;
