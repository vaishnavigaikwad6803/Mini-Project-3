import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { authorityService } from '../../services/authorityService';
import { complaintService } from '../../services/complaintService';
import { engineerService } from '../../services/engineerService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Building2,
  Search,
  Filter,
  Eye,
  MapPin,
  Calendar,
  AlertCircle,
  HardHat,
  Trash2,
  RefreshCw,
  ClipboardCheck,
  CheckCircle2,
  UserCog,
  UserCheck,
  User,
  ChevronDown,
} from 'lucide-react';
import { formatDateToDDMMYY } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';

const AuthorityComplaints = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedComplaintForDelete, setSelectedComplaintForDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Reassign Engineer modal state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedComplaintForReassign, setSelectedComplaintForReassign] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [engLoading, setEngLoading] = useState(false);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [reassignRemarks, setReassignRemarks] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchComplaints = async () => {
    try {
      setError('');
      let authId = user?.authority_id;
      if (!authId) {
        const auths = await authorityService.getAuthorities();
        if (auths.length > 0) authId = auths[0].id;
      }
      if (authId) {
        const data = await authorityService.getAuthorityComplaints(authId);
        setComplaints(data);
      }
    } catch (err) {
      console.error("Error fetching authority complaints:", err);
      setError('Unable to load complaints for your authority. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const openReassignModal = async (complaint) => {
    setSelectedComplaintForReassign(complaint);
    setSelectedEngineerId('');
    setReassignRemarks('');
    setReassignModalOpen(true);
    setEngLoading(true);
    try {
      let authId = user?.authority_id;
      if (!authId) {
        const auths = await authorityService.getAuthorities();
        if (auths.length > 0) authId = auths[0].id;
      }
      const params = authId ? { authority_id: authId } : {};
      const engs = await engineerService.getEngineers(params);
      setEngineers(engs);
    } catch (err) {
      showToast('Failed to load engineers list.', 'error');
    } finally {
      setEngLoading(false);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEngineerId) {
      showToast('Please select an engineer to reassign.', 'error');
      return;
    }
    if (selectedComplaintForReassign?.engineer_id && String(selectedEngineerId) === String(selectedComplaintForReassign.engineer_id)) {
      showToast('This engineer is already assigned to the complaint.', 'error');
      return;
    }
    setReassigning(true);
    try {
      await engineerService.assignEngineerToComplaint(
        selectedComplaintForReassign.id,
        selectedEngineerId,
        reassignRemarks || 'Engineer reassigned by authority.',
        null
      );
      const prevName = selectedComplaintForReassign?.engineer_name || 'previous engineer';
      const newEng = engineers.find(e => String(e.id) === String(selectedEngineerId));
      showToast(
        `Engineer reassigned from ${prevName} to ${newEng?.full_name || 'new engineer'} successfully.`,
        'success'
      );
      setReassignModalOpen(false);
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to reassign engineer.', 'error');
    } finally {
      setReassigning(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const openDeleteModal = (complaint) => {
    setSelectedComplaintForDelete(complaint);
    setDeleteReason('');
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintForDelete) return;
    if (!deleteReason || deleteReason.trim().length < 3) {
      showToast('Please provide a valid deletion reason (minimum 3 characters).', 'error');
      return;
    }

    setDeleting(true);
    try {
      await complaintService.deleteComplaint(selectedComplaintForDelete.id, deleteReason.trim());
      showToast(`Complaint #${selectedComplaintForDelete.id} deleted successfully.`, 'success');
      setDeleteModalOpen(false);
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete complaint.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(term) ||
        c.road_name.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term) ||
        (c.citizen_name && c.citizen_name.toLowerCase().includes(term)) ||
        (c.engineer_name && c.engineer_name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // ── Chart derived data ──────────────────────────────────────────────────────
  const pendingCount = complaints.filter(
    (c) => c.status === 'Authority Assigned' || c.status === 'Submitted' || c.status === 'AI Analyzed'
  ).length;
  const repairCount = complaints.filter(
    (c) =>
      c.status === 'Engineer Assigned' ||
      c.status === 'Repair In Progress' ||
      c.status === 'Inspection Completed' ||
      c.status === 'Repair Started' ||
      c.status === 'Inspection Pending'
  ).length;
  const signOffCount = complaints.filter(
    (c) => c.status === 'Authority Verification' || c.status === 'Repair Completed'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'Closed' || c.status === 'Resolved'
  ).length;

  const total = complaints.length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const barData = [
    { name: t('authority.damageReported', 'Damage Reported'), count: pendingCount,  fill: '#f59e0b', bg: 'from-amber-500/20 to-amber-500/5',   border: 'border-amber-500/30',   text: 'text-amber-400',   status: 'Authority Assigned' },
    { name: t('authority.underRepair', 'Under Repair'),    count: repairCount,   fill: '#a855f7', bg: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30',  text: 'text-purple-400',  status: 'Engineer Assigned' },
    { name: t('authority.readySignOff', 'Ready for Sign-Off'), count: signOffCount, fill: '#06b6d4', bg: 'from-cyan-500/20 to-cyan-500/5',   border: 'border-cyan-500/30',    text: 'text-cyan-400',    status: 'Authority Verification' },
    { name: t('authority.resolvedClosed', 'Resolved & Closed'),  count: resolvedCount, fill: '#10b981', bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400', status: 'Closed' },
  ];

  const pieData = barData.filter((d) => d.count > 0).map((d) => ({
    name: d.name,
    value: d.count,
    fill: d.fill,
  }));

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = barData.find((b) => b.name === payload[0]?.payload?.name);
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
          <p className="font-bold text-white mb-1">{payload[0]?.payload?.name}</p>
          <p style={{ color: d?.fill }} className="font-extrabold text-base">
            {payload[0]?.value} complaints
          </p>
          {total > 0 && (
            <p className="text-slate-400 mt-0.5">
              {Math.round((payload[0]?.value / total) * 100)}% of total
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
          <p className="font-bold text-white mb-0.5">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.fill }} className="font-extrabold text-base">
            {payload[0].value}
          </p>
          <p className="text-slate-400">{Math.round((payload[0].value / total) * 100)}%</p>
        </div>
      );
    }
    return null;
  };
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Error state banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchComplaints(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
          {t('authority.complaintsBadge', 'Authority Records')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
          {t('authority.complaintsTitle', 'Jurisdiction Road Complaints')}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {t('authority.complaintsSubtitle', 'Manage all incoming, in-repair, and verified road damage reports assigned to your division.')}
        </p>
      </div>

      {/* ── Complaint Analytics Chart ─────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Jurisdiction Complaint Analytics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Status-wise breakdown across all {total} reported road damage complaints in your jurisdiction
            </p>
          </div>

          {/* Summary totals */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center min-w-[90px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Total</p>
              <p className="text-2xl font-extrabold text-white font-['Outfit']">{total}</p>
              <p className="text-[10px] text-slate-400">Complaints</p>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[90px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Resolved</p>
              <p className="text-2xl font-extrabold text-emerald-300 font-['Outfit']">{resolvedCount}</p>
              <p className="text-[10px] text-slate-400">{resolutionRate}% rate</p>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Bar Chart — 3/5 width */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Complaints by Stage</p>
            {total === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
                No complaint data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tickFormatter={(v) => {
                      const map = {
                        'Damage Reported': 'Reported',
                        'Under Repair': 'Repair',
                        'Ready for Sign-Off': 'Sign-Off',
                        'Resolved & Closed': 'Resolved',
                      };
                      return map[v] || v;
                    }}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={64}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Clickable mini stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {barData.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setStatusFilter(item.status)}
                  className={`p-3 rounded-xl bg-gradient-to-b ${item.bg} border ${item.border} text-center hover:scale-[1.03] transition-all ${statusFilter === item.status ? 'ring-2 ring-offset-1 ring-offset-slate-900' : ''}`}
                  style={statusFilter === item.status ? { ringColor: item.fill } : {}}
                >
                  <p className={`text-xl font-extrabold font-['Outfit'] ${item.text}`}>{item.count}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {total > 0 ? `${Math.round((item.count / total) * 100)}%` : '—'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Donut Pie Chart — 2/5 width */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distribution Overview</p>
            {total === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-xs">No data to display</div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.fill} fillOpacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-white font-['Outfit']">{resolutionRate}%</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">Resolved</span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="space-y-1.5">
              {barData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.fill }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.count}</span>
                    <span className="text-slate-500 w-8 text-right">
                      {total > 0 ? `${Math.round((item.count / total) * 100)}%` : '—'}
                    </span>
                  </div>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Total Assigned</span>
                <span className="font-extrabold text-white">{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution progress bar */}
        {total > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Overall Resolution Progress
              </span>
              <span className="font-bold text-emerald-300">
                {resolvedCount} / {total} complaints resolved ({resolutionRate}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>0%</span>
              <span className="text-emerald-500 font-semibold">{resolutionRate}% Complete</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>
      {/* ────────────────────────────────────────────────────────────────────────── */}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={t('authority.searchPlaceholder', 'Search by Complaint ID, Road Name, Engineer, or Location...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">{t('common.all', 'All Statuses')}</option>
          <option value="Authority Assigned">{t('status.PENDING', 'Authority Assigned')}</option>
          <option value="Engineer Assigned">{t('status.ENGINEER_ASSIGNED', 'Engineer Assigned')}</option>
          <option value="Inspection Completed">{t('status.VERIFIED', 'Inspected')}</option>
          <option value="Repair In Progress">{t('status.IN_PROGRESS', 'In Repair')}</option>
          <option value="Repair Completed">{t('status.REPAIR_COMPLETED', 'Repair Completed')}</option>
          <option value="Authority Verification">{t('status.AUTHORITY_VERIFICATION', 'Under Verification')}</option>
          <option value="Closed">{t('status.CLOSED', 'Closed')}</option>
        </select>

        {(statusFilter !== 'ALL' || searchTerm) && (
          <button
            type="button"
            onClick={() => { setStatusFilter('ALL'); setSearchTerm(''); }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t('common.clearFilters', 'Clear Filters')}
          </button>
        )}
      </div>

      {/* Complaints List */}
      {loading ? (
        <Loader text="Loading complaints..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={complaints.length === 0 ? "No Complaints Assigned" : "No Matching Complaints"}
          description={
            complaints.length === 0
              ? "There are currently no road damage complaints assigned to your jurisdiction."
              : "No records match your active search filter. Try clearing your filters or search keywords."
          }
          actionLabel={complaints.length > 0 ? "Clear Filters" : undefined}
          onAction={complaints.length > 0 ? () => { setSearchTerm(''); setStatusFilter('ALL'); } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden sm:block p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{t('table.id', 'ID')}</th>
                    <th className="py-3 px-4">{t('common.date', 'Date')}</th>
                    <th className="py-3 px-4">{t('table.road', 'Road Name')}</th>
                    <th className="py-3 px-4">{t('table.location', 'Location')}</th>
                    <th className="py-3 px-4">{t('table.roadType', 'Road Type')}</th>
                    <th className="py-3 px-4">{t('table.damageType', 'AI Defect & Severity')}</th>
                    <th className="py-3 px-4">{t('common.assignedTo', 'Engineer Name')}</th>
                    <th className="py-3 px-4 text-violet-300">Reassign Engineer</th>
                    <th className="py-3 px-4">{t('table.raisedBy', 'Raised By')}</th>
                    <th className="py-3 px-4">{t('table.status', 'Status & Deadline')}</th>
                    <th className="py-3 px-4 text-right">{t('table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <span className="font-medium text-slate-200 block">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                        {c.created_at && (
                          <span className="text-[11px] text-slate-400 block">
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
                        <span className="font-semibold text-slate-200 block">{c.primary_damage_type || 'Road Defect'}</span>
                        {c.ai_confidence && (
                          <span className="text-[10px] text-cyan-400">
                            AI: {Math.round(c.ai_confidence * 100)}% ({c.ai_severity || 'Medium'})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {c.engineer_name ? (
                          <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                            <HardHat className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            <span>{c.engineer_name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      {/* Reassign Engineer column */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => openReassignModal(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-100 font-semibold text-xs border border-violet-500/30 hover:border-violet-400/50 transition-all shadow-sm"
                          title="Reassign to a different engineer"
                        >
                          <UserCog className="h-3.5 w-3.5 shrink-0" />
                          {c.engineer_name ? 'Reassign' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold text-slate-200">{c.citizen_name || 'Citizen'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium ml-5">
                            ({c.citizen_role ? (c.citizen_role.charAt(0).toUpperCase() + c.citizen_role.slice(1).toLowerCase()) : 'Citizen'})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                        {(c.deadline || c.repair?.deadline) && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>Due: {formatDateToDDMMYY(c.deadline || c.repair?.deadline)}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(c.status === 'Authority Verification' || c.status === 'Repair Completed') && (
                            <Link
                              to={`/complaints/${c.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                              title="Review & Verify Repair"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" /> Verify
                            </Link>
                          )}
                          <Link
                            to={`/complaints/${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white font-semibold text-xs border border-rose-500/30 transition-colors shadow-sm"
                            title="Delete Complaint"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                  <div className="flex items-center gap-2">
                    {c.created_at && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    <StatusBadge status={c.status} size="xs" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{c.road_name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">📍 {c.district} • {c.primary_damage_type || 'Road Defect'}</p>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1 font-medium">
                    <User className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-400">Raised By:</span>
                    <span className="text-white font-semibold">{c.citizen_name || 'Citizen'}</span>
                    <span className="text-slate-400 text-[11px]">({c.citizen_role ? (c.citizen_role.charAt(0).toUpperCase() + c.citizen_role.slice(1).toLowerCase()) : 'Citizen'})</span>
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Engineer:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-cyan-300">{c.engineer_name || 'Unassigned'}</span>
                    <button
                      type="button"
                      onClick={() => openReassignModal(c)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-semibold text-[10px] border border-violet-500/30 transition-colors"
                      title="Reassign Engineer"
                    >
                      <UserCog className="h-3 w-3" />
                      {c.engineer_name ? 'Reassign' : 'Assign'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  {(c.status === 'Authority Verification' || c.status === 'Repair Completed') && (
                    <Link
                      to={`/complaints/${c.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-sm"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" /> Verify
                    </Link>
                  )}
                  <Link
                    to={`/complaints/${c.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white font-semibold text-xs border border-rose-500/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Complaint Reason Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Delete Complaint: ${selectedComplaintForDelete?.id}`}
      >
        <form onSubmit={handleDeleteSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              Warning: Irreversible Complaint Deletion
            </p>
            <p className="text-[11px] text-rose-200">
              You are about to delete complaint <strong>{selectedComplaintForDelete?.id}</strong> ({selectedComplaintForDelete?.road_name}). A mandatory reason must be provided for audit records and citizen notification.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Reason for Deletion * <span className="text-rose-400 font-normal">(Required)</span>
            </label>
            <textarea
              rows={3}
              required
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Duplicate complaint report, invalid location outside municipal boundary, or test submission..."
              className="input-field border-rose-500/50 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={deleting || !deleteReason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? t('authority.deleting', 'Deleting...') : t('authority.confirmDelete', 'Confirm Delete')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign Engineer Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={`Reassign Engineer — ${selectedComplaintForReassign?.id}`}
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
          {/* Current engineer info */}
          <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-1">
            <p className="font-bold text-violet-300 flex items-center gap-1.5">
              <UserCog className="h-4 w-4 shrink-0" />
              Reassign Engineer for Complaint
            </p>
            <p className="text-[11px] text-slate-300">
              Road: <strong className="text-white">{selectedComplaintForReassign?.road_name}</strong>
              {' '}· {selectedComplaintForReassign?.district}
            </p>
            {selectedComplaintForReassign?.engineer_name ? (
              <div className="mt-1.5 flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                <HardHat className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400">Current Engineer:</span>
                <span className="font-bold text-cyan-300">{selectedComplaintForReassign.engineer_name}</span>
                <span className="ml-auto text-[10px] text-rose-400 font-semibold">Will be removed</span>
              </div>
            ) : (
              <p className="text-[11px] text-amber-400 mt-1">⚠ No engineer currently assigned.</p>
            )}
          </div>

          {/* Engineer selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Select New Engineer * <span className="text-violet-400 font-normal">(Required)</span>
            </label>
            {engLoading ? (
              <div className="flex items-center gap-2 py-3 text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading engineers...
              </div>
            ) : engineers.length === 0 ? (
              <p className="text-amber-400 py-2">No engineers available for this authority.</p>
            ) : (
              <div className="relative">
                <select
                  value={selectedEngineerId}
                  onChange={(e) => setSelectedEngineerId(e.target.value)}
                  required
                  className="w-full bg-slate-950 rounded-xl border border-slate-700 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 appearance-none pr-8"
                >
                  <option value="">-- Select an Engineer --</option>
                  {engineers.map((eng) => (
                    <option
                      key={eng.id}
                      value={eng.id}
                      disabled={String(eng.id) === String(selectedComplaintForReassign?.engineer_id)}
                    >
                      {eng.full_name} ({eng.employee_id})
                      {eng.active_workload !== undefined ? ` · ${eng.active_workload} active` : ''}
                      {String(eng.id) === String(selectedComplaintForReassign?.engineer_id) ? ' [Current]' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Preview new assignment */}
          {selectedEngineerId && (() => {
            const newEng = engineers.find(e => String(e.id) === String(selectedEngineerId));
            return newEng ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-emerald-300 font-bold text-xs">{newEng.full_name}</p>
                  <p className="text-[10px] text-slate-400">{newEng.employee_id} · {newEng.active_workload ?? 0} active assignments</p>
                </div>
              </div>
            ) : null;
          })()}

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Remarks <span className="text-slate-500 font-normal">(Optional)</span></label>
            <textarea
              rows={2}
              value={reassignRemarks}
              onChange={(e) => setReassignRemarks(e.target.value)}
              placeholder="e.g. Previous engineer unavailable, reassigning based on district proximity..."
              className="w-full bg-slate-950 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reassigning || !selectedEngineerId}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <UserCog className="h-3.5 w-3.5" />
              {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AuthorityComplaints;
