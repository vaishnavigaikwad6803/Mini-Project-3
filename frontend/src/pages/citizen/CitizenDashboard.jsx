import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import ComplaintTimeline from '../../components/timeline/ComplaintTimeline';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import CitizenSafetyImpactBadge from '../../components/common/CitizenSafetyImpactBadge';
import { useNotifications } from '../../context/NotificationContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  Camera,
  PlusCircle,
  RefreshCw,
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  Search,
  ArrowRight,
  MapPin,
  Eye,
  AlertTriangle,
  Navigation,
  Sparkles,
  Layers,
  X,
  Check,
  Shield,
  Building2,
  HardHat,
  Phone,
  Calendar,
  AlertCircle,
  Info,
  Map as MapIcon,
  Lock,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Cpu,
  Flame,
  Activity
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ROAD_DIVISIONS,
  detectCurrentLocation,
  reverseGeocodeCoords,
  detectRoadTypeFromLocation,
  DEFAULT_MUMBAI_CENTER,
  getClosestMaharashtraDistrict,
  MAHARASHTRA_DISTRICTS
} from '../../utils/geoUtils';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { t } = useLanguage();

  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [publicAnalytics, setPublicAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Auto-detected Location State
  const [userLocation, setUserLocation] = useState({
    latitude: DEFAULT_MUMBAI_CENTER[0],
    longitude: DEFAULT_MUMBAI_CENTER[1],
    village: null,
    taluka: null,
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    displayName: 'Mumbai Suburban, Maharashtra',
    road_name: 'Mumbai Suburban Main Road',
    road_type: 'Municipal/City Road',
    accuracy: null,
    accuracyLevel: 'good',
    accuracyMessage: 'Standard location',
    isLocating: false,
    message: ''
  });

  // Road Division Filter state
  const [activeDivision, setActiveDivision] = useState('ALL');
  // 4th Image Clickable KPI State
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleStatusFilterClick = (key) => {
    setStatusFilter((prev) => (prev === key ? 'ALL' : key));
    // Smooth scroll down to complaints section
    const el = document.getElementById('citizen-complaints-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // View Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Auto-detect GPS location on dashboard mount
  const runLocationDetection = async () => {
    setUserLocation(prev => ({ ...prev, isLocating: true, message: 'Acquiring high-accuracy device GPS...' }));
    const loc = await detectCurrentLocation();
    const detectedType = loc.roadType || 'Municipal/City Road';
    setUserLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
      village: loc.village,
      taluka: loc.taluka,
      district: loc.district,
      state: loc.state || 'Maharashtra',
      displayName: loc.displayName || `${loc.district}, Maharashtra`,
      road_name: loc.road_name,
      road_type: detectedType,
      accuracy: loc.accuracy,
      accuracyLevel: loc.accuracyLevel,
      accuracyMessage: loc.accuracyMessage,
      isLocating: false,
      message: loc.message
    });
  };

  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [statsData, complaintsData, analyticsData] = await Promise.all([
        complaintService.getCitizenStats(),
        complaintService.getMyComplaints(),
        complaintService.getPublicAnalytics().catch(() => null),
      ]);
      setStats(statsData);
      setRecentComplaints(complaintsData || []);
      setPublicAnalytics(analyticsData);
    } catch (err) {
      console.error("Error loading citizen dashboard:", err);
      setError('Unable to load citizen complaint data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    runLocationDetection();
  }, []);

  // Handle View Details Modal Trigger
  const handleOpenDetails = async (complaintItem) => {
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const fullData = await complaintService.getComplaintById(complaintItem.id);
      setSelectedComplaint(fullData);
    } catch (err) {
      setSelectedComplaint(complaintItem);
      showToast('Loaded local complaint preview.', 'info');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Calculate division counts for recent complaints
  const divisionCounts = {
    all: recentComplaints.length,
    nh: recentComplaints.filter(c => c.road_type === 'National Highway').length,
    state: recentComplaints.filter(c => c.road_type === 'State Highway').length,
    rural: recentComplaints.filter(c => c.road_type === 'Rural/Village Road').length,
    munci: recentComplaints.filter(c => c.road_type === 'Municipal/City Road').length,
  };

  // Compute status breakdown counts for the citizen Pie Chart
  const reportedCount = stats?.pending_complaints ?? recentComplaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'submitted' || s === 'ai analyzed' || s === 'ai_analyzed';
  }).length;

  const reviewCount = stats?.under_review_complaints ?? recentComplaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'authority assigned' || s === 'under review' || s === 'authority_assigned' || s === 'under_review';
  }).length;

  const repairCount = stats?.in_repair_complaints ?? recentComplaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    return [
      'engineer assigned', 'inspection pending', 'inspection completed',
      'repair started', 'repair in progress', 'repair completed',
      'authority verification', 'engineer_assigned', 'inspection_pending',
      'inspection_completed', 'repair_started', 'repair_in_progress',
      'repair_completed', 'authority_verification'
    ].includes(s);
  }).length;

  const resolvedCount = stats?.completed_complaints ?? recentComplaints.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'closed' || s === 'resolved';
  }).length;

  const totalCitizenComplaints = stats?.total_complaints ?? recentComplaints.length;
  const resolutionRate = totalCitizenComplaints > 0
    ? Math.round((resolvedCount / totalCitizenComplaints) * 100)
    : 0;

  const getDamageLabel = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('pothole')) return t('damage.pothole');
    if (lower.includes('longitudinal')) return t('damage.longitudinalCrack');
    if (lower.includes('transverse')) return t('damage.transverseCrack');
    if (lower.includes('alligator')) return t('damage.alligatorCrack');
    if (lower.includes('surface') || lower.includes('degradation')) return t('damage.surfaceDegradation');
    return name;
  };

  const getRoadTypeLabel = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('national')) return t('roadTypes.nationalHighway');
    if (lower.includes('state')) return t('roadTypes.stateHighway');
    if (lower.includes('muncipal') || lower.includes('municipal') || lower.includes('city')) return t('roadTypes.municipalRoad');
    if (lower.includes('rural') || lower.includes('village')) return t('roadTypes.ruralRoad');
    return name;
  };

  const citizenPieData = [
    { name: t('status.PENDING') || 'Damage Reported', count: reportedCount, color: '#f59e0b', key: 'PENDING' },
    { name: t('status.AUTHORITY_VERIFICATION') || 'Complaints Under Review', count: reviewCount, color: '#6366f1', key: 'UNDER_REVIEW' },
    { name: t('status.IN_PROGRESS') || 'In Repair', count: repairCount, color: '#a855f7', key: 'IN_REPAIR' },
    { name: t('status.CLOSED') || 'Complaints Resolved', count: resolvedCount, color: '#10b981', key: 'RESOLVED' },
  ].filter(item => item.count > 0);

  // 1. AI Damage Type Distribution Data
  const damageTypeCounts = {};
  recentComplaints.forEach((c) => {
    const dt = c.primary_damage_type || (c.ai_result && c.ai_result.primary_damage_type) || 'Road Defect';
    damageTypeCounts[dt] = (damageTypeCounts[dt] || 0) + 1;
  });

  const citizenDamageList = Object.entries(damageTypeCounts).map(([name, count]) => ({
    name: getDamageLabel(name),
    count
  }));

  const rawDamageData = citizenDamageList.length > 0
    ? citizenDamageList
    : (publicAnalytics?.damage_type_distribution && publicAnalytics.damage_type_distribution.length > 0
      ? publicAnalytics.damage_type_distribution
      : [
          { name: 'Pothole', count: 3 },
          { name: 'Surface Damage', count: 2 },
          { name: 'Alligator Crack', count: 2 },
          { name: 'Longitudinal Crack', count: 1 },
          { name: 'Transverse Crack', count: 1 }
        ]);

  const damageChartData = rawDamageData.map(d => ({
    ...d,
    name: getDamageLabel(d.name)
  }));

  // 2. Road Network Classification Distribution Data
  const ROAD_COLORS = ['#f59e0b', '#6366f1', '#06b6d4', '#10b981'];
  const roadCounts = {
    'National Highway': divisionCounts.nh,
    'State Highway': divisionCounts.state,
    'Municipal/City Road': divisionCounts.munci,
    'Rural/Village Road': divisionCounts.rural,
  };

  const hasUserRoadData = Object.values(roadCounts).some(v => v > 0);
  const roadClassificationData = hasUserRoadData
    ? Object.entries(roadCounts)
        .filter(([_, count]) => count > 0)
        .map(([name, count], idx) => ({
          name: getRoadTypeLabel(name),
          count,
          color: ROAD_COLORS[idx % ROAD_COLORS.length]
        }))
    : (publicAnalytics?.road_type_distribution && publicAnalytics.road_type_distribution.length > 0
      ? publicAnalytics.road_type_distribution.map((item, idx) => ({
          name: getRoadTypeLabel(item.name.split('/')[0]),
          count: item.count,
          color: ROAD_COLORS[idx % ROAD_COLORS.length]
        }))
      : [
          { name: t('roadTypes.nationalHighway'), count: 2, color: '#f59e0b' },
          { name: t('roadTypes.stateHighway'), count: 2, color: '#6366f1' },
          { name: t('roadTypes.municipalRoad'), count: 3, color: '#06b6d4' },
          { name: t('roadTypes.ruralRoad'), count: 1, color: '#10b981' }
        ]);

  // 3. Hazard Urgency & Priority Breakdown Data
  const priorityCountMap = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  recentComplaints.forEach((c) => {
    const p = c.priority || 'Medium';
    if (priorityCountMap[p] !== undefined) {
      priorityCountMap[p]++;
    } else {
      priorityCountMap.Medium++;
    }
  });

  const hasPriorityStats = Object.values(priorityCountMap).some(v => v > 0);
  const priorityChartData = hasPriorityStats
    ? [
        { name: t('priority.Critical') || 'Critical', count: priorityCountMap.Critical, color: '#ef4444' },
        { name: t('priority.High') || 'High', count: priorityCountMap.High, color: '#f97316' },
        { name: t('priority.Medium') || 'Medium', count: priorityCountMap.Medium, color: '#eab308' },
        { name: t('priority.Low') || 'Low', count: priorityCountMap.Low, color: '#10b981' },
      ].filter(item => item.count > 0)
    : [
        { name: t('priority.Critical') || 'Critical', count: 2, color: '#ef4444' },
        { name: t('priority.High') || 'High', count: 3, color: '#f97316' },
        { name: t('priority.Medium') || 'Medium', count: 2, color: '#eab308' },
        { name: t('priority.Low') || 'Low', count: 1, color: '#10b981' },
      ];

  // 4. Monthly Reporting Velocity & Repair Trend Data
  const monthlyActivityData = publicAnalytics?.monthly_trends && publicAnalytics.monthly_trends.length > 0
    ? publicAnalytics.monthly_trends
    : [
        { month: 'Oct', complaints: 1, resolved: 0 },
        { month: 'Nov', complaints: 2, resolved: 1 },
        { month: 'Dec', complaints: 3, resolved: 2 },
        { month: 'Jan', complaints: 4, resolved: 3 },
        { month: 'Feb', complaints: 5, resolved: 4 },
        { month: 'Mar', complaints: Math.max(2, totalCitizenComplaints), resolved: resolvedCount },
      ];

  // Filter complaints based on active road division AND clickable status filter
  const filteredComplaints = recentComplaints.filter((c) => {
    // 1. Division filter
    if (activeDivision === 'NH' && c.road_type !== 'National Highway') return false;
    if (activeDivision === 'STATE' && c.road_type !== 'State Highway') return false;
    if (activeDivision === 'RURAL' && c.road_type !== 'Rural/Village Road') return false;
    if (activeDivision === 'MUNCI' && c.road_type !== 'Municipal/City Road') return false;

    // 2. Status filter
    if (statusFilter === 'ALL') return true;
    const st = (c.status || '').toLowerCase();
    if (statusFilter === 'PENDING') {
      return st === 'submitted' || st === 'ai analyzed' || st === 'ai_analyzed';
    }
    if (statusFilter === 'UNDER_REVIEW') {
      return st === 'authority assigned' || st === 'under review' || st === 'authority_assigned' || st === 'under_review';
    }
    if (statusFilter === 'IN_REPAIR') {
      return [
        'engineer assigned', 'inspection pending', 'inspection completed',
        'repair started', 'repair in progress', 'repair completed',
        'authority verification', 'engineer_assigned', 'inspection_pending',
        'inspection_completed', 'repair_started', 'repair_in_progress',
        'repair_completed', 'authority_verification'
      ].includes(st);
    }
    if (statusFilter === 'RESOLVED') {
      return st === 'closed' || st === 'resolved';
    }
    return true;
  });

  if (loading) return <Loader text="Loading your Maharashtra Citizen Dashboard..." />;

  return (
    <div className="space-y-8 pb-12">

      {/* ERROR ALERT BANNER */}
      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* 1. AUTO-DETECTED LIVE LOCATION STATUS BANNER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 relative">
            <Navigation className={`h-5 w-5 ${userLocation.isLocating ? 'animate-spin' : ''}`} />
            {!userLocation.isLocating && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse"></span>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {t('citizen.liveLocation')}
              </span>
              <span className="text-xs text-slate-400">{t('citizen.sourceOfTruth')}</span>
              {userLocation.accuracyLevel === 'good' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">{t('citizen.highAccuracy')}</span>
              )}
              {userLocation.accuracyLevel === 'poor' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">{t('citizen.lowAccuracy')}</span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {userLocation.isLocating ? t('citizen.detecting') : `📍 ${userLocation.displayName || `${userLocation.district}, Maharashtra`}`}
            </h3>
            <p className="text-xs font-mono text-slate-400">
              {t('citizen.coordinates')}: <strong className="text-amber-400">{userLocation.latitude.toFixed(6)}° N, {userLocation.longitude.toFixed(6)}° E</strong>
              {userLocation.accuracy !== null && (
                <span className="text-slate-400 text-xs ml-2 font-mono">
                  ({t('citizen.gpsAccuracy')}: ±<strong>{userLocation.accuracy}m</strong>)
                </span>
              )}
            </p>
            {userLocation.accuracyLevel === 'poor' && (
              <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium mt-1">
                <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Your location accuracy is low. Please wait for a better GPS signal or try again.</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/map"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <MapIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t('nav.liveMap')}</span>
          </Link>
          <Link
            to="/citizen/report"
            className="btn-primary py-2 px-3.5 text-xs font-bold shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('citizen.reportRoadHazard')}</span>
          </Link>
          <button
            type="button"
            onClick={runLocationDetection}
            disabled={userLocation.isLocating}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            aria-label="Refresh GPS coordinates"
          >
            <Navigation className={`h-3.5 w-3.5 text-amber-400 ${userLocation.isLocating ? 'animate-spin' : ''}`} />
            {userLocation.isLocating ? t('citizen.detecting') : t('citizen.refreshGps')}
          </button>
        </div>
      </div>

      {/* Citizen Safety & Community Impact Gauge */}
      <CitizenSafetyImpactBadge complaints={recentComplaints} />

      {/* 3. CITIZEN VISUAL ANALYTICS & INFRASTRUCTURE INTELLIGENCE SUITE */}
      <div className="space-y-6">

        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BarChart3 className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-white font-['Outfit']">
                {t('citizen.analyticsTitle')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t('citizen.liveTelemetry')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('citizen.analyticsSubtitle')}
            </p>
          </div>
        </div>

        {/* TIER 1: STATUS LIFECYCLE DONUT & RESOLUTION VELOCITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. Interactive Donut / Pie Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {t('citizen.statusBreakdown')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    {t('citizen.lifecycleDist')}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {t('citizen.statusBreakdownDesc')}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BarChart3 className="h-4 w-4" />
              </span>
            </div>

            {citizenPieData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 pt-2">
                <div className="h-60 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={citizenPieData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                      >
                        {citizenPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            className="cursor-pointer transition-transform hover:opacity-80"
                            onClick={() => handleStatusFilterClick(entry.key)}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Breakdown Legend & Clickable Filter Pills */}
                <div className="space-y-2.5">
                  {citizenPieData.map((item) => {
                    const pct = totalCitizenComplaints > 0 ? ((item.count / totalCitizenComplaints) * 100).toFixed(0) : 0;
                    const isFiltered = statusFilter === item.key;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleStatusFilterClick(item.key)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isFiltered
                            ? 'bg-slate-800 border-amber-400/80 ring-1 ring-amber-400/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">{item.count}</span>
                          <span className="text-[11px] font-mono text-slate-400">({pct}%)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <p>No complaints reported yet.</p>
                <Link to="/citizen/report" className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{t('citizen.reportRoadHazard')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* 2. Resolution Progress Metric Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{t('citizen.resolutionVelocity')}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <h4 className="text-3xl font-extrabold text-white font-['Outfit']">
                {resolutionRate}% {t('citizen.resolved')}
              </h4>
              <p className="text-xs text-slate-400 mt-1.5">
                {resolvedCount} of {totalCitizenComplaints} {t('citizen.verifiedRepaired')}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-4 border border-slate-700/60">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, resolutionRate))}%` }}
                />
              </div>

              {/* Active Status Filter Chip */}
              {statusFilter !== 'ALL' && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="text-xs text-amber-300">
                    <span className="text-slate-400 block text-[10px] uppercase">{t('citizen.activeKpiFilter')}</span>
                    <strong className="font-semibold">{statusFilter.replace('_', ' ')}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className="text-[11px] text-amber-400 hover:text-white underline font-semibold"
                  >
                    {t('citizen.clearFilter')}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <Link
                to="/citizen/report"
                className="btn-primary w-full py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Camera className="h-4 w-4" />
                <span>{t('citizen.reportNew')}</span>
              </Link>
            </div>
          </div>

        </div>

        {/* TIER 2: AI DAMAGE TYPE BREAKDOWN & ROAD NETWORK CLASSIFICATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Card A: AI-Detected Road Defect Distribution */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {t('citizen.aiDefectsTitle')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30 flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-orange-400" />
                    YOLOv8 Vision
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {t('citizen.aiDefectsSubtitle')}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Activity className="h-4 w-4" />
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={damageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <defs>
                    <linearGradient id="citizenDamageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar
                    dataKey="count"
                    name={t('common.complaints') || "Defects Identified"}
                    fill="url(#citizenDamageGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Detected by automated model inference
              </span>
              <span className="font-mono text-slate-300">
                {damageChartData.reduce((acc, curr) => acc + curr.count, 0)} total defects cataloged
              </span>
            </div>
          </div>

          {/* Card B: Road Network Classification Breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {t('citizen.roadNetworkTitle')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                    Jurisdiction Split
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {t('citizen.roadNetworkSubtitle')}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Layers className="h-4 w-4" />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 pt-2">
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roadClassificationData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={4}
                    >
                      {roadClassificationData.map((entry, index) => (
                        <Cell key={`road-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Road Authority Legend */}
              <div className="space-y-2">
                {roadClassificationData.map((item) => {
                  const total = roadClassificationData.reduce((acc, c) => acc + c.count, 0);
                  const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
                  return (
                    <div
                      key={item.name}
                      className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{item.count}</span>
                        <span className="text-[10px] font-mono text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span>Authority: NHAI / Maharashtra PWD / Municipal / ZP</span>
              <span className="text-cyan-400 font-medium">GPS Auto-Routed</span>
            </div>
          </div>

        </div>

        {/* TIER 3: MONTHLY INTAKE & REPAIR TRAJECTORY + HAZARD SLA TRIAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Card A (2 Cols): Monthly Reporting & Resolution Trends */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {t('citizen.monthlyTrendsTitle')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    Trend Analysis
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {t('citizen.monthlyTrendsSubtitle')}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="citizenComplaintsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="citizenResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    name={t('citizen.myReports') || "Reported Defects"}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#citizenComplaintsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name={t('home.statsResolved') || "Repairs Completed"}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#citizenResolvedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active resolution pipeline progressing steadily
              </span>
              <span className="text-slate-400">Historical performance across Maharashtra</span>
            </div>
          </div>

          {/* Card B (1 Col): Hazard Severity & SLA Triage */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {t('citizen.urgencyTitle')}
                  </h3>
                  <span className="p-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <Flame className="h-3.5 w-3.5" />
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Triage Matrix
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                {t('citizen.urgencySubtitle')}
              </p>

              {/* Severity Levels */}
              <div className="space-y-3">
                {priorityChartData.map((p) => {
                  const totalP = priorityChartData.reduce((acc, c) => acc + c.count, 0);
                  const pct = totalP > 0 ? Math.round((p.count / totalP) * 100) : 0;
                  const slaText = p.name === 'Critical' ? '< 24h SLA' : p.name === 'High' ? '< 48h SLA' : p.name === 'Medium' ? '3-5 Days' : 'Routine';

                  return (
                    <div key={p.name} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="font-semibold text-white">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border border-slate-700 bg-slate-800 text-slate-300">
                            {slaText}
                          </span>
                          <span className="font-mono font-bold text-white">{p.count}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Auto-triaged by AI
              </span>
              <span>Fast-track response</span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. ROAD DIVISION SELECTION & METRICS BAR (NH, STATE, RURAL, MUNCI) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              Maharashtra Road Network Divisions
            </h2>
            <p className="text-xs text-slate-400">
              Categorized administrative jurisdictions for automated authority routing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROAD_DIVISIONS.map((div) => {
            const isSelected = activeDivision === div.key;
            let count = 0;
            if (div.key === 'NH') count = divisionCounts.nh;
            else if (div.key === 'STATE') count = divisionCounts.state;
            else if (div.key === 'RURAL') count = divisionCounts.rural;
            else if (div.key === 'MUNCI') count = divisionCounts.munci;

            return (
              <div
                key={div.key}
                onClick={() => setActiveDivision(isSelected ? 'ALL' : div.key)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${isSelected
                  ? `${div.activeClass} border-transparent scale-[1.02]`
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{div.icon}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                    {count} Reported
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs uppercase opacity-80">
                      {div.shortLabel}
                    </span>
                    <h3 className="text-sm font-extrabold truncate">
                      {div.value}
                    </h3>
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-slate-900/80 font-medium' : 'text-slate-400'
                    }`}>
                    {div.authority}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? 'font-bold' : 'text-slate-500'}>
                    {isSelected ? '✓ Filter Active' : 'Click to filter'}
                  </span>
                  <span className="font-mono">{div.key}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. KPI STATS CARDS (CLICKABLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title={t('home.statsTotalComplaints')}
          value={stats?.total_complaints || 0}
          subtitle="All-time submissions"
          icon={FileText}
          color="amber"
          onClick={() => handleStatusFilterClick('ALL')}
          isActive={statusFilter === 'ALL'}
        />
        <StatsCard
          title={t('status.PENDING')}
          value={stats?.pending_complaints || 0}
          subtitle="Under authority triage"
          icon={Clock}
          color="cyan"
          onClick={() => handleStatusFilterClick('PENDING')}
          isActive={statusFilter === 'PENDING'}
        />
        <StatsCard
          title={t('status.AUTHORITY_VERIFICATION')}
          value={stats?.under_review_complaints || 0}
          subtitle="Authority assigned"
          icon={Search}
          color="indigo"
          onClick={() => handleStatusFilterClick('UNDER_REVIEW')}
          isActive={statusFilter === 'UNDER_REVIEW'}
        />
        <StatsCard
          title={t('status.IN_PROGRESS')}
          value={stats?.in_repair_complaints || 0}
          subtitle="Field engineer active"
          icon={Wrench}
          color="purple"
          onClick={() => handleStatusFilterClick('IN_REPAIR')}
          isActive={statusFilter === 'IN_REPAIR'}
        />
        <StatsCard
          title={t('status.CLOSED')}
          value={stats?.completed_complaints || 0}
          subtitle="Verified & closed"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => handleStatusFilterClick('RESOLVED')}
          isActive={statusFilter === 'RESOLVED'}
        />
      </div>

      {/* 6. COMPLAINTS LIST TABLE */}
      <div id="citizen-complaints-section" className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-['Outfit']">
                {t('citizen.myReports')}
              </h2>
              {activeDivision !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  Filtered by {activeDivision}
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                  Status: {statusFilter.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Live status, assigned engineer, and tracking for your road defect submissions ({filteredComplaints.length} shown)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(activeDivision !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setActiveDivision('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700"
              >
                {t('common.clearFilters')}
              </button>
            )}
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={
              activeDivision !== 'ALL' && statusFilter !== 'ALL'
                ? `No ${statusFilter.replace('_', ' ')} Complaints in ${activeDivision} Division`
                : activeDivision !== 'ALL'
                ? `No Complaints in ${activeDivision} Division`
                : statusFilter !== 'ALL'
                ? `No ${statusFilter.replace('_', ' ')} Complaints Found`
                : 'No Complaints Recorded Yet'
            }
            description={
              activeDivision !== 'ALL' || statusFilter !== 'ALL'
                ? 'None of your complaints match the active filter criteria. Try selecting another filter or clearing all filters.'
                : 'You have not submitted any road damage reports yet.'
            }
          />
        ) : (
          <>
            {/* Mobile Cards (sm:hidden) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredComplaints.slice(0, 8).map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
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
                    <p className="text-xs text-slate-400 mt-0.5">📍 {c.district}, {c.state}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <RoadTypeBadge roadType={c.road_type} size="xs" />
                    <Link
                      to={`/complaints/${c.id}`}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-amber-400" />
                      <span>{t('common.details')}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{t('table.id')}</th>
                    <th className="py-3 px-4">{t('table.date')}</th>
                    <th className="py-3 px-4">{t('table.roadName')}</th>
                    <th className="py-3 px-4">{t('table.location')}</th>
                    <th className="py-3 px-4">{t('table.roadType')}</th>
                    <th className="py-3 px-4">{t('table.aiDetection')}</th>
                    <th className="py-3 px-4">{t('table.authority')}</th>
                    <th className="py-3 px-4">{t('table.status')}</th>
                    <th className="py-3 px-4 text-right">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredComplaints.slice(0, 8).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {c.id}
                      </td>
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
                              <span className="text-[10px] text-slate-400 block truncate max-w-[130px] group-hover:text-slate-300">{c.landmark}</span>
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
                        <span className="text-slate-200 font-semibold block">
                          {c.primary_damage_type || c.damage_type || 'Road Defect'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                            c.priority === 'High' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-amber-500/20 text-amber-300'
                          }`}>
                          {t(`priority.${c.priority}`) || c.priority} {t('common.priority')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {c.authority_name || 'Pending'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> {t('common.details')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. COMPREHENSIVE VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => { setDetailsModalOpen(false); setSelectedComplaint(null); }}
        title={selectedComplaint ? `${selectedComplaint.id} • ${selectedComplaint.road_name}` : 'Complaint Details'}
        maxWidth="max-w-3xl"
      >
        {loadingDetails ? (
          <div className="py-12 text-center space-y-3">
            <Loader text="Loading complete database record..." />
          </div>
        ) : selectedComplaint ? (
          <div className="space-y-6">

            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                {selectedComplaint.id}
              </span>
              <StatusBadge status={selectedComplaint.status} />
              <RoadTypeBadge roadType={selectedComplaint.road_type} />
            </div>

            {/* Location & Authority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">

              {/* Location Box */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">Location Details</span>
                <strong className="text-white block text-sm flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  {selectedComplaint.district}, {selectedComplaint.state}
                </strong>
                {selectedComplaint.landmark && (
                  <p className="text-[11px] text-slate-300">Near: {selectedComplaint.landmark}</p>
                )}
                <p className="text-[10px] font-mono text-cyan-400">
                  Coords: {selectedComplaint.latitude?.toFixed(4)}, {selectedComplaint.longitude?.toFixed(4)}
                </p>
              </div>

              {/* Responsible Authority Box */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">Responsible Authority</span>
                <strong className="text-white block text-sm flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                  {selectedComplaint.authority_name || 'Pending Assignment'}
                </strong>
                <p className="text-[11px] text-slate-400">{selectedComplaint.routing_notes || 'Jurisdiction verified via GIS'}</p>
              </div>

              {/* Priority & Defect Type */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">Defect & Severity</span>
                <strong className="text-white block text-sm">
                  {selectedComplaint.primary_damage_type || selectedComplaint.damage_type || 'Road Defect'}
                </strong>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${selectedComplaint.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    selectedComplaint.priority === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                  {selectedComplaint.priority} Priority
                </span>
              </div>

            </div>

            {/* Citizen Captured Road Damage Image Display */}
            {selectedComplaint.image_url && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Camera className="h-4 w-4" />
                    Citizen Captured Road Damage Photo
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Captured via Device Camera
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center max-h-64">
                  <img
                    src={selectedComplaint.image_url}
                    alt="Citizen Road Damage"
                    className="w-full h-56 object-cover"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {selectedComplaint.description && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">Citizen Observation</span>
                <p className="text-slate-200 leading-relaxed">{selectedComplaint.description}</p>
              </div>
            )}

            {/* Assigned Engineer Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <HardHat className="h-4 w-4" />
                  Assigned Field Engineer
                </span>
                <span className="text-[10px] text-slate-500">Field Maintenance Team</span>
              </div>

              {selectedComplaint.engineer_name || selectedComplaint.repair?.engineer_name ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Engineer Name</span>
                    <strong className="text-white">
                      {selectedComplaint.engineer_name || selectedComplaint.repair?.engineer_name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Employee ID</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {selectedComplaint.engineer_employee_id || selectedComplaint.repair?.engineer_employee_id || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedComplaint.engineer_phone || '+91 Field Desk'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">
                  Pending Authority Dispatch – An engineer will be assigned for site inspection shortly.
                </p>
              )}
            </div>

            {/* Field Repair Progress Details */}
            {selectedComplaint.repair && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" />
                    Field Repair Progress
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {selectedComplaint.repair.current_stage}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Materials Used:</span>
                    <strong className="text-slate-200">{selectedComplaint.repair.materials_used || 'Standard Pavement Mix'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Inspection / Completion Remarks:</span>
                    <p className="text-slate-300">{selectedComplaint.repair.inspection_remarks || selectedComplaint.repair.completion_remarks || 'Work scheduled according to IRC standards.'}</p>
                  </div>
                </div>

                {/* Completion Photo Proof if uploaded by engineer */}
                {selectedComplaint.repair.repair_after_image && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-emerald-400 block mb-1.5">
                      📸 Field Engineer Repaired Proof
                    </span>
                    <div className="h-44 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                      <img
                        src={selectedComplaint.repair.repair_after_image}
                        alt="Repair Completion"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Timeline History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Status Timeline & History
              </h4>
              <ComplaintTimeline
                history={selectedComplaint.status_history || []}
                currentStatus={selectedComplaint.status}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                Logged: {new Date(selectedComplaint.created_at).toLocaleString()}
              </span>
              <Link
                to={`/complaints/${selectedComplaint.id}`}
                className="btn-primary py-2 px-4 text-xs"
              >
                <Eye className="h-3.5 w-3.5" /> Open Dedicated Page
              </Link>
            </div>

          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Complaint record could not be loaded.
          </div>
        )}
      </Modal>

    </div>
  );
};

export default CitizenDashboard;
