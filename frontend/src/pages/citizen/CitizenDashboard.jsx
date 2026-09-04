import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import CameraCapture from '../../components/common/CameraCapture';
import ComplaintMap from '../../components/map/ComplaintMap';
import ComplaintTimeline from '../../components/timeline/ComplaintTimeline';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { 
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
  Camera,
  Info,
  Map as MapIcon
} from 'lucide-react';
import { 
  ROAD_DIVISIONS, 
  detectCurrentLocation, 
  reverseGeocodeCoords,
  detectRoadTypeFromLocation,
  DEFAULT_MUMBAI_CENTER,
  getClosestMaharashtraDistrict,
  MAHARASHTRA_DISTRICTS
} from '../../utils/geoUtils';

const DAMAGE_TYPES = [
  'Pothole',
  'Severe Crack / Fissure',
  'Surface Erosion / Cavity',
  'Alligator Cracking',
  'Edge Break / Shoulder Damage',
  'Waterlogging & Rutting Depression',
  'Manhole / Pavement Depression'
];

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
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
    accuracyMessage: '',
    isLocating: true,
    message: 'Auto-detecting your live device GPS location...'
  });

  // Road Division Filter state
  const [activeDivision, setActiveDivision] = useState('ALL');

  // Map-Click Damage Report Modal State
  const [mapReportModalOpen, setMapReportModalOpen] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    road_name: '',
    road_type: 'National Highway',
    road_type_info: null,
    damage_type: 'Pothole',
    priority: 'Medium',
    description: '',
    landmark: '',
    latitude: DEFAULT_MUMBAI_CENTER[0],
    longitude: DEFAULT_MUMBAI_CENTER[1],
    village: null,
    taluka: null,
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    displayName: 'Mumbai Suburban, Maharashtra'
  });
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageValidationError, setImageValidationError] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState('');

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

  const loadData = async () => {
    try {
      const [statsData, complaintsData] = await Promise.all([
        complaintService.getCitizenStats(),
        complaintService.getMyComplaints(),
      ]);
      setStats(statsData);
      setRecentComplaints(complaintsData);
    } catch (err) {
      console.error("Error loading citizen dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    runLocationDetection();
  }, []);

  // Handle clicking anywhere on the map to open damage reporting form with automated road type detection
  const handleMapClick = async (lat, lng) => {
    const geoInfo = await reverseGeocodeCoords(lat, lng);
    const closestDist = getClosestMaharashtraDistrict(lat, lng);
    const districtName = geoInfo?.district || closestDist.name;
    const roadName = geoInfo?.roadName || `${districtName} Road Damage`;
    const autoRoadType = geoInfo?.roadType || 'State Highway';
    const autoRoadTypeInfo = geoInfo?.roadTypeInfo || null;

    setReportFormData({
      road_name: roadName,
      road_type: autoRoadType,
      road_type_info: autoRoadTypeInfo,
      damage_type: 'Pothole',
      priority: 'Medium',
      description: `Reported road damage at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      landmark: '',
      latitude: lat,
      longitude: lng,
      district: districtName,
      state: 'Maharashtra'
    });
    setCapturedImage(null);
    setReportError('');
    setMapReportModalOpen(true);
  };

  // Open reporting modal for current live GPS location with automated road type detection
  const handleReportAtCurrentLocation = async () => {
    const lat = userLocation.latitude;
    const lng = userLocation.longitude;
    const geoInfo = await reverseGeocodeCoords(lat, lng);
    const districtName = geoInfo?.district || userLocation.district;
    const roadName = geoInfo?.roadName || userLocation.road_name || `${districtName} Main Road`;
    const autoRoadType = geoInfo?.roadType || userLocation.road_type || 'Municipal/City Road';
    const autoRoadTypeInfo = geoInfo?.roadTypeInfo || null;

    setReportFormData({
      road_name: roadName,
      road_type: autoRoadType,
      road_type_info: autoRoadTypeInfo,
      damage_type: 'Pothole',
      priority: 'Medium',
      description: `Reported damage at live location in ${districtName}`,
      landmark: '',
      latitude: lat,
      longitude: lng,
      district: districtName,
      state: 'Maharashtra'
    });
    setCapturedImage(null);
    setReportError('');
    setMapReportModalOpen(true);
  };

  // Submit Map-Click Damage Report with Captured Camera Photo
  const handleSubmitDamageReport = async (e) => {
    e.preventDefault();
    if (!reportFormData.road_name || !reportFormData.road_name.trim()) {
      setReportError('Please enter the road or street name.');
      return;
    }

    if (imageValidationError) {
      setReportError(imageValidationError);
      return;
    }

    setSubmittingReport(true);
    setReportError('');

    try {
      const data = new FormData();
      data.append('road_name', reportFormData.road_name.trim());
      data.append('road_type', reportFormData.road_type);
      data.append('damage_type', reportFormData.damage_type);
      data.append('priority', reportFormData.priority);
      data.append('description', reportFormData.description || `${reportFormData.damage_type} reported on ${reportFormData.road_name}`);
      data.append('latitude', reportFormData.latitude);
      data.append('longitude', reportFormData.longitude);
      data.append('district', reportFormData.district);
      data.append('state', 'Maharashtra');
      if (reportFormData.landmark) {
        data.append('landmark', reportFormData.landmark.trim());
      }
      // Attach captured camera image
      if (capturedImage) {
        data.append('road_image', capturedImage, capturedImage.name || 'road_damage_camera.jpg');
      }

      const response = await complaintService.submitComplaint(data);
      showToast(`Damage report #${response.id} submitted & routed to authority!`, 'success');
      setMapReportModalOpen(false);
      setCapturedImage(null);
      setImageValidationError('');
      
      // Reload dashboard complaints & stats
      await loadData();

      // Navigate to View Details for the newly created complaint
      navigate(`/complaints/${response.id}`);
    } catch (err) {
      setReportError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Handle View Details Modal Trigger
  const handleOpenDetails = async (complaintItem) => {
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const fullData = await complaintService.getComplaintById(complaintItem.id);
      setSelectedComplaint(fullData);
    } catch (err) {
      // Fallback to table item data if network error
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

  // Filter complaints based on active road division
  const filteredComplaints = recentComplaints.filter((c) => {
    if (activeDivision === 'ALL') return true;
    if (activeDivision === 'NH') return c.road_type === 'National Highway';
    if (activeDivision === 'STATE') return c.road_type === 'State Highway';
    if (activeDivision === 'RURAL') return c.road_type === 'Rural/Village Road';
    if (activeDivision === 'MUNCI') return c.road_type === 'Municipal/City Road';
    return true;
  });

  if (loading) return <Loader text="Loading your Maharashtra Citizen Dashboard..." />;

  return (
    <div className="space-y-8 pb-12">

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
                Live Auto-Location
              </span>
              <span className="text-xs text-slate-400">Device GPS Source of Truth</span>
              {userLocation.accuracyLevel === 'good' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">High Accuracy</span>
              )}
              {userLocation.accuracyLevel === 'poor' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">Low Accuracy</span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {userLocation.isLocating ? 'Acquiring Live Device GPS Coordinates...' : `📍 ${userLocation.displayName || `${userLocation.district}, Maharashtra`}`}
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Coordinates: <strong className="text-amber-400">{userLocation.latitude.toFixed(6)}° N, {userLocation.longitude.toFixed(6)}° E</strong>
              {userLocation.accuracy !== null && (
                <span className="text-slate-400 text-xs ml-2 font-mono">
                  (GPS Accuracy: ±<strong>{userLocation.accuracy}m</strong>)
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runLocationDetection}
            disabled={userLocation.isLocating}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Navigation className="h-3.5 w-3.5 text-amber-400" />
            {userLocation.isLocating ? 'Detecting...' : 'Refresh GPS'}
          </button>

          <button
            type="button"
            onClick={handleReportAtCurrentLocation}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Report at My Location
          </button>
        </div>
      </div>

      {/* 2. TOP HERO / MAP REPORTING HUB */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Maharashtra Road Defect Grievance Center
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit'] tracking-tight">
              Interactive Map Damage Reporting
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Click anywhere on the Maharashtra interactive road map to report potholes, surface damage, and cracks. Your damage report is automatically assigned to the responsible authority (**NHAI**, **State PWD**, **PMGSY Rural**, or **Municipal Corporation**).
            </p>
          </div>

          <div className="w-full sm:w-auto flex flex-col gap-3">
            <button
              type="button"
              onClick={handleReportAtCurrentLocation}
              className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group border-2 border-amber-300"
            >
              <div className="p-2.5 rounded-xl bg-slate-950 text-amber-400 group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-900">
                  Instant Map Report
                </span>
                <span className="text-base font-extrabold">
                  📍 Click Map to Report Damage
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ROAD DIVISION SELECTION & METRICS BAR (NH, STATE, RURAL, MUNCI) */}
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
                className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? `${div.activeClass} border-transparent scale-[1.02]`
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{div.icon}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
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
                  <p className={`text-[11px] mt-1 line-clamp-2 ${
                    isSelected ? 'text-slate-900/80 font-medium' : 'text-slate-400'
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

      {/* 4. KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Reports"
          value={stats?.total_complaints || 0}
          subtitle="All-time submissions"
          icon={FileText}
          color="amber"
        />
        <StatsCard
          title="Pending Review"
          value={stats?.pending_complaints || 0}
          subtitle="Under authority triage"
          icon={Clock}
          color="cyan"
        />
        <StatsCard
          title="Under Review"
          value={stats?.under_review_complaints || 0}
          subtitle="Authority assigned"
          icon={Search}
          color="indigo"
        />
        <StatsCard
          title="In Repair"
          value={stats?.in_repair_complaints || 0}
          subtitle="Field engineer active"
          icon={Wrench}
          color="purple"
        />
        <StatsCard
          title="Resolved"
          value={stats?.completed_complaints || 0}
          subtitle="Verified & closed"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* 5. INTERACTIVE MAHARASHTRA GIS MAP (CLICK TO REPORT) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400" />
                Maharashtra State Road Defect Map
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1">
                📍 Click anywhere on map to report
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Click on any road location to open the damage report form, or click on status pins to view details.
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            Open Full GIS Portal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ComplaintMap 
          complaints={recentComplaints} 
          height="h-[440px]" 
          showFilters={true}
          initialRoadDivision={activeDivision}
          onMapClick={handleMapClick}
          onViewDetails={handleOpenDetails}
        />
      </div>

      {/* 6. COMPLAINTS LIST TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-['Outfit']">
                My Reported Complaints
              </h2>
              {activeDivision !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  Filtered by {activeDivision}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Live status, assigned engineer, and tracking for your road defect submissions
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeDivision !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveDivision('ALL')}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700"
              >
                Clear Filter
              </button>
            )}
            <Link
              to="/citizen/complaints"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              View All ({recentComplaints.length}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <AlertTriangle className="h-10 w-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Complaints in this Division</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeDivision !== 'ALL' 
                ? `You haven't submitted any reports for ${activeDivision} roads yet.`
                : 'Help improve road safety in your area by reporting potholes, cracks, and surface damage directly on the map.'
              }
            </p>
            <button
              type="button"
              onClick={handleReportAtCurrentLocation}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              <MapPin className="h-3.5 w-3.5" /> Report Road Damage on Map
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Road Name & Location</th>
                  <th className="py-3 px-4">Road Division</th>
                  <th className="py-3 px-4">Damage Type & Priority</th>
                  <th className="py-3 px-4">Assigned Authority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredComplaints.slice(0, 8).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {c.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block max-w-xs truncate">{c.road_name}</span>
                      <span className="text-[11px] text-slate-400">📍 {c.district}, {c.state}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <RoadTypeBadge roadType={c.road_type} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 font-semibold block">
                        {c.primary_damage_type || c.damage_type || 'Road Defect'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                        c.priority === 'High' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {c.priority} Priority
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
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. MAP-CLICK DAMAGE REPORTING MODAL */}
      {/* ========================================================================= */}
      {mapReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white font-['Outfit']">
                    Report Road Damage at Selected Location
                  </h3>
                  <p className="text-xs text-slate-400">
                    Location selected on map • Authority assigned automatically
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapReportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reportError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{reportError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDamageReport} className="space-y-4">
              
              {/* 1. Selected Map Pin & Coordinates Display (Read-Only) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Map Pin</span>
                    <strong className="text-white">
                      {reportFormData.district}, Maharashtra ({reportFormData.latitude.toFixed(4)}, {reportFormData.longitude.toFixed(4)})
                    </strong>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Maharashtra GIS
                </span>
              </div>

              {/* 2. Automatically Determined Road Classification (READ-ONLY) */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 shadow-inner space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      Auto-Detected Road Classification
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    🔒 Read-Only (GIS Verified)
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <RoadTypeBadge roadType={reportFormData.road_type} size="md" />
                  <span className="text-xs font-semibold text-slate-300">
                    🏛️ {reportFormData.road_type_info?.authority_name || (
                      reportFormData.road_type === 'National Highway' ? 'National Highways Authority of India (NHAI)' :
                      reportFormData.road_type === 'State Highway' ? 'Maharashtra Public Works Department (PWD)' :
                      reportFormData.road_type === 'Rural/Village Road' ? 'Zilla Parishad & PMGSY Rural Roads' :
                      'Municipal Corporation (Local Urban Body)'
                    )}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {reportFormData.road_type_info?.reason || `Automatically determined as ${reportFormData.road_type} from map coordinates (${reportFormData.latitude.toFixed(4)}, ${reportFormData.longitude.toFixed(4)}) and territorial jurisdiction.`}
                  </span>
                </p>
              </div>

              {/* 3. Road Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Road / Street / Highway Name *
                </label>
                <input
                  type="text"
                  required
                  value={reportFormData.road_name}
                  onChange={(e) => setReportFormData({ ...reportFormData, road_name: e.target.value })}
                  placeholder="e.g. Western Express Highway, SV Road, Pune-Solapur Highway"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4. Landmark Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={reportFormData.landmark}
                  onChange={(e) => setReportFormData({ ...reportFormData, landmark: e.target.value })}
                  placeholder="e.g. Near Metro Station, Opp. City Mall, Flyover Junction"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 5. Device Camera Image Capture (Take Photo / Preview / Retake) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-amber-400" />
                    Capture Road Damage Photo (Camera Only)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Direct Device Camera
                  </span>
                </label>
                
                <CameraCapture
                  capturedImage={capturedImage}
                  hideDeviceCameraFallback={true}
                  onImageCapture={(file) => {
                    setCapturedImage(file);
                    setReportError('');
                  }}
                  onImageClear={() => {
                    setCapturedImage(null);
                    setImageValidationError('');
                    setReportError('');
                  }}
                  onValidationChange={(isValid, errorMsg) => {
                    setImageValidationError(isValid ? '' : (errorMsg || 'Invalid image'));
                    if (!isValid) setReportError(errorMsg);
                  }}
                />
              </div>

              {/* 6. Damage Defect Type and Severity / Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Damage Defect Type *
                  </label>
                  <select
                    value={reportFormData.damage_type}
                    onChange={(e) => setReportFormData({ ...reportFormData, damage_type: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {DAMAGE_TYPES.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assessed Severity / Priority *
                  </label>
                  <select
                    value={reportFormData.priority}
                    onChange={(e) => setReportFormData({ ...reportFormData, priority: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Critical">Critical (Hazardous to traffic)</option>
                    <option value="High">High (Major road defect)</option>
                    <option value="Medium">Medium (Moderate road damage)</option>
                    <option value="Low">Low (Minor surface defect)</option>
                  </select>
                </div>
              </div>

              {/* 7. Observations / Description Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Damage Description / Observations
                </label>
                <textarea
                  rows={2}
                  value={reportFormData.description}
                  onChange={(e) => setReportFormData({ ...reportFormData, description: e.target.value })}
                  placeholder="Describe the condition, depth, size, or hazard of the damage..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 8. Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingReport || Boolean(imageValidationError)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReport ? (
                    <>
                      <Loader text="" />
                      <span>Submitting Damage Report & Routing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Submit Road Damage Report</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. COMPREHENSIVE VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {detailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                    {selectedComplaint?.id}
                  </span>
                  {selectedComplaint && <StatusBadge status={selectedComplaint.status} />}
                  {selectedComplaint && <RoadTypeBadge roadType={selectedComplaint.road_type} />}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit']">
                  {selectedComplaint?.road_name || 'Complaint Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setDetailsModalOpen(false); setSelectedComplaint(null); }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center space-y-3">
                <Loader text="Loading complete database record..." />
              </div>
            ) : selectedComplaint ? (
              <div className="space-y-6">

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
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                      selectedComplaint.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
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
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" /> Open Dedicated Page
                  </Link>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                Complaint record could not be loaded.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default CitizenDashboard;
