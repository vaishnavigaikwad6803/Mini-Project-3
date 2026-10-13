import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { complaintService } from '../../services/complaintService';
import MapPicker from '../../components/map/MapPicker';
import AIResultCard from '../../components/ai/AIResultCard';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import {
  MapPin,
  FileText,
  Layers,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Shield,
  Check,
  Camera,
  Info,
  Lock,
  Unlock,
  ShieldCheck,
  UploadCloud,
  X,
  Copy,
  ExternalLink,
  Eye,
  RefreshCw,
  Trash2,
  Building2,
  Cpu,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import {
  ROAD_DIVISIONS,
  DEFAULT_MUMBAI_CENTER,
  MAHARASHTRA_DISTRICTS,
  detectCurrentLocation,
  reverseGeocodeCoords,
  getClosestMaharashtraDistrict,
  isWithinMaharashtra
} from '../../utils/geoUtils';

const ROAD_TYPE_OPTIONS = [
  { value: 'Municipal/City Road', label: 'Municipal / City Road (Urban Local Body)', authority: 'Municipal Corporation (BMC, PMC, etc.)' },
  { value: 'National Highway', label: 'National Highway (NHAI / Expressways)', authority: 'National Highways Authority of India (NHAI)' },
  { value: 'State Highway', label: 'State Highway (PWD / Major District Roads)', authority: 'Maharashtra Public Works Department (PWD)' },
  { value: 'Rural/Village Road', label: 'Rural / Village Road (PMGSY / Zilla Parishad)', authority: 'Zilla Parishad & PMGSY Rural Roads' }
];

const DAMAGE_TYPES = [
  'Pothole',
  'Alligator Cracking',
  'Longitudinal Surface Crack',
  'Transverse Thermal Crack',
  'Severe Cavity & Edge Break',
  'Surface Erosion & Rutting',
  'Manhole / Pavement Depression'
];

const SubmitComplaint = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    road_name: '',
    road_type: 'Municipal/City Road',
    road_type_info: null,
    damage_type: 'Pothole',
    priority: 'Medium',
    description: '',
    latitude: DEFAULT_MUMBAI_CENTER[0],
    longitude: DEFAULT_MUMBAI_CENTER[1],
    district: user?.district || 'Mumbai Suburban',
    state: 'Maharashtra',
    displayName: `${user?.district || 'Mumbai Suburban'}, Maharashtra`,
    accuracy: null,
    accuracyLevel: 'good',
    accuracyMessage: '',
    landmark: '',
  });

  // Location Mode: 'gps' | 'manual'
  const [locationMode, setLocationMode] = useState('gps');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageValidationError, setImageValidationError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Submission & API Result State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const submittingRef = useRef(false);

  // Auto-detect GPS location on mount
  useEffect(() => {
    handleAutoDetectGPS();
  }, []);

  // Cleanup image preview object URL
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleAutoDetectGPS = async () => {
    setIsLocating(true);
    setGpsError('');
    setLocationStatus('Acquiring high-accuracy device GPS coordinates...');
    
    try {
      const result = await detectCurrentLocation();

      if (!result.success) {
        setGpsSuccess(false);
        setGpsError(result.accuracyMessage || 'Location permission was denied or signal is unavailable. You can use manual map selection below.');
        setLocationStatus(result.message || 'GPS acquisition failed.');
        setIsLocating(false);
        return;
      }

      setGpsSuccess(true);
      setGpsError('');

      const geoInfo = await reverseGeocodeCoords(result.latitude, result.longitude);
      const autoRoadType = geoInfo?.roadType || result.roadType || 'Municipal/City Road';

      setFormData((prev) => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
        district: geoInfo?.district || result.district || prev.district,
        road_name: geoInfo?.roadName || result.road_name || prev.road_name || `${result.district} Main Road`,
        road_type: autoRoadType,
        road_type_info: geoInfo?.roadTypeInfo || null,
        displayName: geoInfo?.displayName || result.displayName || `${result.district}, Maharashtra`,
        accuracy: result.accuracy,
        accuracyLevel: result.accuracyLevel,
        accuracyMessage: result.accuracyMessage,
        state: 'Maharashtra'
      }));
      setLocationStatus(result.message);
    } catch (err) {
      console.error('GPS detection error:', err);
      setGpsSuccess(false);
      setGpsError('Unable to access device location. Please switch to manual map placement.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleManualMapSelect = async (lat, lng, dist) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));

    const geoInfo = await reverseGeocodeCoords(roundedLat, roundedLng);
    const closestDist = dist || geoInfo?.district || getClosestMaharashtraDistrict(roundedLat, roundedLng).name;
    const autoRoadType = geoInfo?.roadType || 'Municipal/City Road';

    setFormData((prev) => ({
      ...prev,
      latitude: roundedLat,
      longitude: roundedLng,
      district: closestDist,
      road_name: geoInfo?.roadName || prev.road_name || `${closestDist} Road`,
      road_type: autoRoadType,
      road_type_info: geoInfo?.roadTypeInfo || null,
      displayName: geoInfo?.displayName || `${closestDist}, Maharashtra`,
      accuracy: null,
      accuracyLevel: 'manual',
      state: 'Maharashtra'
    }));
  };

  const handleDistrictChange = (newDistrict) => {
    const districtObj = MAHARASHTRA_DISTRICTS.find((d) => d.name === newDistrict);
    if (districtObj) {
      setFormData((prev) => ({
        ...prev,
        district: districtObj.name,
        latitude: districtObj.lat,
        longitude: districtObj.lng,
        displayName: `${districtObj.name}, Maharashtra`,
        accuracy: null,
        accuracyLevel: 'manual'
      }));
    } else {
      setFormData((prev) => ({ ...prev, district: newDistrict }));
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    // Allowed image formats
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const hasValidMime = allowedTypes.includes(file.type.toLowerCase());
    const hasValidExt = Boolean(file.name.match(/\.(jpe?g|png|webp)$/i));

    if (!hasValidMime && !hasValidExt) {
      setImageValidationError('Please upload a valid image file (JPEG, PNG, or WebP).');
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    // Maximum file size: 12MB
    const maxSizeBytes = 12 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setImageValidationError(`File size (${sizeMb} MB) exceeds the 12 MB limit. Please select a smaller photo.`);
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    setImageValidationError('');
    setError('');
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleCopyComplaintId = () => {
    if (submittedComplaint?.id) {
      navigator.clipboard.writeText(submittedComplaint.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleResetForm = () => {
    setSubmittedComplaint(null);
    setSelectedImage(null);
    setImagePreview(null);
    setImageValidationError('');
    setError('');
    setFormData((prev) => ({
      ...prev,
      road_name: '',
      description: '',
      landmark: '',
      damage_type: 'Pothole',
      priority: 'Medium'
    }));
    handleAutoDetectGPS();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard against duplicate concurrent submissions
    if (submittingRef.current || loading) return;

    // Field Validations
    if (!formData.road_name || !formData.road_name.trim()) {
      setError('Please provide the road or street name.');
      return;
    }

    if (!formData.district || !formData.district.trim()) {
      setError('Please specify the district.');
      return;
    }

    if (formData.latitude == null || formData.longitude == null) {
      setError('Coordinates are required. Please allow GPS or select a point on the map.');
      return;
    }

    if (!selectedImage) {
      setError('Please provide a photo of the road damage to run AI defect detection.');
      return;
    }

    if (imageValidationError) {
      setError(imageValidationError);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('road_name', formData.road_name.trim());
      data.append('road_type', formData.road_type);
      data.append('damage_type', formData.damage_type);
      data.append('priority', formData.priority);
      data.append('description', formData.description ? formData.description.trim() : `${formData.damage_type} reported on ${formData.road_name}`);
      data.append('latitude', formData.latitude);
      data.append('longitude', formData.longitude);
      data.append('district', formData.district);
      data.append('state', formData.state || 'Maharashtra');
      if (formData.landmark && formData.landmark.trim()) {
        data.append('landmark', formData.landmark.trim());
      }
      data.append('road_image', selectedImage, selectedImage.name || 'road_damage.jpg');

      const response = await complaintService.submitComplaint(data);
      showToast(`Complaint #${response.id} submitted & analyzed successfully!`, 'success');
      setSubmittedComplaint(response);
    } catch (err) {
      console.error('Complaint submission error:', err);
      const detail = err.response?.data?.detail;
      setError(detail || 'Failed to submit road damage report. Please check your network connection and inputs.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // -------------------------------------------------------------
  // POST-SUBMISSION SUCCESS & AI DETECTION RESULTS VIEW
  // -------------------------------------------------------------
  if (submittedComplaint) {
    const aiResult = submittedComplaint.ai_result;
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">

        {/* Top Success Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Report Submitted & AI Analyzed
            </span>
            <span className="text-xs text-slate-400">
              {new Date(submittedComplaint.created_at).toLocaleString()}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Complaint Successfully Lodged
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Your report has been processed by our neural damage detection engine, validated against spatial road rules, and routed to the responsible maintenance authority.
            </p>
          </div>

          {/* Complaint Tracking ID Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Official Complaint ID</span>
              <span className="text-lg sm:text-xl font-mono font-extrabold text-amber-400">
                {submittedComplaint.id}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyComplaintId}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors active:scale-95"
            >
              {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-amber-400" />}
              <span>{copiedId ? 'Copied to Clipboard!' : 'Copy ID'}</span>
            </button>
          </div>
        </div>

        {/* Assigned Authority & Routing Information */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-['Outfit']">
              Jurisdictional Authority Assignment
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[11px] uppercase font-bold">Assigned Authority</span>
              <strong className="text-white text-sm mt-0.5 block">
                {submittedComplaint.authority_name || 'Assigned Road Department'}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[11px] uppercase font-bold">Road Classification</span>
              <div className="mt-1">
                <RoadTypeBadge roadType={submittedComplaint.road_type} size="sm" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[11px] uppercase font-bold">Location Jurisdiction</span>
              <strong className="text-slate-200 mt-0.5 block truncate">
                📍 {submittedComplaint.district}, {submittedComplaint.state}
              </strong>
            </div>
          </div>

          {submittedComplaint.routing_notes && (
            <p className="text-xs text-slate-400 border-t border-slate-800 pt-2.5">
              <strong className="text-amber-400 font-semibold">Routing Reason:</strong> {submittedComplaint.routing_notes}
            </p>
          )}
        </div>

        {/* AI Damage Detection Results Card */}
        {aiResult ? (
          <AIResultCard
            aiResult={aiResult}
            originalImageUrl={submittedComplaint.image_url}
          />
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl text-center space-y-2">
            <Cpu className="h-8 w-8 text-cyan-400 mx-auto" />
            <h4 className="text-sm font-bold text-white font-['Outfit']">Damage Report Logged</h4>
            <p className="text-xs text-slate-400">
              Primary damage classified as <strong className="text-amber-400">{submittedComplaint.primary_damage_type}</strong>.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
          >
            Report Another Defect
          </button>

          <div className="flex items-center gap-3">
            <Link
              to={`/track?id=${encodeURIComponent(submittedComplaint.id)}`}
              className="btn-secondary text-xs px-4 py-2.5 inline-flex items-center gap-1.5"
            >
              <span>Track Status</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              to={`/complaints/${submittedComplaint.id}`}
              className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View Full Details</span>
            </Link>
          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // PRIMARY REPORT DAMAGE FORM VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
            <Shield className="h-3 w-3" /> Citizen Road Reporting
          </span>
          <span className="text-xs text-slate-400">AI-Powered Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
          Report Road Damage
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload an image of potholes or cracks with accurate GPS coordinates. Our YOLOv8 neural model evaluates defect severity and dispatches the complaint to the competent road maintenance authority.
        </p>
      </div>

      {/* Form Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Submission Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. ROAD DAMAGE IMAGE UPLOAD SECTION */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Camera className="h-4 w-4 text-amber-400" />
                1. Road Defect Photo (Required for AI Detection) *
              </h3>
              <p className="text-xs text-slate-400">
                Upload or capture a clear photo of the pothole or cracked pavement surface.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              JPEG, PNG, WebP (Max 12MB)
            </span>
          </div>

          {/* Validation Warning */}
          {imageValidationError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{imageValidationError}</span>
            </div>
          )}

          {/* Hidden File and Camera Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndSetFile(e.target.files[0]);
              }
            }}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndSetFile(e.target.files[0]);
              }
            }}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Upload Dropzone or Image Preview */}
          {!imagePreview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all text-center space-y-4 ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-700/80 bg-slate-950/60 hover:border-slate-600'
              }`}
            >
              <div className="h-14 w-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400 mx-auto shadow-md">
                <UploadCloud className="h-7 w-7" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Drag and drop road photo here, or browse files
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported: JPG, JPEG, PNG, WebP up to 12 MB
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors active:scale-95"
                >
                  Choose File
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Capture Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="relative rounded-xl overflow-hidden max-h-72 bg-slate-900 border border-slate-800 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Road Defect Preview"
                  className="w-full h-auto max-h-72 object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/90 text-rose-400 hover:text-rose-300 border border-slate-700 shadow-lg hover:bg-slate-800 transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-white truncate max-w-xs">{selectedImage?.name}</span>
                  <span className="text-slate-500">
                    ({selectedImage?.size ? `${(selectedImage.size / 1024).toFixed(0)} KB` : 'Ready'})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-400 hover:text-amber-300 text-xs font-semibold"
                  >
                    Change Photo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. DEFECT LOCATION & GPS SECTION (WITH MANUAL FALLBACK) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400" />
                2. Defect Geolocation (GPS & Map Coordinates) *
              </h3>
              <p className="text-xs text-slate-400">
                Use your device GPS or click anywhere on the map to manually set defect coordinates.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setLocationMode('gps');
                  handleAutoDetectGPS();
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  locationMode === 'gps'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="h-3 w-3" />
                <span>Live GPS</span>
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('manual')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  locationMode === 'manual'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Unlock className="h-3 w-3" />
                <span>Manual Map</span>
              </button>
            </div>
          </div>

          {/* GPS Error Alert */}
          {gpsError && locationMode === 'gps' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">GPS Signal / Permission Notice</p>
                <p className="text-slate-300">{gpsError}</p>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAutoDetectGPS}
                    className="text-xs font-bold text-amber-400 underline hover:text-amber-300"
                  >
                    Retry GPS Acquisition
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setLocationMode('manual')}
                    className="text-xs font-bold text-cyan-400 underline hover:text-cyan-300"
                  >
                    Switch to Manual Map Placement
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Leaflet Map Picker */}
          <MapPicker
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            readOnly={locationMode === 'gps'}
            isLocating={isLocating}
            onLocationSelect={handleManualMapSelect}
            onRefreshGps={handleAutoDetectGPS}
            accuracy={locationMode === 'gps' ? formData.accuracy : null}
            accuracyLevel={locationMode === 'gps' ? formData.accuracyLevel : 'good'}
            locationStatus={locationStatus}
            districtName={formData.district}
          />

          {/* Coordinates & District Indicator */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-300">
                Location: <strong className="text-white">{formData.displayName || `${formData.district}, Maharashtra`}</strong>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                locationMode === 'gps' && gpsSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {locationMode === 'gps' && gpsSuccess ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span>Live GPS Verified</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-3 w-3 text-amber-400" />
                    <span>Map Selected Coordinates</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
              <span>
                Coordinates: <strong className="text-amber-400">{formData.latitude?.toFixed(6)}° N, {formData.longitude?.toFixed(6)}° E</strong>
              </span>
              {locationMode === 'gps' && formData.accuracy !== null ? (
                <span>
                  GPS Precision: <strong className={formData.accuracyLevel === 'poor' ? 'text-rose-400' : 'text-emerald-400'}>±{formData.accuracy}m</strong>
                </span>
              ) : (
                <span className="text-slate-400">
                  Mode: <strong className="text-cyan-400">Interactive Map Pin</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. ROAD METADATA, DISTRICT & DEFECT SPECIFICATIONS */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            3. Road Classification & Defect Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Road / Street / Highway Name *
              </label>
              <input
                type="text"
                required
                value={formData.road_name}
                onChange={(e) => setFormData({ ...formData, road_name: e.target.value })}
                placeholder="e.g. Western Express Highway, SV Road, Pune Bypass"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jurisdiction District (Maharashtra) *
              </label>
              <select
                value={formData.district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="input-field cursor-pointer"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.division} Division)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Road Type / Jurisdiction Classification *
              </label>
              <select
                value={formData.road_type}
                onChange={(e) => setFormData({ ...formData, road_type: e.target.value })}
                className="input-field cursor-pointer"
              >
                {ROAD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Routes to: <span className="text-amber-400 font-medium">{ROAD_TYPE_OPTIONS.find(o => o.value === formData.road_type)?.authority}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nearby Landmark / Intersection (Optional)
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                placeholder="e.g. Near Metro Pillar #42, Opp. Flyover Exit"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Observed Defect Type *
              </label>
              <select
                value={formData.damage_type}
                onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
                className="input-field cursor-pointer"
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
                Estimated Priority Level *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="Critical">Critical (Immediate hazard to traffic/life)</option>
                <option value="High">High (Deep pothole / structural failure)</option>
                <option value="Medium">Medium (Moderate surface crack/rutting)</option>
                <option value="Low">Low (Minor wear / preventive maintenance)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Defect Description & Context Notes
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide additional details regarding pothole depth, waterlogging, or surrounding traffic hazards..."
              className="input-field"
            />
          </div>
        </div>

        {/* 4. SUBMISSION ACTION BAR */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || Boolean(imageValidationError) || !selectedImage || !formData.road_name.trim()}
            className="w-full py-4 rounded-2xl btn-primary text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2 font-bold">
                <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Analyzing Road Defect with YOLOv8 & Routing to Authority...
              </span>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Submit Road Damage Report & Run AI Detection</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};

export default SubmitComplaint;
