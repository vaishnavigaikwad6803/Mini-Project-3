import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import AIResultCard from '../../components/ai/AIResultCard';
import ComplaintTimeline from '../../components/timeline/ComplaintTimeline';
import Loader from '../../components/common/Loader';
import {
  Search,
  MapPin,
  Building2,
  HardHat,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';

const TrackComplaint = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [complaintId, setComplaintId] = useState(initialId);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaint = async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    setError('');
    try {
      const data = await complaintService.getComplaintById(idToFetch);
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.detail || `Complaint '${idToFetch}' was not found in the system.`);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      setComplaintId(initialId);
      fetchComplaint(initialId);
    }
  }, [initialId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (complaintId.trim()) {
      setSearchParams({ id: complaintId.trim() });
      fetchComplaint(complaintId.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header & Search Bar */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Public Status Portal</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
          Track Road Damage Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your unique Complaint Tracking ID (e.g. <code className="text-amber-400 font-bold">RGD-2026-1001</code>) to view real-time AI damage results and progress timeline.
        </p>

        <form onSubmit={handleSearch} className="flex items-center rounded-2xl bg-slate-900 border border-slate-700 p-1.5 focus-within:border-amber-500 shadow-2xl transition-all">
          <Search className="h-5 w-5 text-slate-400 ml-3" />
          <input
            type="text"
            required
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            placeholder="e.g. RGD-2026-1001"
            className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none uppercase font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && <Loader text="Querying complaint lifecycle audit log..." />}

      {/* Error state */}
      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Record Not Found:</strong>
            <p className="mt-0.5">{error}</p>
            <p className="mt-2 text-slate-400">
              Try demo IDs: <button onClick={() => { setComplaintId('RGD-2026-1001'); fetchComplaint('RGD-2026-1001'); }} className="text-amber-400 underline mr-2">RGD-2026-1001</button>
              <button onClick={() => { setComplaintId('RGD-2026-1003'); fetchComplaint('RGD-2026-1003'); }} className="text-amber-400 underline">RGD-2026-1003</button>
            </p>
          </div>
        </div>
      )}

      {/* Complaint Detail Display */}
      {complaint && (
        <div className="space-y-8 animate-in fade-in duration-200">

          {/* Main Info Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    {complaint.id}
                  </span>
                  <StatusBadge status={complaint.status} />
                  <RoadTypeBadge roadType={complaint.road_type} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-2">
                  {complaint.road_name}
                </h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  {complaint.district}, {complaint.state} {complaint.landmark && `(Near ${complaint.landmark})`}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Submitted On</span>
                <span className="text-xs font-semibold text-slate-200">
                  {new Date(complaint.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {complaint.priority && (
                  <div className="mt-2 text-xs">
                    <span className="text-slate-400">Priority: </span>
                    <strong className="text-rose-400 font-bold">{complaint.priority}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Meta details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Authority</span>
                <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-amber-400" />
                  {complaint.authority_name || 'Pending Assignment'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Field Engineer</span>
                <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  <HardHat className="h-4 w-4 text-cyan-400" />
                  {complaint.repair?.engineer_name || 'Pending Engineer Dispatch'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">GPS Coordinates</span>
                <p className="text-sm font-bold text-white mt-1 font-mono">
                  {complaint.latitude}, {complaint.longitude}
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

          {/* AI Result Card */}
          <AIResultCard aiResult={complaint.ai_result} originalImageUrl={complaint.image_url} />

          {/* Repair Details (if available) */}
          {complaint.repair && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-500" />
                Field Inspection & Repair Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Current Repair Stage</span>
                  <strong className="text-amber-400 text-sm">{complaint.repair.current_stage}</strong>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Assigned Engineer</span>
                  <strong className="text-white text-sm">{complaint.repair.engineer_name || 'N/A'}</strong>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Materials Used</span>
                  <strong className="text-slate-200">{complaint.repair.materials_used || 'Standard Pavement Mix'}</strong>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Authority Sign-off</span>
                  <strong className={complaint.repair.verification_remarks ? 'text-emerald-400' : 'text-slate-400'}>
                    {complaint.repair.verification_remarks ? 'Verified & Approved' : 'Pending Completion'}
                  </strong>
                </div>
              </div>

              {/* Repaired Proof Image if completed */}
              {complaint.repair.repair_after_image && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Repaired Road Surface (Field Photo Proof)
                  </span>
                  <div className="h-56 w-full max-w-lg rounded-xl overflow-hidden border border-emerald-500/40">
                    <img
                      src={complaint.repair.repair_after_image}
                      alt="Repaired Surface Proof"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {complaint.repair.completion_remarks && (
                    <p className="text-xs text-slate-300">
                      <strong>Engineer Remarks:</strong> {complaint.repair.completion_remarks}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline Audit Trail */}
          <ComplaintTimeline history={complaint.status_history} currentStatus={complaint.status} />

        </div>
      )}

    </div>
  );
};

export default TrackComplaint;
