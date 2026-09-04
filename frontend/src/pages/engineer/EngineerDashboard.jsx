import React, { useState, useEffect } from 'react';
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
import { 
  HardHat, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  Eye, 
  MapPin, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const REPAIR_STAGES = [
  { value: 'Inspection Pending', label: '1. Inspection Pending' },
  { value: 'Inspection Completed', label: '2. Inspection Completed' },
  { value: 'Repair Started', label: '3. Repair Started' },
  { value: 'Repair In Progress', label: '4. Repair In Progress' },
  { value: 'Repair Completed', label: '5. Repair Completed (Damage Resolved - Photo Required)' },
];

const EngineerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      showToast('Mandatory: You must upload an image of the completed repair before resolving!', 'error');
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

  const pendingInspection = assignments.filter((a) => a.status === 'Engineer Assigned' || a.status === 'Inspection Pending');
  const inRepair = assignments.filter((a) => a.status === 'Inspection Completed' || a.status === 'Repair Started' || a.status === 'Repair In Progress');
  const completed = assignments.filter((a) => a.status === 'Repair Completed' || a.status === 'Authority Verification' || a.status === 'Closed');

  const isResolvedStage = repairData.stage === 'Repair Completed';
  const hasUploadedImage = Boolean(completionImage || imagePreview || selectedComplaint?.repair?.repair_after_image);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/50 border border-slate-800 shadow-2xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">
            Field Operations
          </span>
          <span className="text-xs font-mono text-slate-400">
            Badge: {user?.employee_id || 'ENG-101'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
          Field Engineer Workstation
        </h1>
        <p className="text-xs text-slate-400">
          Execute site inspections, update repair milestones, and upload photo proof to resolve road damage.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assigned"
          value={assignments.length}
          subtitle="All tasks"
          icon={HardHat}
          color="purple"
        />
        <StatsCard
          title="Inspection Needed"
          value={pendingInspection.length}
          subtitle="Awaiting site visit"
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Repairs in Progress"
          value={inRepair.length}
          subtitle="Work underway"
          icon={Wrench}
          color="cyan"
        />
        <StatsCard
          title="Completed / Closed"
          value={completed.length}
          subtitle="Signed off"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Assigned Tasks Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">
              My Active Repair Assignments ({assignments.length})
            </h2>
            <p className="text-xs text-slate-400">
              Select any assignment to update stage progress or upload proof to resolve damage
            </p>
          </div>
          <Link
            to="/engineer/assignments"
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            Manage Operations <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold mt-2">No active repair tasks assigned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Road Name</th>
                  <th className="py-3 px-4">Road Type</th>
                  <th className="py-3 px-4">Defect Classification</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assignments.map((c) => {
                  const canDirectResolve = ['Repair Started', 'Repair In Progress', 'Inspection Completed'].includes(c.status);
                  const isDamageCompleted = ['Repair Completed', 'Authority Verification', 'Closed'].includes(c.status);

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block max-w-xs truncate">{c.road_name}</span>
                        <span className="text-[11px] text-slate-400">📍 {c.district}</span>
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
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          c.priority === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {c.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
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
        )}
      </div>

      {/* Update Repair Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Road Repair Management: ${selectedComplaint?.id}`}
      >
        <form onSubmit={handleStageSubmit} className="space-y-4 text-xs">
          
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
          {isResolvedStage && (
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
                    <span>Upload image above to display <strong>Resolved</strong> button</span>
                  </div>
                )
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  {submitting ? 'Updating...' : 'Save Stage Progress'}
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
