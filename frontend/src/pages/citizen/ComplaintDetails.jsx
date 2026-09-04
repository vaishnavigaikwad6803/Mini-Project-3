import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { complaintService } from '../../services/complaintService';
import { engineerService } from '../../services/engineerService';
import { repairService } from '../../services/repairService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import AIResultCard from '../../components/ai/AIResultCard';
import ComplaintTimeline from '../../components/timeline/ComplaintTimeline';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import CameraCapture from '../../components/common/CameraCapture';
import { 
  MapPin, 
  Building2, 
  HardHat, 
  Wrench, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  FileText,
  Clock,
  ShieldCheck,
  Trash2
} from 'lucide-react';

const REPAIR_STAGES = [
  { value: 'Inspection Pending', label: '1. Inspection Pending' },
  { value: 'Inspection Completed', label: '2. Inspection Completed' },
  { value: 'Repair Started', label: '3. Repair Started' },
  { value: 'Repair In Progress', label: '4. Repair In Progress' },
  { value: 'Repair Completed', label: '5. Repair Completed (Damage Resolved - Photo Required)' },
];

const ComplaintDetails = () => {
  const { id } = useParams();
  const { user, isAuthority, isEngineer, isAdmin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals for Authority and Engineer actions
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [engineersList, setEngineersList] = useState([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');

  // Engineer repair update & resolve modal
  const [engineerModalOpen, setEngineerModalOpen] = useState(false);
  const [repairData, setRepairData] = useState({
    stage: 'Repair In Progress',
    remarks: '',
    materials_used: 'Cold Bituminous Mix, Bitumen Emulsion Tack Coat, 10mm Aggregate',
    actual_cost: 14000,
  });
  const [completionImage, setCompletionImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [engineerSubmitting, setEngineerSubmitting] = useState(false);

  // Verification modal for Authority
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState('Work inspected and approved according to IRC standards.');
  const [isApproved, setIsApproved] = useState(true);

  // Delete modal state (Req 5)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanId = id?.trim();
      const data = await complaintService.getComplaintById(cleanId);
      setComplaint(data);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 404) {
        setError({
          type: 'NOT_FOUND',
          title: 'Complaint Not Found',
          message: detail || `Complaint #${id} does not exist in the RoadGuard AI system.`
        });
      } else if (status === 401 || status === 403) {
        setError({
          type: 'UNAUTHORIZED',
          title: 'Access Restricted',
          message: detail || 'You do not have permission to view this complaint.'
        });
      } else {
        setError({
          type: 'SERVER_ERROR',
          title: 'Unable to Load Complaint Details',
          message: detail || 'A network error occurred while retrieving complaint details. Please check your connection and try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleDeleteComplaint = async (e) => {
    e.preventDefault();
    if (!complaint?.id) return;
    if (!deleteReason || deleteReason.trim().length < 3) {
      showToast('Please provide a valid deletion reason (minimum 3 characters).', 'error');
      return;
    }

    setDeleting(true);
    try {
      await complaintService.deleteComplaint(complaint.id, deleteReason.trim());
      showToast(`Complaint #${complaint.id} deleted successfully.`, 'success');
      setDeleteModalOpen(false);
      navigate(isAuthority ? '/authority/complaints' : isAdmin ? '/admin/complaints' : '/');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete complaint.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openAssignModal = async () => {
    try {
      const engs = await engineerService.getEngineers({ authority_id: complaint.authority_id });
      setEngineersList(engs);
      if (engs.length > 0) setSelectedEngineerId(engs[0].id);
      setAssignModalOpen(true);
    } catch (err) {
      console.error("Failed to load engineers:", err);
    }
  };

  const handleAssignEngineer = async (e) => {
    e.preventDefault();
    if (!selectedEngineerId) return;
    setActionLoading(true);
    try {
      await engineerService.assignEngineerToComplaint(complaint.id, selectedEngineerId, assignRemarks);
      showToast('Engineer assigned successfully!', 'success');
      setAssignModalOpen(false);
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to assign engineer', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyRepair = async (e) => {
    e.preventDefault();
    if (!complaint?.repair?.id) return;
    setActionLoading(true);
    try {
      await repairService.verifyAndCloseRepair(complaint.repair.id, {
        verification_remarks: verificationRemarks,
        is_approved: isApproved
      });
      showToast(isApproved ? 'Complaint verified and closed!' : 'Rework requested from engineer.', 'success');
      setVerifyModalOpen(false);
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Verification update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openEngineerModal = (initialStage = null) => {
    const targetStage = initialStage || complaint.repair?.current_stage || 'Repair In Progress';
    setRepairData({
      stage: targetStage,
      remarks: complaint.repair?.inspection_remarks || '',
      materials_used: complaint.repair?.materials_used || 'Cold Bituminous Mix, Bitumen Emulsion Tack Coat, 10mm Aggregate',
      actual_cost: complaint.repair?.actual_cost || 14000,
    });
    setCompletionImage(null);
    setImagePreview(complaint.repair?.repair_after_image || null);
    setEngineerModalOpen(true);
  };

  const handleEngineerSubmit = async (e) => {
    e.preventDefault();
    const repairId = complaint?.repair?.id || complaint?.repair_id;
    if (!repairId) {
      showToast('Repair record not found for this complaint.', 'error');
      return;
    }

    if (repairData.stage === 'Repair Completed' && !completionImage && !complaint.repair?.repair_after_image && !imagePreview) {
      showToast('Mandatory: You must upload an image of the completed repair before resolving!', 'error');
      return;
    }

    setEngineerSubmitting(true);

    try {
      if (repairData.stage === 'Repair Completed' && completionImage) {
        const formData = new FormData();
        formData.append('completion_image', completionImage);
        formData.append('completion_remarks', repairData.remarks || 'Repairs completed according to standard pavement compaction.');
        if (repairData.materials_used) formData.append('materials_used', repairData.materials_used);
        if (repairData.actual_cost) formData.append('actual_cost', repairData.actual_cost);

        await repairService.submitRepairCompletion(repairId, formData);
        showToast(`Repair marked Resolved with photo proof and submitted for Authority Verification!`, 'success');
      } else {
        await repairService.updateRepairStage(repairId, {
          current_stage: repairData.stage,
          remarks: repairData.remarks,
          materials_used: repairData.materials_used,
          actual_cost: repairData.actual_cost,
        });
        showToast(`Repair stage updated to '${repairData.stage}'!`, 'success');
      }

      setEngineerModalOpen(false);
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update repair stage', 'error');
    } finally {
      setEngineerSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading complaint details & AI data..." />;

  if (error || !complaint) {
    const errorObj = typeof error === 'object' && error !== null ? error : {
      title: 'Complaint Not Found',
      message: error || `The requested complaint ID #${id} does not exist in the database.`
    };
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 w-fit mx-auto">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-white font-['Outfit']">{errorObj.title}</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">{errorObj.message}</p>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fetchComplaint()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
          >
            Retry Loading
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isEngineerResolvedStage = repairData.stage === 'Repair Completed';
  const hasEngineerUploadedImage = Boolean(completionImage || imagePreview || complaint?.repair?.repair_after_image);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Back Button & Top Meta */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Quick Role Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {(isAuthority || isAdmin) && complaint.status === 'Authority Assigned' && (
            <button
              onClick={openAssignModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <HardHat className="h-4 w-4" /> Assign Field Engineer
            </button>
          )}

          {(isAuthority || isAdmin) && (complaint.status === 'Authority Verification' || complaint.status === 'Repair Completed') && (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" /> Verify & Close Complaint
            </button>
          )}

          {(isAuthority || isAdmin) && (
            <button
              onClick={() => { setDeleteReason(''); setDeleteModalOpen(true); }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Delete Complaint
            </button>
          )}

          {isEngineer && (['Engineer Assigned', 'Inspection Pending', 'Inspection Completed', 'Repair Started', 'Repair In Progress'].includes(complaint.status)) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEngineerModal()}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Wrench className="h-4 w-4" /> Update Stage
              </button>
              {['Repair Started', 'Repair In Progress', 'Inspection Completed'].includes(complaint.status) && (
                <button
                  onClick={() => openEngineerModal('Repair Completed')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Resolve Damage
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Header Info Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                {complaint.id}
              </span>
              <StatusBadge status={complaint.status} />
              <RoadTypeBadge roadType={complaint.road_type} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              {complaint.road_name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              {complaint.district}, {complaint.state} {complaint.landmark && `(Near ${complaint.landmark})`}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Submitted By</span>
            <span className="text-xs font-semibold text-white">
              {complaint.citizen_name || 'Citizen'}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {new Date(complaint.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Responsible Authority
            </span>
            <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-amber-400" />
              {complaint.authority_name || 'Pending Assignment'}
            </p>
            {complaint.routing_notes && (
              <p className="text-[11px] text-slate-400 mt-1">
                {complaint.routing_notes}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Assigned Field Engineer
            </span>
            <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <HardHat className="h-4 w-4 text-cyan-400" />
              {complaint.repair?.engineer_name || 'Pending Engineer Dispatch'}
            </p>
            {complaint.repair?.engineer_employee_id && (
              <p className="text-[11px] text-slate-400 mt-1">
                Badge: {complaint.repair.engineer_employee_id}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Damage Priority & GPS
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                complaint.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                complaint.priority === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {complaint.priority} Priority
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Coords: {complaint.latitude}, {complaint.longitude}
            </p>
          </div>
        </div>

        {complaint.description && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
            <strong className="text-slate-200">Citizen Description: </strong>
            {complaint.description}
          </div>
        )}

      </div>

      {/* AI Road Damage Detection Card or Map Location Card */}
      {complaint.ai_result ? (
        <AIResultCard aiResult={complaint.ai_result} originalImageUrl={complaint.image_url} />
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  GIS Map Location & Damage Summary
                </h3>
                <p className="text-xs text-slate-400">
                  Damage report submitted via interactive Maharashtra GIS Map Pin
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              📍 Map Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Reported Defect</span>
              <strong className="text-white block mt-1 text-sm">{complaint.primary_damage_type || 'Road Defect'}</strong>
              <p className="text-[11px] text-slate-400 mt-0.5">{complaint.road_name}</p>
            </div>
            <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Jurisdiction</span>
              <strong className="text-white block mt-1 text-sm">{complaint.road_type}</strong>
              <p className="text-[11px] text-amber-400 mt-0.5">{complaint.authority_name || 'Routing...'}</p>
            </div>
            <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Current Priority</span>
              <strong className="text-white block mt-1 text-sm">{complaint.priority} Priority</strong>
              <p className="text-[11px] text-cyan-400 mt-0.5 font-mono">{complaint.latitude}, {complaint.longitude}</p>
            </div>
          </div>

          {complaint.image_url && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-amber-400 block mb-2 flex items-center gap-1.5">
                📸 Citizen Captured Road Damage Photo
              </span>
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black max-h-72 flex items-center justify-center">
                <img src={complaint.image_url} alt="Citizen Road Damage" className="w-full h-64 object-cover" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Field Repair Progress Card */}
      {complaint.repair && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" />
              Field Inspection & Maintenance Work
            </h3>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              Stage: {complaint.repair.current_stage}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Inspection Date & Remarks</span>
              <strong className="text-white block mt-0.5">
                {complaint.repair.inspection_date ? new Date(complaint.repair.inspection_date).toLocaleDateString() : 'Pending Site Visit'}
              </strong>
              <p className="text-[11px] text-slate-400 mt-1">{complaint.repair.inspection_remarks || 'Inspection scheduled.'}</p>
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Materials & Costs</span>
              <strong className="text-white block mt-0.5">
                {complaint.repair.materials_used || 'Standard Hot/Cold Asphalt Mix'}
              </strong>
              <p className="text-[11px] text-slate-400 mt-1">
                Estimated: ₹{complaint.repair.estimated_cost || 15000} • Actual: ₹{complaint.repair.actual_cost || 'N/A'}
              </p>
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Authority Verification</span>
              <strong className={complaint.repair.verification_remarks ? 'text-emerald-400 block mt-0.5' : 'text-slate-400 block mt-0.5'}>
                {complaint.repair.verification_remarks ? 'Verified & Closed' : 'Under Final Review'}
              </strong>
              <p className="text-[11px] text-slate-400 mt-1">{complaint.repair.verification_remarks || 'Awaiting completion review.'}</p>
            </div>
          </div>

          {/* Before & After Photo Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                📸 Before Repair (Damage Report)
              </span>
              <div className="h-48 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                {complaint.image_url ? (
                  <img
                    src={complaint.image_url}
                    alt="Before Repair"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center space-y-1 text-slate-400">
                    <MapPin className="h-6 w-6 text-amber-400 mx-auto" />
                    <p className="text-xs font-semibold text-white">Reported via Map Location</p>
                    <p className="text-[10px] font-mono text-slate-500">📍 {complaint.district}, Maharashtra ({complaint.latitude}, {complaint.longitude})</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                📸 After Repair (Field Engineer Proof)
              </span>
              <div className="h-48 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                {complaint.repair.repair_after_image ? (
                  <img
                    src={complaint.repair.repair_after_image}
                    alt="After Repair"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="text-xs text-slate-500 text-center p-4">
                    Repair work in progress. Repaired surface photo will be uploaded upon completion.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Progress Timeline */}
      <ComplaintTimeline history={complaint.status_history} currentStatus={complaint.status} />

      {/* Assign Engineer Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Field Engineer to Complaint"
      >
        <form onSubmit={handleAssignEngineer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Select Engineer</label>
            <select
              value={selectedEngineerId}
              onChange={(e) => setSelectedEngineerId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {engineersList.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.full_name} ({eng.employee_id}) - {eng.designation} [Active Workload: {eng.active_workload}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Dispatch Instructions / Remarks</label>
            <textarea
              rows={3}
              value={assignRemarks}
              onChange={(e) => setAssignRemarks(e.target.value)}
              placeholder="e.g. Conduct site inspection, check subgrade damage, and apply bituminous overlay..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Verify Repair Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Authority Quality Verification & Closure"
      >
        <form onSubmit={handleVerifyRepair} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Verification Decision</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isApproved}
                  onChange={() => setIsApproved(true)}
                  className="text-amber-500"
                />
                <span className="text-emerald-400 font-bold">Approve & Close Complaint</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isApproved}
                  onChange={() => setIsApproved(false)}
                  className="text-amber-500"
                />
                <span className="text-rose-400 font-bold">Request Rework</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Authority Official Remarks</label>
            <textarea
              rows={3}
              value={verificationRemarks}
              onChange={(e) => setVerificationRemarks(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setVerifyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              {actionLoading ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Complaint Modal (Req 5) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Delete Complaint: ${complaint.id}`}
      >
        <form onSubmit={handleDeleteComplaint} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              Warning: Irreversible Deletion
            </p>
            <p className="text-[11px] text-rose-200">
              You are about to delete complaint <strong>{complaint.id}</strong> ({complaint.road_name}). A mandatory reason must be provided.
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
              placeholder="Provide a detailed deletion reason..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting || !deleteReason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Engineer Repair Management & Resolution Modal */}
      <Modal
        isOpen={engineerModalOpen}
        onClose={() => setEngineerModalOpen(false)}
        title={`Road Repair Management: ${complaint.id}`}
      >
        <form onSubmit={handleEngineerSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Current Progress Stage *</label>
            <select
              value={repairData.stage}
              onChange={(e) => setRepairData({ ...repairData, stage: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Estimated / Actual Incurred Cost (₹)</label>
            <input
              type="number"
              value={repairData.actual_cost}
              onChange={(e) => setRepairData({ ...repairData, actual_cost: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Inspection / Work Progress Remarks</label>
            <textarea
              rows={3}
              value={repairData.remarks}
              onChange={(e) => setRepairData({ ...repairData, remarks: e.target.value })}
              placeholder="Describe surface preparation, depth leveling, compaction passes, or traffic barricading..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* When damage is completed (Repair Completed), mandatory image upload */}
          {isEngineerResolvedStage && (
            <div className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                  📸 Upload Repaired Road Image Proof *
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                  MANDATORY FOR RESOLUTION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When damage repair is completed, you must upload photographic evidence of the repaired road surface. The <strong>Resolved</strong> button will be displayed once the photo is attached.
              </p>
              
              <div className="space-y-2">
                {!completionImage && !imagePreview && (
                  <CameraCapture 
                    enableAiValidation={false}
                    title="Repaired Road Proof"
                    subtitle="Verify work completion"
                    capturePrompt="Click Image"
                    captureDescription="Take a clear live photo of the repaired road surface"
                    hideDeviceCameraFallback={true}
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
                  <div className="relative mt-2 rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-md">
                    <img src={imagePreview} alt="Repaired Road Surface Proof" className="h-44 w-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Image Attached & Verified
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCompletionImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white text-[10px] font-bold shadow-md"
                    >
                      Retake Photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons: Conditional Display of Resolved button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEngineerModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>

            <div className="w-full sm:w-auto flex items-center justify-end">
              {isEngineerResolvedStage ? (
                hasEngineerUploadedImage ? (
                  <button
                    type="submit"
                    disabled={engineerSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {engineerSubmitting ? 'Resolving Repair...' : 'Resolved (Submit for Verification)'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                    <span>Upload image above to display <strong>Resolved</strong> button</span>
                  </div>
                )
              ) : (
                <button
                  type="submit"
                  disabled={engineerSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {engineerSubmitting ? 'Updating...' : 'Save Stage Progress'}
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ComplaintDetails;
