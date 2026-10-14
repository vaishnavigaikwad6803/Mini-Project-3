import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { authorityService } from '../../services/authorityService';
import { engineerService } from '../../services/engineerService';
import { complaintService } from '../../services/complaintService';
import { repairService } from '../../services/repairService';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Modal from '../../components/common/Modal';
import ComplaintMap from '../../components/map/ComplaintMap';
import Loader from '../../components/common/Loader';
import {
  Building2,
  HardHat,
  FileText,
  Wrench,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  MapPin,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  ClipboardCheck,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  Filter,
  Calendar
} from 'lucide-react';

const AuthorityDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [authority, setAuthority] = useState(null);
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive KPI Filter & Search
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Assign Engineer Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Authority Repair Verification Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [activeVerifyComplaint, setActiveVerifyComplaint] = useState(null);
  const [isApproved, setIsApproved] = useState(true);
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const loadAuthorityData = async () => {
    try {
      setError('');
      // Find user's authority
      let authId = user?.authority_id;
      if (!authId) {
        const allAuths = await authorityService.getAuthorities();
        if (allAuths.length > 0) {
          authId = allAuths[0].id;
        }
      }

      if (authId) {
        const [authData, statsData, complaintsData, engineersData] = await Promise.all([
          authorityService.getAuthorityById(authId),
          authorityService.getAuthorityStats(authId),
          authorityService.getAuthorityComplaints(authId),
          engineerService.getEngineers({ authority_id: authId }),
        ]);

        setAuthority(authData);
        setStats(statsData);
        setComplaints(complaintsData);
        setEngineers(engineersData);
        if (engineersData.length > 0) setSelectedEngineerId(engineersData[0].id);
      }
    } catch (err) {
      console.error("Error loading authority dashboard:", err);
      setError('Unable to load jurisdiction data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthorityData();
  }, [user]);

  const openAssignModal = (complaint) => {
    setActiveComplaint(complaint);
    setAssignRemarks(`Assigned for urgent inspection & repair on ${complaint.road_name}.`);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setAssignDeadline(defaultDate.toISOString().split('T')[0]);
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint || !selectedEngineerId) return;
    setActionLoading(true);
    try {
      await engineerService.assignEngineerToComplaint(
        activeComplaint.id,
        selectedEngineerId,
        assignRemarks,
        assignDeadline
      );
      showToast(`Engineer assigned to #${activeComplaint.id} successfully!`, 'success');
      setAssignModalOpen(false);
      loadAuthorityData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Assignment failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openVerifyModal = (complaint) => {
    setActiveVerifyComplaint(complaint);
    setIsApproved(true);
    setVerificationRemarks('Repair inspected and approved according to pavement specifications.');
    setVerifyModalOpen(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const repairId = activeVerifyComplaint?.repair?.id || activeVerifyComplaint?.repair_id;
    if (!repairId) {
      showToast('No active repair record found to verify.', 'error');
      return;
    }
    setVerifyLoading(true);
    try {
      await repairService.verifyAndCloseRepair(repairId, {
        is_approved: isApproved,
        verification_remarks: verificationRemarks.trim() || (isApproved ? 'Approved by Authority Officer' : 'Rework requested by Authority Officer'),
      });
      showToast(
        isApproved
          ? `Complaint #${activeVerifyComplaint.id} quality-verified and marked Closed!`
          : `Complaint #${activeVerifyComplaint.id} returned to engineer for rework.`,
        'success'
      );
      setVerifyModalOpen(false);
      loadAuthorityData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Verification submission failed', 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) return <Loader text="Loading authority portal & jurisdiction data..." />;

  const pendingComplaints = complaints.filter(
    (c) => c.status === 'Authority Assigned' || c.status === 'Submitted' || c.status === 'AI Analyzed'
  );
  const activeRepairs = complaints.filter(
    (c) => c.status === 'Engineer Assigned' || c.status === 'Repair In Progress' || c.status === 'Inspection Completed' || c.status === 'Repair Started' || c.status === 'Inspection Pending'
  );
  const awaitingVerification = complaints.filter(
    (c) => c.status === 'Authority Verification' || c.status === 'Repair Completed'
  );
  const resolvedComplaints = complaints.filter(
    (c) => c.status === 'Closed' || c.status === 'Resolved'
  );

  // Compute complaints matching the selected KPI option
  const getCategoryComplaints = () => {
    switch (activeFilter) {
      case 'ACTION_REQUIRED':
        return pendingComplaints;
      case 'ACTIVE_REPAIRS':
        return activeRepairs;
      case 'READY_FOR_SIGNOFF':
        return awaitingVerification;
      case 'RESOLVED':
        return resolvedComplaints;
      case 'ALL':
      default:
        return complaints;
    }
  };

  const displayedComplaints = getCategoryComplaints().filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.id && c.id.toLowerCase().includes(term)) ||
      (c.road_name && c.road_name.toLowerCase().includes(term)) ||
      (c.district && c.district.toLowerCase().includes(term)) ||
      (c.primary_damage_type && c.primary_damage_type.toLowerCase().includes(term)) ||
      (c.engineer_name && c.engineer_name.toLowerCase().includes(term))
    );
  });

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
            onClick={() => { setLoading(true); loadAuthorityData(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Authority Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                {authority?.authority_type || 'Road Authority'}
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">
                Code: {authority?.code}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              {authority?.name || 'Road Authority Command Center'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              📍 Jurisdiction: <strong className="text-slate-300">{authority?.district}, {authority?.state}</strong> — {authority?.jurisdiction_area}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/authority/complaints"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              All Authority Complaints ({complaints.length})
            </Link>
            <Link
              to="/authority/engineers"
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              Manage Engineers ({engineers.length})
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards (Clickable Filter Options) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatsCard
          title="Assigned Complaints"
          value={stats?.total_complaints || complaints.length}
          subtitle="Total in jurisdiction"
          icon={FileText}
          color="indigo"
          onClick={() => setActiveFilter('ALL')}
          isActive={activeFilter === 'ALL'}
        />
        <StatsCard
          title="Action Required"
          value={pendingComplaints.length}
          subtitle="Needs engineer assignment"
          icon={AlertTriangle}
          color="amber"
          onClick={() => setActiveFilter('ACTION_REQUIRED')}
          isActive={activeFilter === 'ACTION_REQUIRED'}
        />
        <StatsCard
          title="Active Repairs"
          value={activeRepairs.length}
          subtitle="Underway in field"
          icon={Wrench}
          color="purple"
          onClick={() => setActiveFilter('ACTIVE_REPAIRS')}
          isActive={activeFilter === 'ACTIVE_REPAIRS'}
        />
        <StatsCard
          title="Ready for Sign-Off"
          value={awaitingVerification.length}
          subtitle="Repair photo proof submitted"
          icon={ClipboardCheck}
          color="cyan"
          onClick={() => setActiveFilter('READY_FOR_SIGNOFF')}
          isActive={activeFilter === 'READY_FOR_SIGNOFF'}
        />
        <StatsCard
          title="Resolved Cases"
          value={stats?.completed_complaints || resolvedComplaints.length}
          subtitle="Verified & closed"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => setActiveFilter('RESOLVED')}
          isActive={activeFilter === 'RESOLVED'}
        />
        <StatsCard
          title="Field Engineers"
          value={engineers.length}
          subtitle="Active maintenance staff"
          icon={HardHat}
          color="blue"
          onClick={() => setActiveFilter('ENGINEERS')}
          isActive={activeFilter === 'ENGINEERS'}
        />
      </div>

      {/* Dynamic View for Selected KPI Option */}
      {activeFilter === 'ENGINEERS' ? (
        /* Field Engineer Network & Active Workload */
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <HardHat className="h-5 w-5 text-blue-400" />
                  Field Engineer Network & Active Workload ({engineers.length})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                  Active Engineers
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Workload distribution across maintenance engineers in your jurisdiction
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Back to Complaints
              </button>
              <Link
                to="/authority/engineers"
                className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <span>Manage & Register Engineers</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {engineers.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
              <HardHat className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300 font-semibold mt-2">No engineers registered under this authority yet</p>
              <Link to="/authority/engineers" className="inline-block mt-3 px-4 py-1.5 rounded-xl bg-blue-500 text-slate-950 text-xs font-bold">
                Register First Engineer
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {engineers.map((eng) => (
                <div key={eng.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {eng.employee_id}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      {eng.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{eng.full_name}</h4>
                    <p className="text-xs text-slate-400">{eng.designation}</p>
                    <p className="text-[11px] text-blue-300 mt-0.5">🛠️ {eng.specialization}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active Workload:</span>
                    <strong className="text-amber-400 text-sm">{eng.active_workload || 0} tasks</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Filtered Complaints Section */
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                  {activeFilter === 'ACTION_REQUIRED' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                  {activeFilter === 'ACTIVE_REPAIRS' && <Wrench className="h-5 w-5 text-purple-400" />}
                  {activeFilter === 'READY_FOR_SIGNOFF' && <ClipboardCheck className="h-5 w-5 text-cyan-400" />}
                  {activeFilter === 'RESOLVED' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {activeFilter === 'ALL' && <FileText className="h-5 w-5 text-indigo-400" />}
                  
                  {activeFilter === 'ALL' && `All Jurisdiction Complaints (${displayedComplaints.length})`}
                  {activeFilter === 'ACTION_REQUIRED' && `Incoming Complaints Requiring Engineer Assignment (${displayedComplaints.length})`}
                  {activeFilter === 'ACTIVE_REPAIRS' && `Active Field Repairs Underway (${displayedComplaints.length})`}
                  {activeFilter === 'READY_FOR_SIGNOFF' && `Pending Quality Verification & Sign-Off (${displayedComplaints.length})`}
                  {activeFilter === 'RESOLVED' && `Resolved & Closed Cases (${displayedComplaints.length})`}
                </h2>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  activeFilter === 'ACTION_REQUIRED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  activeFilter === 'ACTIVE_REPAIRS' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                  activeFilter === 'READY_FOR_SIGNOFF' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                  activeFilter === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {activeFilter === 'ALL' && 'All Records'}
                  {activeFilter === 'ACTION_REQUIRED' && 'Needs Assignment'}
                  {activeFilter === 'ACTIVE_REPAIRS' && 'In Field'}
                  {activeFilter === 'READY_FOR_SIGNOFF' && 'Awaiting Verification'}
                  {activeFilter === 'RESOLVED' && 'Closed'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeFilter === 'ALL' && 'Complete overview of reported road hazards and infrastructure repair tasks in jurisdiction'}
                {activeFilter === 'ACTION_REQUIRED' && 'Complaints auto-routed by YOLOv8 damage triage ready for field engineer dispatch'}
                {activeFilter === 'ACTIVE_REPAIRS' && 'Complaints currently being inspected or actively repaired by assigned field engineers'}
                {activeFilter === 'READY_FOR_SIGNOFF' && 'Completed repairs submitted by field engineers with photographic evidence awaiting authorized review before closure'}
                {activeFilter === 'RESOLVED' && 'Historical complaints fully repaired, quality-verified, and officially closed'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search complaints, road, engineer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs w-full bg-slate-950/80 border-slate-800"
                />
              </div>

              {activeFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => { setActiveFilter('ALL'); setSearchTerm(''); }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" /> Show All
                </button>
              )}
            </div>
          </div>

          {displayedComplaints.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-300 font-semibold mt-2">
                {activeFilter === 'ACTION_REQUIRED' && 'All incoming complaints have been assigned!'}
                {activeFilter === 'READY_FOR_SIGNOFF' && 'All completed repairs have been verified!'}
                {activeFilter === 'ACTIVE_REPAIRS' && 'No active repairs currently in progress in the field.'}
                {activeFilter === 'RESOLVED' && 'No resolved complaints recorded yet.'}
                {activeFilter === 'ALL' && 'No complaints found matching your search or jurisdiction.'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeFilter === 'ACTION_REQUIRED' && 'No unassigned damage reports in queue.'}
                {activeFilter === 'READY_FOR_SIGNOFF' && 'No pending repair sign-offs in queue.'}
                {activeFilter === 'ACTIVE_REPAIRS' && 'All assigned tasks have been concluded.'}
                {activeFilter === 'RESOLVED' && 'Completed complaints will appear here.'}
                {activeFilter === 'ALL' && 'New citizen reports will appear here automatically.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Road Name</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Classification & Severity</th>
                      <th className="py-3 px-4">Status & Deadline</th>
                      <th className="py-3 px-4">Assigned Engineer</th>
                      <th className="py-3 px-4">Proof / Cost</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedComplaints.map((c) => {
                      const needsAssignment = c.status === 'Authority Assigned' || c.status === 'Submitted' || c.status === 'AI Analyzed';
                      const needsVerification = c.status === 'Authority Verification' || c.status === 'Repair Completed';

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
                            {c.road_type && <RoadTypeBadge roadType={c.road_type} />}
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
                                  <span className="text-[10px] text-slate-400 block truncate max-w-[150px] group-hover:text-slate-300">{c.landmark}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono block group-hover:text-slate-400">
                                    {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-200">{c.primary_damage_type || 'Road Defect'}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                c.ai_severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                c.ai_severity === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {c.ai_severity || 'Medium'}
                              </span>
                              {c.ai_confidence && (
                                <span className="text-[10px] text-cyan-400 font-mono">
                                  {Math.round(c.ai_confidence * 100)}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={c.status} />
                            {(c.deadline || c.repair?.deadline) && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span>Due: {new Date(c.deadline || c.repair?.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {c.engineer_name ? (
                              <div>
                                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                                  <HardHat className="h-3.5 w-3.5 text-blue-400" />
                                  {c.engineer_name}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">{c.engineer_employee_id || ''}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-400/90 italic font-semibold">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {c.repair?.repair_after_image ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={c.repair.repair_after_image}
                                  alt="Repair Proof"
                                  className="h-10 w-14 object-cover rounded-lg border border-emerald-500/40 shadow-sm"
                                />
                                {c.repair?.actual_cost && (
                                  <span className="text-[11px] font-mono text-emerald-400">
                                    ₹{c.repair.actual_cost.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : c.image_url ? (
                              <img
                                src={c.image_url}
                                alt="Reported Damage"
                                className="h-10 w-14 object-cover rounded-lg border border-slate-700 shadow-sm"
                              />
                            ) : (
                              <span className="text-slate-500 text-xs italic">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/complaints/${c.id}`}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5 inline mr-1" /> View
                              </Link>
                              
                              {needsAssignment && (
                                <button
                                  type="button"
                                  onClick={() => openAssignModal(c)}
                                  className="px-3 py-1.5 rounded-lg btn-primary text-xs flex items-center gap-1 shadow-md shadow-amber-500/10"
                                >
                                  <HardHat className="h-3.5 w-3.5" /> Assign
                                </button>
                              )}

                              {needsVerification && (
                                <button
                                  type="button"
                                  onClick={() => openVerifyModal(c)}
                                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5" /> Review & Verify
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (sm:hidden) */}
              <div className="sm:hidden space-y-3">
                {displayedComplaints.map((c) => {
                  const needsAssignment = c.status === 'Authority Assigned' || c.status === 'Submitted' || c.status === 'AI Analyzed';
                  const needsVerification = c.status === 'Authority Verification' || c.status === 'Repair Completed';

                  return (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{c.road_name}</h4>
                        <p className="text-xs text-slate-400">
                          📍 {c.district} • {c.primary_damage_type || 'Road Defect'}
                        </p>
                        {c.engineer_name && (
                          <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1 font-semibold">
                            <HardHat className="h-3.5 w-3.5 text-blue-400" /> Engineer: {c.engineer_name}
                          </p>
                        )}
                      </div>
                      {(c.repair?.repair_after_image || c.image_url) && (
                        <div className="rounded-xl overflow-hidden border border-slate-800">
                          <img
                            src={c.repair?.repair_after_image || c.image_url}
                            alt="Road Damage"
                            className="h-28 w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700"
                        >
                          View
                        </Link>
                        {needsAssignment && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(c)}
                            className="px-3 py-1.5 rounded-lg btn-primary text-xs flex items-center gap-1 shadow-md"
                          >
                            <HardHat className="h-3.5 w-3.5" /> Assign
                          </button>
                        )}
                        {needsVerification && (
                          <button
                            type="button"
                            onClick={() => openVerifyModal(c)}
                            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" /> Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Map */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-500" />
          Jurisdiction GIS Heatmap & Incident Locations
        </h2>
        <ComplaintMap complaints={activeFilter === 'ENGINEERS' ? complaints : displayedComplaints} height="h-[480px]" showFilters={false} />
      </div>

      {/* Assign Engineer Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Field Engineer: ${activeComplaint?.id}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Select Engineer</label>
            <select
              value={selectedEngineerId}
              onChange={(e) => setSelectedEngineerId(e.target.value)}
              className="input-field cursor-pointer"
            >
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.full_name} ({eng.employee_id}) - {eng.designation} [Workload: {eng.active_workload}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Special Instructions / Work Order</label>
            <textarea
              rows={3}
              value={assignRemarks}
              onChange={(e) => setAssignRemarks(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-slate-300">
                Repair Completion Deadline <span className="text-amber-400">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      const dt = new Date();
                      dt.setDate(dt.getDate() + days);
                      setAssignDeadline(dt.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={assignDeadline}
              onChange={(e) => setAssignDeadline(e.target.value)}
              className="input-field"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Designated completion target for site inspection, material procurement, and road surface restoration.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl btn-primary text-xs shadow-md shadow-amber-500/20"
            >
              {actionLoading ? 'Assigning...' : 'Dispatch Engineer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Authorized Quality Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={`Quality Verification & Sign-Off: #${activeVerifyComplaint?.id}`}
      >
        <form onSubmit={handleVerifySubmit} className="space-y-5 text-xs">
          
          {/* Work Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-400 font-bold">{activeVerifyComplaint?.id}</span>
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <HardHat className="h-3.5 w-3.5" />
                {activeVerifyComplaint?.engineer_name || 'Field Engineer'}
              </span>
            </div>
            <h4 className="font-bold text-white text-sm">{activeVerifyComplaint?.road_name}</h4>
            <p className="text-slate-400 text-xs">
              📍 {activeVerifyComplaint?.district}, {activeVerifyComplaint?.state} • {activeVerifyComplaint?.primary_damage_type || 'Road Defect'}
            </p>
          </div>

          {/* Side-by-Side Before & After Photographs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-rose-400 block flex items-center gap-1">
                ⚠️ Original Reported Defect (Before)
              </span>
              <div className="h-40 rounded-xl overflow-hidden bg-slate-950 border border-rose-500/30 flex items-center justify-center">
                {(activeVerifyComplaint?.image_url || activeVerifyComplaint?.repair?.repair_before_image) ? (
                  <img
                    src={activeVerifyComplaint?.image_url || activeVerifyComplaint?.repair?.repair_before_image}
                    alt="Damage Before"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-slate-500 text-xs">No Before Image</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 block flex items-center gap-1">
                ✅ Completed Surface Repair (After)
              </span>
              <div className="h-40 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 flex items-center justify-center">
                {activeVerifyComplaint?.repair?.repair_after_image ? (
                  <img
                    src={activeVerifyComplaint.repair.repair_after_image}
                    alt="Repaired Surface After"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-slate-500 text-xs">No After Image</span>
                )}
              </div>
            </div>
          </div>

          {/* Execution Metrics */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block">Materials Used:</span>
              <strong className="text-slate-200">
                {activeVerifyComplaint?.repair?.materials_used || 'Standard Pavement Mix'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Actual Cost:</span>
              <strong className="text-amber-400 font-mono text-xs">
                {activeVerifyComplaint?.repair?.actual_cost ? `₹${activeVerifyComplaint.repair.actual_cost.toLocaleString()}` : '—'}
              </strong>
            </div>
            {activeVerifyComplaint?.repair?.completion_remarks && (
              <div className="col-span-2 pt-1 border-t border-slate-800">
                <span className="text-slate-400 block">Engineer Remarks:</span>
                <p className="text-slate-300 italic">{activeVerifyComplaint.repair.completion_remarks}</p>
              </div>
            )}
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-200">Authority Verification Decision</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsApproved(true)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isApproved
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Approve & Close Case</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pavement quality meets safety standard. Mark complaint fully resolved and closed.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsApproved(false)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !isApproved
                    ? 'bg-rose-500/15 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <X className="h-4 w-4 text-rose-400" />
                  <span>Request Rework</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Defect not satisfactorily repaired. Return complaint to engineer for re-compaction.
                </p>
              </button>
            </div>
          </div>

          {/* Verification Remarks */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Authority Inspection Remarks</label>
            <textarea
              rows={2}
              value={verificationRemarks}
              onChange={(e) => setVerificationRemarks(e.target.value)}
              placeholder="Enter quality evaluation remarks or reason for rework..."
              className="input-field"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setVerifyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifyLoading}
              className={`px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                isApproved
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              {verifyLoading ? 'Submitting...' : isApproved ? 'Approve & Close Complaint' : 'Submit Rework Request'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AuthorityDashboard;
