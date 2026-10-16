import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { authorityService } from '../../services/authorityService';
import ComplaintMap, { isValidCoordinate } from '../../components/map/ComplaintMap';
import SpatialAnalyticsPanel from '../../components/map/SpatialAnalyticsPanel';
import Loader from '../../components/common/Loader';
import {
  MapPin,
  ShieldAlert,
  Layers,
  Info,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardHat,
  Compass
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PublicMap = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id') || searchParams.get('complaint_id');
  const targetLat = searchParams.get('lat');
  const targetLng = searchParams.get('lng');

  const [complaints, setComplaints] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedRoadType, setSelectedRoadType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [complaintsRes, authoritiesRes] = await Promise.allSettled([
        adminService.getMapComplaints(),
        authorityService.getAuthorities()
      ]);

      if (complaintsRes.status === 'fulfilled') {
        const data = Array.isArray(complaintsRes.value) ? complaintsRes.value : [];
        setComplaints(data);
      } else {
        console.error("Error fetching map complaints:", complaintsRes.reason);
        setError("Unable to connect to GIS spatial database. Please ensure backend is running.");
      }

      if (authoritiesRes.status === 'fulfilled') {
        const authList = Array.isArray(authoritiesRes.value) ? authoritiesRes.value : [];
        setAuthorities(authList);
      } else {
        console.warn("Authorities listing unavailable, fallback to complaints authorities:", authoritiesRes.reason);
      }
    } catch (err) {
      console.error("Unexpected error in loadData:", err);
      setError("An unexpected error occurred while loading map data.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Compute live KPI metrics from actual complaints data
  const metrics = useMemo(() => {
    const total = complaints.length;
    const valid = complaints.filter(c => isValidCoordinate(c.latitude, c.longitude)).length;
    const active = complaints.filter(c =>
      ['Submitted', 'AI Analyzed', 'Authority Assigned', 'Under Review', 'Inspection Pending'].includes(c.status)
    ).length;
    const inRepair = complaints.filter(c =>
      ['Engineer Assigned', 'Inspection Completed', 'Repair Started', 'Repair In Progress', 'Authority Verification'].includes(c.status)
    ).length;
    const resolved = complaints.filter(c =>
      ['Repair Completed', 'Closed'].includes(c.status)
    ).length;
    const critical = complaints.filter(c =>
      ['critical', 'high'].includes((c.priority || c.ai_severity || '').toLowerCase())
    ).length;

    return { total, valid, active, inRepair, resolved, critical };
  }, [complaints]);

  // Filter complaints based on user interactions in Spatial Analytics Panel
  const filteredMapComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (selectedDistrict && c.district && !c.district.toLowerCase().includes(selectedDistrict.toLowerCase())) {
        return false;
      }
      if (selectedRoadType && c.road_type !== selectedRoadType) {
        return false;
      }
      if (selectedSeverity) {
        const s = (c.ai_severity || c.priority || 'Medium').toLowerCase();
        if (s !== selectedSeverity.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, selectedDistrict, selectedRoadType, selectedSeverity]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header with Title and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
              <Shield className="h-3 w-3" /> {t('publicMap.stateNetwork', 'Maharashtra State GIS Network')}
            </span>
            <span className="text-xs text-slate-400">{t('publicMap.roadDivisions', 'Road Divisions: NHAI • PWD • PMGSY • Municipal')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            {t('publicMap.title', 'Live Road Defect GIS Spatial Map')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            {t('publicMap.subtitle', "Real-time geospatial tracking of road surface defects across Maharashtra's National Highways (NHAI), State Corridors (PWD), Rural Links (PMGSY), and Municipal Wards.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? t('publicMap.syncing', 'Syncing...') : t('publicMap.refreshGis', 'Refresh GIS')}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{t('publicMap.activeIncidents', 'Active Incidents')}</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-['Outfit']">
            {metrics.active}
          </div>
          <span className="text-[11px] text-slate-400">{t('publicMap.awaitingInspection', 'Awaiting inspection/dispatch')}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{t('publicMap.inRepairWork', 'In Repair Work')}</span>
            <HardHat className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-400 font-['Outfit']">
            {metrics.inRepair}
          </div>
          <span className="text-[11px] text-slate-400">{t('publicMap.assignedEngineers', 'Assigned field engineers')}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{t('publicMap.repairedResolved', 'Repaired & Resolved')}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit']">
            {metrics.resolved}
          </div>
          <span className="text-[11px] text-slate-400">{t('publicMap.verifiedRestorations', 'Verified road restorations')}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{t('publicMap.spatialCoverage', 'Spatial Coverage')}</span>
            <MapPin className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-['Outfit']">
            {metrics.valid} <span className="text-xs font-normal text-slate-400">/ {metrics.total}</span>
          </div>
          <span className="text-[11px] text-slate-400">{t('publicMap.gpsGeocoded', 'GPS geocoded coordinates')}</span>
        </div>
      </div>

      {/* Spatial GIS Analytics Panel */}
      <SpatialAnalyticsPanel
        complaints={complaints}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
        selectedRoadType={selectedRoadType}
        onSelectRoadType={setSelectedRoadType}
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
      />

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(false)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Click any marker to inspect damage photography, assigned authority, and designated field engineer.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-mono text-[11px]">OpenStreetMap Live Vector Tiles</span>
        </div>
      </div>

      {/* Map Container */}
      {loading ? (
        <div className="h-[620px] rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
          <Loader text="Loading Maharashtra GIS spatial layers and defect pins..." />
        </div>
      ) : (
        <ComplaintMap
          complaints={filteredMapComplaints}
          authorities={authorities}
          height="h-[620px]"
          showFilters={true}
          startWithIndia={!targetId && !targetLat}
          initialComplaintId={targetId}
          initialCoordinates={targetLat && targetLng ? [parseFloat(targetLat), parseFloat(targetLng)] : null}
        />
      )}

    </div>
  );
};

export default PublicMap;
