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
  FileText,
  User
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const TrackComplaint = () => {
  const { t } = useLanguage();
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

  const getAuthorityDetails = (item) => {
    if (!item) {
      return {
        fullName: 'Pending Assignment',
        division: 'Awaiting routing',
        department: 'Road Transport Department',
        badge: 'Pending',
        badgeColor: 'bg-slate-700/40 text-slate-300 border-slate-600'
      };
    }

    const rawName = item.authority_name || '';
    const rawType = item.authority_type || '';
    const rawCode = item.authority_code || '';
    const rawRoad = item.road_type || '';
    const combined = `${rawName} ${rawType} ${rawCode} ${rawRoad}`.toUpperCase();

    if (combined.includes('NHAI') || combined.includes('NATIONAL HIGHWAY')) {
      return {
        fullName: 'National Highways Authority of India (NHAI)',
        division: 'Regional Office Mumbai (RO Mumbai)',
        department: 'National Highway Authority',
        badge: 'NHAI',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }

    if (combined.includes('PWD') || combined.includes('STATE HIGHWAY')) {
      return {
        fullName: 'Maharashtra Public Works Department (PWD)',
        division: 'Pune Highway Division',
        department: 'State Highway Department (PWD)',
        badge: 'State PWD',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
      };
    }

    if (combined.includes('BMC') || combined.includes('MCGM') || combined.includes('MUNICIPAL')) {
      return {
        fullName: 'Brihanmumbai Municipal Corporation (BMC)',
        division: 'Roads & Traffic Department',
        department: 'Municipal Corporation (BMC)',
        badge: 'BMC',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
      };
    }

    if (combined.includes('PMGSY') || combined.includes('RURAL') || combined.includes('ZILLA') || combined.includes('JILHA')) {
      const dist = item.district || 'Kolhapur';
      return {
        fullName: rawName || `${dist} Zilla Parishad (PMGSY Rural Roads)`,
        division: `${dist} Zilla Parishad Rural Roads`,
        department: 'Rural Road Department (PMGSY)',
        badge: 'PMGSY',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      };
    }

    return {
      fullName: rawName || 'Road Transport Authority',
      division: item.district ? `${item.district} Division` : 'Regional Office',
      department: rawType || 'Roads Department',
      badge: rawCode || 'Authority',
      badgeColor: 'bg-slate-700/40 text-slate-300 border-slate-600'
    };
  };

  const authDetails = complaint ? getAuthorityDetails(complaint) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header & Search Bar */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          {t('track.badge', 'Public Status Portal')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
          {t('track.title', 'Track Road Damage Complaint')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {t('track.subtitle', 'Enter your unique Complaint Tracking ID (e.g. RGD-2026-1001) to view real-time AI damage results and progress timeline.')}
        </p>

        <form onSubmit={handleSearch} className="flex items-center rounded-2xl bg-slate-900 border border-slate-700/80 p-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-2xl transition-all">
          <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            required
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            placeholder={t('track.placeholder', 'e.g. RGD-2026-1001')}
            className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none uppercase font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-2.5 px-5 font-bold text-xs shrink-0"
          >
            {loading ? t('track.searching', 'Searching...') : t('track.searchBtn', 'Search')}
          </button>
        </form>

        {/* Demo Quick ID pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-400">
          <span>{t('track.demoIds', 'Try Demo IDs:')}</span>
          {['RGD-2026-1001', 'RGD-2026-1002', 'RGD-2026-1003'].map((demoId) => (
            <button
              key={demoId}
              type="button"
              onClick={() => {
                setComplaintId(demoId);
                fetchComplaint(demoId);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-400 font-mono text-[11px] font-semibold transition-all hover:scale-105"
            >
              {demoId}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && <Loader text={t('common.loading', 'Querying complaint lifecycle audit log...')} />}

      {/* Error state */}
      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">{t('track.recordNotFound', 'Record Not Found')}:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Initial state if no search attempted yet */}
      {!complaint && !loading && !error && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white font-['Outfit']">
            {t('track.emptyTitle', 'Search Any Public Road Damage Report')}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {t('track.emptyDesc', 'Enter your 12-character Complaint ID to check real-time progress: computer vision severity score, assigned jurisdiction (NHAI / PWD / BMC / PMGSY), and engineer repair certifications.')}
          </p>
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
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  {t('track.submittedOn', 'Submitted On')}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {new Date(complaint.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {complaint.priority && (
                  <div className="mt-2 text-xs">
                    <span className="text-slate-400">{t('common.priority', 'Priority')}: </span>
                    <strong className="text-rose-400 font-bold">{complaint.priority}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Meta details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Citizen Name (Submitted the Report) */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('table.raisedBy', 'Raised By')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shrink-0">
                      {complaint.citizen_role ? (complaint.citizen_role.charAt(0).toUpperCase() + complaint.citizen_role.slice(1).toLowerCase()) : 'Citizen'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-start gap-2">
                    <User className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white leading-tight break-words" title={complaint.citizen_name || complaint.citizen?.full_name || 'Citizen'}>
                        {complaint.citizen_name || complaint.citizen?.full_name || 'Citizen'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        Designation: <span className="text-emerald-300 font-semibold">{complaint.citizen_role ? (complaint.citizen_role.charAt(0).toUpperCase() + complaint.citizen_role.slice(1).toLowerCase()) : 'Citizen'}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">Raised By:</span>
                  <span className="truncate text-slate-300">{complaint.citizen_name || 'Citizen'} ({complaint.citizen_role ? (complaint.citizen_role.charAt(0).toUpperCase() + complaint.citizen_role.slice(1).toLowerCase()) : 'Citizen'})</span>
                </div>
              </div>

              {/* 2. Assigned Authority: Proper Name of Authority, and their Department */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('track.assignedAuthority', 'Assigned Authority')}
                    </span>
                    {authDetails && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold border shrink-0 ${authDetails.badgeColor}`}>
                        {authDetails.badge}
                      </span>
                    )}
                  </div>
                  {/* Proper Authority Full Name & Division */}
                  <div className="mt-1 flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white leading-tight break-words" title={authDetails ? authDetails.fullName : (complaint.authority_name || 'Pending Assignment')}>
                        {authDetails ? authDetails.fullName : (complaint.authority_name || 'Pending Assignment')}
                      </p>
                      {authDetails?.division && (
                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                          {authDetails.division}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Department */}
                {authDetails && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-[11px] text-amber-300/90 font-medium">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold shrink-0">Department:</span>
                    <span className="truncate font-semibold text-amber-200" title={authDetails.department}>{authDetails.department}</span>
                  </div>
                )}
              </div>

              {/* 3. Field Engineer */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('track.fieldEngineer', 'Field Engineer')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shrink-0">
                      Field Ops
                    </span>
                  </div>
                  <div className="mt-1 flex items-start gap-2">
                    <HardHat className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white leading-tight break-words" title={complaint.repair?.engineer_name || 'Pending Engineer Dispatch'}>
                        {complaint.repair?.engineer_name || 'Pending Engineer Dispatch'}
                      </p>
                      {complaint.repair?.engineer_employee_id ? (
                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                          ID: {complaint.repair.engineer_employee_id}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          Awaiting Allocation
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">Status:</span>
                  <span className="truncate text-cyan-300 font-semibold">{complaint.repair?.engineer_name ? 'Engineer Dispatched' : 'Pending Dispatch'}</span>
                </div>
              </div>

              {/* 4. GPS Coordinates */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('citizen.coordinates', 'GPS Coordinates')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border bg-purple-500/10 text-purple-300 border-purple-500/30 shrink-0">
                      Geotag
                    </span>
                  </div>
                  <div className="mt-1 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white font-mono leading-tight break-words" title={`${complaint.latitude}, ${complaint.longitude}`}>
                        {complaint.latitude}, {complaint.longitude}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                        {complaint.landmark ? `Near ${complaint.landmark}` : 'Site Geotagged'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">Region:</span>
                  <span className="truncate text-slate-300 font-semibold">{complaint.district || 'Verified Site'}</span>
                </div>
              </div>
            </div>

            {complaint.description && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                <strong className="text-slate-200">{t('common.details', 'Citizen Description')}: </strong>
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
                {t('engineer.updateStage', 'Field Inspection & Repair Status')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">{t('engineer.currentStage', 'Current Repair Stage')}</span>
                  <strong className="text-amber-400 text-sm">{complaint.repair.current_stage}</strong>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">{t('common.assignedTo', 'Assigned Engineer')}</span>
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
