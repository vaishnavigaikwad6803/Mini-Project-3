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
  RefreshCw,
  AlertCircle
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

  // Assign Engineer Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
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
        assignRemarks
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatsCard
          title="Assigned Complaints"
          value={stats?.total_complaints || complaints.length}
          subtitle="Total in jurisdiction"
          icon={FileText}
          color="indigo"
        />
        <StatsCard
          title="Action Required"
          value={pendingComplaints.length}
          subtitle="Needs engineer assignment"
          icon={AlertTriangle}
          color="amber"
        />
        <StatsCard
          title="Active Repairs"
          value={activeRepairs.length}
          subtitle="Underway in field"
          icon={Wrench}
          color="purple"
        />
        <StatsCard
          title="Ready for Sign-Off"
          value={awaitingVerification.length}
          subtitle="Repair photo proof submitted"
          icon={ClipboardCheck}
          color="cyan"
        />
        <StatsCard
          title="Resolved Cases"
          value={stats?.completed_complaints || 0}
          subtitle="Verified & closed"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Field Engineers"
          value={engineers.length}
          subtitle="Active maintenance staff"
          icon={HardHat}
          color="blue"
        />
      </div>

      {/* Quality Verification & Final Sign-Off Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-cyan-400" />
              Pending Quality Verification & Sign-Off ({awaitingVerification.length})
            </h2>
            <p className="text-xs text-slate-400">
              Completed repairs submitted by field engineers with photographic evidence awaiting authorized review before closure
            </p>
          </div>
          {awaitingVerification.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
              {awaitingVerification.length} Pending Approval
            </span>
          )}
        </div>

        {awaitingVerification.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold mt-2">All completed repairs have been verified!</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No pending repair sign-offs in queue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Road Name</th>
                    <th className="py-3 px-4">Completed By</th>
                    <th className="py-3 px-4">Repair Proof</th>
                    <th className="py-3 px-4">Actual Cost</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {awaitingVerification.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block max-w-xs truncate">{c.road_name}</span>
                        <span className="text-[11px] text-slate-400">📍 {c.district}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                          <HardHat className="h-3.5 w-3.5" />
                          {c.engineer_name || 'Field Engineer'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{c.engineer_employee_id || ''}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.repair?.repair_after_image ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={c.repair.repair_after_image}
                              alt="Repair Proof"
                              className="h-10 w-14 object-cover rounded-lg border border-emerald-500/40 shadow-sm"
                            />
                            <span className="text-[10px] text-emerald-400 font-semibold">Photo Attached</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Pending Photo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {c.repair?.actual_cost ? `₹${c.repair.actual_cost.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/complaints/${c.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 inline mr-1" /> View
                          </Link>
                          <button
                            onClick={() => openVerifyModal(c)}
                            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" /> Review & Verify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (sm:hidden) */}
            <div className="sm:hidden space-y-3">
              {awaitingVerification.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Repair Completed
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{c.road_name}</h4>
                    <p className="text-xs text-slate-400">📍 {c.district} • By: {c.engineer_name || 'Engineer'}</p>
                  </div>
                  {c.repair?.repair_after_image && (
                    <div className="rounded-xl overflow-hidden border border-emerald-500/40">
                      <img src={c.repair.repair_after_image} alt="Repaired Surface" className="h-32 w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <Link
                      to={`/complaints/${c.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => openVerifyModal(c)}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" /> Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Required: Unassigned / Under Review Complaints */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Incoming Complaints Requiring Engineer Assignment ({pendingComplaints.length})
            </h2>
            <p className="text-xs text-slate-400">
              Complaints auto-routed by YOLOv8 damage triage ready for field engineer dispatch
            </p>
          </div>
        </div>

        {pendingComplaints.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold mt-2">All incoming complaints have been assigned!</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No unassigned damage reports in queue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Road Name</th>
                    <th className="py-3 px-4">Damage Classification</th>
                    <th className="py-3 px-4">AI Severity</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Assign Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">{c.road_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">{c.primary_damage_type || 'Road Defect'}</span>
                        {c.ai_confidence && (
                          <span className="text-[10px] text-cyan-400 block">
                            AI: {Math.round(c.ai_confidence * 100)}%
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${c.ai_severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                            c.ai_severity === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                              'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                          {c.ai_severity || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">📍 {c.district}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/complaints/${c.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 inline mr-1" /> View
                          </Link>
                          <button
                            onClick={() => openAssignModal(c)}
                            className="px-3 py-1.5 rounded-lg btn-primary text-xs flex items-center gap-1 shadow-md shadow-amber-500/10"
                          >
                            <HardHat className="h-3.5 w-3.5" /> Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (sm:hidden) */}
            <div className="sm:hidden space-y-3">
              {pendingComplaints.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      c.ai_severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      c.ai_severity === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {c.ai_severity || 'Medium'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{c.road_name}</h4>
                    <p className="text-xs text-slate-400">📍 {c.district} • {c.primary_damage_type || 'Road Defect'}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <Link
                      to={`/complaints/${c.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => openAssignModal(c)}
                      className="px-3 py-1.5 rounded-lg btn-primary text-xs flex items-center gap-1 shadow-md"
                    >
                      <HardHat className="h-3.5 w-3.5" /> Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Field Engineers Workload Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <HardHat className="h-5 w-5 text-indigo-400" />
              Field Engineer Network & Active Workload
            </h2>
            <p className="text-xs text-slate-400">
              Workload distribution across maintenance engineers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {engineers.map((eng) => (
            <div key={eng.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {eng.employee_id}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  {eng.status}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{eng.full_name}</h4>
                <p className="text-xs text-slate-400">{eng.designation}</p>
                <p className="text-[11px] text-indigo-300 mt-0.5">🛠️ {eng.specialization}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Active Workload:</span>
                <strong className="text-amber-400 text-sm">{eng.active_workload || 0} tasks</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-500" />
          Jurisdiction GIS Heatmap & Incident Locations
        </h2>
        <ComplaintMap complaints={complaints} height="h-[480px]" showFilters={false} />
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
