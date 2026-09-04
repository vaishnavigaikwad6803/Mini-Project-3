import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { authorityService } from '../../services/authorityService';
import { engineerService } from '../../services/engineerService';
import { complaintService } from '../../services/complaintService';
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
  AlertTriangle
} from 'lucide-react';

const AuthorityDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [authority, setAuthority] = useState(null);
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Engineer Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAuthorityData = async () => {
    try {
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

  if (loading) return <Loader text="Loading authority portal & jurisdiction data..." />;

  const pendingComplaints = complaints.filter(
    (c) => c.status === 'Authority Assigned' || c.status === 'Submitted' || c.status === 'AI Analyzed'
  );
  const activeRepairs = complaints.filter(
    (c) => c.status === 'Engineer Assigned' || c.status === 'Repair In Progress' || c.status === 'Inspection Completed'
  );

  return (
    <div className="space-y-8 pb-12">
      
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Assigned Complaints"
          value={stats?.total_complaints || complaints.length}
          subtitle="Total within jurisdiction"
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
          color="cyan"
        />
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
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        c.ai_severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
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
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5 inline mr-1" /> View
                        </Link>
                        <button
                          onClick={() => openAssignModal(c)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1"
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
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
            >
              {actionLoading ? 'Assigning...' : 'Dispatch Engineer'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AuthorityDashboard;
