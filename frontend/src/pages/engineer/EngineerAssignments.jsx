import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { engineerService } from '../../services/engineerService';
import { repairService } from '../../services/repairService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import CameraCapture from '../../components/common/CameraCapture';
import { calculateDistance, detectCurrentLocation } from '../../utils/geoUtils';
import { 
  HardHat, 
  Wrench, 
  UploadCloud, 
  Eye, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  DollarSign,
  Loader2
} from 'lucide-react';

const REPAIR_STAGES = [
  { value: 'Inspection Pending', label: '1. Inspection Pending' },
  { value: 'Inspection Completed', label: '2. Inspection Completed' },
  { value: 'Repair Started', label: '3. Repair Started' },
  { value: 'Repair In Progress', label: '4. Repair In Progress' },
  { value: 'Repair Completed', label: '5. Repair Completed (Ready for Verification)' },
];

const EngineerAssignments = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update Stage Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [repairData, setRepairData] = useState({
    stage: 'Repair In Progress',
    remarks: '',
    materials_used: 'Cold Bituminous Mix, Bitumen Emulsion Tack Coat',
    actual_cost: 12000,
  });
  const [completionImage, setCompletionImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [isValidatingGps, setIsValidatingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [isAiValid, setIsAiValid] = useState(true);
  const [isAiValidating, setIsAiValidating] = useState(false);

  const loadAssignments = async () => {
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
      console.error("Error loading assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
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
    setGpsError('');
    setIsAiValid(true);
    setIsAiValidating(false);
    setModalOpen(true);
  };

  const handleStageSubmit = async (e) => {
    e.preventDefault();
    const repairId = selectedComplaint?.repair?.id || selectedComplaint?.repair_id;
    if (!repairId) {
      showToast('Repair record not found for this complaint.', 'error');
      return;
    }

    // Mandatory completion image check
    if (repairData.stage === 'Repair Completed' && !completionImage && !selectedComplaint.repair?.repair_after_image && !imagePreview) {
      showToast('Mandatory: You must upload an image of the completed repair before resolving!', 'error');
      return;
    }

    setSubmitting(true);

    try {
      if (repairData.stage === 'Repair Completed' && completionImage) {
        // Multipart completion upload
        const formData = new FormData();
        formData.append('completion_image', completionImage);
        formData.append('completion_remarks', repairData.remarks || 'Repairs completed according to standard pavement compaction.');
        if (repairData.materials_used) formData.append('materials_used', repairData.materials_used);
        if (repairData.actual_cost) formData.append('actual_cost', repairData.actual_cost);

        await repairService.submitRepairCompletion(repairId, formData);
        showToast(`Repair marked Resolved with photo proof and submitted for Authority Verification!`, 'success');
      } else {
        // Standard stage update
        await repairService.updateRepairStage(repairId, {
          current_stage: repairData.stage,
          remarks: repairData.remarks,
          materials_used: repairData.materials_used,
          actual_cost: repairData.actual_cost,
        });
        showToast(`Repair stage updated to '${repairData.stage}'!`, 'success');
      }

      setModalOpen(false);
      loadAssignments();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update repair stage', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isResolvedStage = repairData.stage === 'Repair Completed';
  const hasUploadedImage = Boolean(completionImage || imagePreview || selectedComplaint?.repair?.repair_after_image);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">
          Work Orders
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
          Assigned Road Maintenance Tasks
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Conduct field assessments, progress repair milestones, and upload completion proofs to resolve damage.
        </p>
      </div>

      {loading ? (
        <Loader text="Loading work orders..." />
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300 mt-3">No active assignments</h3>
          <p className="text-xs text-slate-500 mt-1">All road maintenance tasks are completed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((c) => {
            const canDirectResolve = ['Repair Started', 'Repair In Progress', 'Inspection Completed'].includes(c.status);

            return (
              <div key={c.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                      {c.id}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-['Outfit']">
                      {c.road_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      {c.district}, {c.state}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <RoadTypeBadge roadType={c.road_type} />
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      Defect: {c.primary_damage_type || 'Road Defect'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold border ${
                      c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      c.priority === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {c.priority}
                    </span>
                  </div>

                  {/* Road Image preview */}
                  {c.image_url && (
                    <div className="h-40 rounded-2xl overflow-hidden border border-slate-700">
                      <img
                        src={c.image_url}
                        alt={c.road_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> Details
                  </Link>

                  {['Repair Completed', 'Authority Verification', 'Closed'].includes(c.status) ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                        Repair Completed
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openUpdateModal(c)}
                        className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Wrench className="h-3.5 w-3.5" /> Update Stage
                      </button>

                      {canDirectResolve && (
                        <button
                          onClick={() => openUpdateModal(c, 'Repair Completed')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolve Damage
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

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
                    enableAiValidation={true}
                    title="Repaired Road Proof"
                    subtitle="Verify work completion"
                    capturePrompt="Click Image"
                    captureDescription="Take a clear live photo of the repaired road surface"
                    hideDeviceCameraFallback={true}
                    onValidationChange={(isValid) => {
                      setIsAiValid(isValid);
                      setIsAiValidating(false);
                    }}
                    onImageCapture={async (file) => {
                      setIsAiValidating(true);
                      setIsAiValid(false); // disable submit until proven valid
                      setCompletionImage(file);
                      setImagePreview(URL.createObjectURL(file));
                      
                      if (selectedComplaint?.latitude && selectedComplaint?.longitude) {
                        setIsValidatingGps(true);
                        setGpsError('');
                        
                        const loc = await detectCurrentLocation();
                        if (loc.success) {
                          const dist = calculateDistance(
                            loc.latitude, loc.longitude, 
                            selectedComplaint.latitude, selectedComplaint.longitude
                          );
                          
                          if (dist !== null && dist > 50) {
                            setGpsError(`You are ${Math.round(dist)} meters away from the reported location. You must be within 50m.`);
                          }
                        } else {
                          setGpsError('Could not verify GPS location. Please allow location access.');
                        }
                        setIsValidatingGps(false);
                      }
                    }}
                    onImageClear={() => {
                      setCompletionImage(null);
                      setImagePreview(null);
                      setGpsError('');
                      setIsAiValid(true);
                      setIsAiValidating(false);
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
                  isValidatingGps ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-amber-300 text-xs font-bold border border-amber-500/30">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      Verifying location...
                    </div>
                  ) : gpsError ? (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-medium mb-2 max-w-xs text-right shadow-md shadow-rose-500/10">
                        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                        <span>{gpsError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCompletionImage(null);
                          setImagePreview(null);
                          setGpsError('');
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold border border-rose-500/40 transition-colors"
                      >
                        Clear Image & Try Again
                      </button>
                    </div>
                  ) : isAiValidating ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-amber-300 text-xs font-bold border border-amber-500/30">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      Analyzing image...
                    </div>
                  ) : !isAiValid ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-medium max-w-xs text-right">
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>Image invalid. Please capture a clear road image.</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {submitting ? 'Resolving Repair...' : 'Resolved (Submit for Verification)'}
                    </button>
                  )
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

export default EngineerAssignments;
