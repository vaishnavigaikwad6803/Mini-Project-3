import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { engineerService } from '../../services/engineerService';
import { repairService } from '../../services/repairService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import StatsCard from '../../components/common/StatsCard';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import CameraCapture from '../../components/common/CameraCapture';
import { formatDateToDDMMYY } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  HardHat,
  Wrench,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Calendar,
  TrendingUp,
  Activity,
  X,
} from 'lucide-react';

const REPAIR_STAGES = [
  { value: 'Inspection Pending', label: '1. Inspection Pending' },
  { value: 'Inspection Completed', label: '2. Inspection Completed' },
  { value: 'Repair Started', label: '3. Repair Started' },
  { value: 'Repair In Progress', label: '4. Repair In Progress' },
  { value: 'Repair Completed', label: '5. Repair Completed (Damage Resolved - Photo Required)' },
];

const CHART_COLORS = ['#a855f7', '#f59e0b', '#06b6d4', '#10b981', '#6366f1', '#ef4444'];

const DarkTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs shadow-xl">
        {label && <p className="text-slate-400 mb-1 font-medium">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-bold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FILTER_ALL = 'all';
const FILTER_INSPECTION = 'inspection';
const FILTER_IN_REPAIR = 'inRepair';
const FILTER_COMPLETED = 'completed';

const EngineerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [repairData, setRepairData] = useState({
    stage: 'Repair In Progress',
    remarks: '',
    materials_used: 'Cold Bituminous Mix, Bitumen Emulsion Tack Coat, 10mm Aggregate',
    actual_cost: 14000,
  });
  const [completionImage, setCompletionImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      setError('');
      let engId = user?.engineer_id;
      if (!engId) {
        const engs = await engineerService.getEngineers();
        if (engs.length > 0) engId = engs[0].id;
      }
      if (engId) {
        const data = await engineerService.getEngineerAssignments(engId);
        setAssignments(data);
      }
    } catch (err) {
      console.error("Error fetching engineer dashboard:", err);
      setError('Unable to load assigned jobs. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const openUpdateModal = (complaint, initialStage = null) => {
    setSelectedComplaint(complaint);
    const targetStage = initialStage || complaint.repair?.current_stage || 'Repair In Progress';
    setRepairData({
      stage: targetStage,
      remarks: complaint.repair?.inspection_remarks || '',
      materials_used: complaint.repair?.materials_used || 'Cold Bituminous Mix, Bitumen Emulsion Tack Coat, 10mm Aggregate',
      actual_cost: complaint.repair?.actual_cost || 14000,
    });
    setCompletionImage(null);
    setImagePreview(complaint.repair?.repair_after_image || null);
    setModalOpen(true);
  };

  const handleStageSubmit = async (e) => {
    e.preventDefault();
    const repairId = selectedComplaint?.repair?.id || selectedComplaint?.repair_id;
    if (!repairId) {
      showToast('Repair record not found for this complaint.', 'error');
      return;
    }

    if (repairData.stage === 'Repair Completed' && !completionImage && !selectedComplaint.repair?.repair_after_image && !imagePreview) {
      showToast('Mandatory: You must capture a live photo of the completed repair before resolving!', 'error');
      return;
    }

    setSubmitting(true);

    try {
      if (repairData.stage === 'Repair Completed' && completionImage) {
        const formData = new FormData();
        formData.append('completion_image', completionImage);
        formData.append('completion_remarks', repairData.remarks || 'Repairs completed according to standard pavement compaction.');
        if (repairData.materials_used) formData.append('materials_used', repairData.materials_used);
        if (repairData.actual_cost) formData.append('actual_cost', repairData.actual_cost);

        await repairService.submitRepairCompletion(repairId, formData);
        showToast(`Repair marked Resolved with photo proof and submitted for Authority Verification!`, 'success');
      } else if (completionImage) {
        const formData = new FormData();
        formData.append('current_stage', repairData.stage);
        formData.append('remarks', repairData.remarks || `Stage progress updated to ${repairData.stage}`);
        if (repairData.materials_used) formData.append('materials_used', repairData.materials_used);
        if (repairData.actual_cost) formData.append('actual_cost', repairData.actual_cost);
        formData.append('stage_image', completionImage);

        await repairService.updateRepairStage(repairId, formData);
        showToast(`Repair stage updated to '${repairData.stage}' with photo proof!`, 'success');
      } else {
        await repairService.updateRepairStage(repairId, {
          current_stage: repairData.stage,
          remarks: repairData.remarks,
          materials_used: repairData.materials_used,
          actual_cost: repairData.actual_cost,
        });
        showToast(`Repair stage updated to '${repairData.stage}'!`, 'success');
      }

      setModalOpen(false);
      fetchAssignments();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update repair stage', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading engineer workstation..." />;

  // ── Derived filtered lists ──
  const pendingInspection = assignments.filter(
    (a) => a.status === 'Engineer Assigned' || a.status === 'Inspection Pending'
  );
  const inRepair = assignments.filter(
    (a) => a.status === 'Inspection Completed' || a.status === 'Repair Started' || a.status === 'Repair In Progress'
  );
  const completed = assignments.filter(
    (a) => a.status === 'Repair Completed' || a.status === 'Authority Verification' || a.status === 'Closed'
  );

  const filteredAssignments = (() => {
    switch (activeFilter) {
      case FILTER_INSPECTION: return pendingInspection;
      case FILTER_IN_REPAIR:  return inRepair;
      case FILTER_COMPLETED:  return completed;
      default:                return assignments;
    }
  })();

  // ── Chart data ──
  const stageChartData = [
    { name: 'Inspection Needed', value: pendingInspection.length, fill: '#f59e0b' },
    { name: 'In Repair',         value: inRepair.length,          fill: '#06b6d4' },
    { name: 'Completed',         value: completed.length,         fill: '#10b981' },
  ].filter((d) => d.value > 0);



  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  });
  const activityMap = {};
  assignments.forEach((a) => {
    if (a.created_at) {
      const key = new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      activityMap[key] = (activityMap[key] || 0) + 1;
    }
  });
  const activityData = last7.map((day) => ({ day, tasks: activityMap[day] || 0 }));

  const isResolvedStage = repairData.stage === 'Repair Completed';
  const hasUploadedImage = Boolean(completionImage || imagePreview || selectedComplaint?.repair?.repair_after_image);

  const filterLabel = {
    [FILTER_ALL]:        `All Assignments (${assignments.length})`,
    [FILTER_INSPECTION]: `Inspection Needed (${pendingInspection.length})`,
    [FILTER_IN_REPAIR]:  `Repairs in Progress (${inRepair.length})`,
    [FILTER_COMPLETED]:  `Completed / Closed (${completed.length})`,
  }[activeFilter];

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
            onClick={() => { setLoading(true); fetchAssignments(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/50 border border-slate-800 shadow-2xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">
            {t('engineer.portalTitle')}
          </span>
          <span className="text-xs font-mono text-slate-400">
            Badge: {user?.employee_id || 'ENG-101'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
          {t('engineer.workstationTitle')}
        </h1>
        <p className="text-xs text-slate-400">
          Execute site inspections, update repair milestones, and capture live photo proof to resolve road damage.
        </p>
      </div>

      {/* ── Data Visualizations (charts row first) ── */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* 1. Repair Stage Donut */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">Repair Stages</h3>
                <p className="text-[11px] text-slate-400">Current workload breakdown</p>
              </div>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Activity className="h-4 w-4" />
              </span>
            </div>
            {stageChartData.length > 0 ? (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stageChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {stageChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {stageChartData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.fill }} />
                        <span className="text-slate-400">{d.name}</span>
                      </div>
                      <span className="font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-500">No data yet</div>
            )}
          </div>

          {/* 2. 7-Day Activity Sparkline */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">Task Activity</h3>
                <p className="text-[11px] text-slate-400">Assignments over last 7 days</p>
              </div>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area
                    type="monotone" dataKey="tasks" name="Tasks"
                    stroke="#10b981" strokeWidth={2}
                    fill="url(#actGrad)"
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5, fill: '#10b981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Clickable Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('engineer.assignedRepairs')}
          value={assignments.length}
          subtitle="All tasks"
          icon={HardHat}
          color="purple"
          onClick={() => setActiveFilter(FILTER_ALL)}
          isActive={activeFilter === FILTER_ALL}
        />
        <StatsCard
          title={t('status.VERIFIED')}
          value={pendingInspection.length}
          subtitle="Awaiting site visit"
          icon={Clock}
          color="amber"
          onClick={() => setActiveFilter(activeFilter === FILTER_INSPECTION ? FILTER_ALL : FILTER_INSPECTION)}
          isActive={activeFilter === FILTER_INSPECTION}
        />
        <StatsCard
          title={t('status.IN_PROGRESS')}
          value={inRepair.length}
          subtitle="Work underway"
          icon={Wrench}
          color="cyan"
          onClick={() => setActiveFilter(activeFilter === FILTER_IN_REPAIR ? FILTER_ALL : FILTER_IN_REPAIR)}
          isActive={activeFilter === FILTER_IN_REPAIR}
        />
        <StatsCard
          title={t('status.CLOSED')}
          value={completed.length}
          subtitle="Signed off"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => setActiveFilter(activeFilter === FILTER_COMPLETED ? FILTER_ALL : FILTER_COMPLETED)}
          isActive={activeFilter === FILTER_COMPLETED}
        />
      </div>

      {/* ── Filtered Assignments Table ── */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">{filterLabel}</h2>
            <p className="text-xs text-slate-400">
              {activeFilter === FILTER_ALL
                ? 'Click a stat card above to filter by category'
                : 'Click the active card again or use Clear Filter to show all'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeFilter !== FILTER_ALL && (
              <button
                onClick={() => setActiveFilter(FILTER_ALL)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> {t('common.clearFilters')}
              </button>
            )}
            <Link
              to="/engineer/assignments"
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              Manage Operations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold mt-2">
              {activeFilter === FILTER_ALL ? 'No active repair tasks assigned.' : 'No tasks match this filter.'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeFilter === FILTER_ALL ? 'Tasks dispatched by road authorities will appear here.' : 'Try a different category or clear the filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{t('table.id')}</th>
                    <th className="py-3 px-4">{t('table.date')}</th>
                    <th className="py-3 px-4">{t('table.roadName')}</th>
                    <th className="py-3 px-4">{t('table.location')}</th>
                    <th className="py-3 px-4">{t('table.roadType')}</th>
                    <th className="py-3 px-4">{t('table.aiDetection')}</th>
                    <th className="py-3 px-4">{t('table.priority')}</th>
                    <th className="py-3 px-4">{t('table.status')} & {t('common.deadline')}</th>
                    <th className="py-3 px-4 text-right">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAssignments.map((c) => {
                    const canDirectResolve = ['Repair Started', 'Repair In Progress', 'Inspection Completed'].includes(c.status);
                    const isDamageCompleted = ['Repair Completed', 'Authority Verification', 'Closed'].includes(c.status);

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          <span className="font-medium text-slate-200 block">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                          {c.created_at && (
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block max-w-xs truncate">{c.road_name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <Link
                            to={`/map?id=${encodeURIComponent(c.id)}${c.latitude && c.longitude ? `&lat=${c.latitude}&lng=${c.longitude}` : ''}`}
                            className="flex items-start gap-1.5 group cursor-pointer hover:bg-slate-800/80 p-1.5 -m-1.5 rounded-xl transition-all"
                            title="Click to locate on Live GIS Map"
                          >
                            <MapPin className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0 group-hover:scale-110 group-hover:text-amber-300 transition-transform" />
                            <div>
                              <span className="text-white font-medium block group-hover:text-amber-400 group-hover:underline underline-offset-2 transition-colors">
                                {c.district ? `${c.district}, ${c.state || ''}` : 'Location Pin'}
                              </span>
                              {c.landmark ? (
                                <span className="text-[10px] text-slate-400 block truncate max-w-[140px] group-hover:text-slate-300">{c.landmark}</span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono block group-hover:text-slate-400">
                                  {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <RoadTypeBadge roadType={c.road_type} />
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200 block">{c.primary_damage_type || 'Defect'}</span>
                          {c.ai_confidence && (
                            <span className="text-[10px] text-cyan-400">
                              AI: {Math.round(c.ai_confidence * 100)}%
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              c.priority === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                            {c.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={c.status} />
                          {(c.deadline || c.repair?.deadline) && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>Due: {formatDateToDDMMYY(c.deadline || c.repair?.deadline)}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isDamageCompleted ? (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                              Completed
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openUpdateModal(c)}
                                className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md inline-flex items-center gap-1 transition-all"
                              >
                                <Wrench className="h-3.5 w-3.5" /> Update
                              </button>
                              {canDirectResolve && (
                                <button
                                  onClick={() => openUpdateModal(c, 'Repair Completed')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 inline-flex items-center gap-1 transition-all"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredAssignments.map((c) => {
                const canDirectResolve = ['Repair Started', 'Repair In Progress', 'Inspection Completed'].includes(c.status);
                const isDamageCompleted = ['Repair Completed', 'Authority Verification', 'Closed'].includes(c.status);

                return (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                      <StatusBadge status={c.status} size="xs" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{c.road_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">📍 {c.district} • {c.primary_damage_type || 'Defect'}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      {isDamageCompleted ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                          Completed
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => openUpdateModal(c)}
                            className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md inline-flex items-center gap-1"
                          >
                            <Wrench className="h-3.5 w-3.5" /> Update
                          </button>
                          {canDirectResolve && (
                            <button
                              onClick={() => openUpdateModal(c, 'Repair Completed')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Update Repair Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Road Repair Management: ${selectedComplaint?.id}`}
      >
        <form onSubmit={handleStageSubmit} className="space-y-4 text-xs">

          {/* Incident Context & Original Reported Defect (Before Photo) */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-400 font-bold">{selectedComplaint?.id}</span>
              <span className="text-slate-400 text-[11px]">📍 {selectedComplaint?.district}</span>
            </div>
            <h4 className="font-bold text-white text-sm">{selectedComplaint?.road_name}</h4>
            <p className="text-[11px] text-slate-400">
              Defect: <strong className="text-slate-300">{selectedComplaint?.primary_damage_type || 'Road Defect'}</strong>
            </p>
            
            {/* Before Defect Image */}
            {selectedComplaint?.image_url && (
              <div className="pt-1.5 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-rose-400 block mb-1">
                  📸 Citizen Reported Damage (Before Image):
                </span>
                <div className="h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={selectedComplaint.image_url}
                    alt="Original Damage"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Current Progress Stage *</label>
            <select
              value={repairData.stage}
              onChange={(e) => setRepairData({ ...repairData, stage: e.target.value })}
              className="input-field cursor-pointer"
            >
              {REPAIR_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Materials Used / Mixture Specification</label>
            <input
              type="text"
              value={repairData.materials_used}
              onChange={(e) => setRepairData({ ...repairData, materials_used: e.target.value })}
              placeholder="e.g. Cold Bituminous Mix, Bitumen Emulsion Tack Coat, 10mm Aggregate"
              className="input-field"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Estimated / Actual Incurred Cost (₹)</label>
            <input
              type="number"
              value={repairData.actual_cost}
              onChange={(e) => setRepairData({ ...repairData, actual_cost: parseFloat(e.target.value) || 0 })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Inspection / Work Progress Remarks</label>
            <textarea
              rows={3}
              value={repairData.remarks}
              onChange={(e) => setRepairData({ ...repairData, remarks: e.target.value })}
              placeholder="Describe surface preparation, depth leveling, compaction passes, or traffic barricading..."
              className="input-field"
            />
          </div>

          {/* Photo Capture Section - Available for Every Stage */}
          <div className={`p-4 rounded-2xl bg-slate-950 border-2 space-y-3 shadow-lg transition-all ${
            isResolvedStage ? 'border-emerald-500/50' : 'border-purple-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`block font-bold flex items-center gap-1.5 text-xs ${
                isResolvedStage ? 'text-emerald-400' : 'text-purple-300'
              }`}>
                📸 {isResolvedStage ? 'Take Live Photo of Repaired Road *' : `Take Live Photo for Current Stage: ${repairData.stage}`}
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                isResolvedStage
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}>
                {isResolvedStage ? 'MANDATORY FOR RESOLUTION' : 'LIVE PHOTO PROOF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isResolvedStage
                ? 'When damage repair is completed, you must capture a live photo of the repaired road surface as proof. The Resolved button will be displayed once the photo is captured.'
                : `Capture a live photo using the device camera to document on-site status for stage "${repairData.stage}".`}
            </p>

            <div className="space-y-2">
              {!completionImage && !imagePreview && (
                <CameraCapture
                  enableAiValidation={false}
                  allowFileUpload={false}
                  title={`${repairData.stage} Photo Proof`}
                  subtitle={`Field evidence for stage: ${repairData.stage}`}
                  capturePrompt={`Take Live Photo for ${repairData.stage}`}
                  captureDescription={`Take a live photo of the road site to document milestone: ${repairData.stage}`}
                  onImageCapture={(file) => {
                    setCompletionImage(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                  onImageClear={() => {
                    setCompletionImage(null);
                    setImagePreview(null);
                  }}
                />
              )}

              {imagePreview && (
                <div className={`relative mt-2 rounded-xl overflow-hidden border-2 shadow-md ${
                  isResolvedStage ? 'border-emerald-500/60' : 'border-purple-500/60'
                }`}>
                  <img src={imagePreview} alt="Stage Progress Photo Proof" className="h-44 w-full object-cover" />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Photo Attached for: {repairData.stage}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCompletionImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white text-[10px] font-bold shadow-md"
                  >
                    Retake Live Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Conditional Display of Resolved button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>

            <div className="w-full sm:w-auto flex items-center justify-end">
              {isResolvedStage ? (
                hasUploadedImage ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {submitting ? 'Resolving Repair...' : 'Resolved (Submit for Verification)'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                    <span>Capture live photo above to display <strong>Resolved</strong> button</span>
                  </div>
                )
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {submitting
                    ? 'Updating...'
                    : completionImage
                    ? `Save Stage Progress (${repairData.stage} with Photo)`
                    : 'Save Stage Progress'}
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default EngineerDashboard;
