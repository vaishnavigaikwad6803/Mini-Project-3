import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { complaintService } from '../../services/complaintService';
import MapPicker from '../../components/map/MapPicker';
import CameraCapture from '../../components/common/CameraCapture';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import { 
  MapPin, 
  FileText, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Compass, 
  Navigation, 
  Shield, 
  Check,
  Camera,
  Info
} from 'lucide-react';
import { 
  ROAD_DIVISIONS, 
  DEFAULT_MUMBAI_CENTER, 
  detectCurrentLocation, 
  reverseGeocodeCoords,
  getClosestMaharashtraDistrict 
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

const SubmitComplaint = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    road_name: '',
    road_type: 'Municipal/City Road',
    road_type_info: null,
    damage_type: 'Pothole',
    priority: 'Medium',
    description: '',
    latitude: DEFAULT_MUMBAI_CENTER[0],
    longitude: DEFAULT_MUMBAI_CENTER[1],
    village: null,
    taluka: null,
    district: user?.district || 'Mumbai Suburban',
    state: 'Maharashtra',
    displayName: `${user?.district || 'Mumbai Suburban'}, Maharashtra`,
    accuracy: null,
    accuracyLevel: 'good',
    accuracyMessage: '',
    landmark: '',
  });

  const [capturedImage, setCapturedImage] = useState(null);
  const [imageValidationError, setImageValidationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect GPS location on mount
  useEffect(() => {
    handleAutoDetectGPS();
  }, []);

  const handleAutoDetectGPS = async () => {
    setIsLocating(true);
    setLocationStatus('Acquiring high-accuracy device GPS coordinates...');
    const result = await detectCurrentLocation();
    
    const geoInfo = await reverseGeocodeCoords(result.latitude, result.longitude);
    const autoRoadType = geoInfo?.roadType || result.roadType || 'Municipal/City Road';

    setFormData((prev) => ({
      ...prev,
      latitude: result.latitude,
      longitude: result.longitude,
      village: result.village || geoInfo?.village || null,
      taluka: result.taluka || geoInfo?.taluka || null,
      district: geoInfo?.district || result.district,
      road_name: geoInfo?.roadName || result.road_name || `${result.district} Main Road`,
      road_type: autoRoadType,
      road_type_info: geoInfo?.roadTypeInfo || null,
      displayName: geoInfo?.displayName || result.displayName || `${result.district}, Maharashtra`,
      accuracy: result.accuracy,
      accuracyLevel: result.accuracyLevel,
      accuracyMessage: result.accuracyMessage,
      state: 'Maharashtra'
    }));
    setLocationStatus(result.message);
    setIsLocating(false);
  };

  const handleLocationSelect = async (lat, lng, districtName) => {
    const geoInfo = await reverseGeocodeCoords(lat, lng);
    const resolvedDistrict = geoInfo?.district || districtName || formData.district;
    const resolvedRoad = geoInfo?.roadName || `${resolvedDistrict} Road Damage`;
    const autoRoadType = geoInfo?.roadType || 'State Highway';

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      village: geoInfo?.village || null,
      taluka: geoInfo?.taluka || null,
      district: resolvedDistrict,
      road_name: resolvedRoad,
      road_type: autoRoadType,
      road_type_info: geoInfo?.roadTypeInfo || null,
      displayName: geoInfo?.displayName || `${resolvedDistrict}, Maharashtra`,
      state: 'Maharashtra'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.road_name || !formData.road_name.trim()) {
      setError('Please provide the road or street name.');
      return;
    }

    if (imageValidationError) {
      setError(imageValidationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('road_name', formData.road_name.trim());
      data.append('road_type', formData.road_type);
      data.append('damage_type', formData.damage_type);
      data.append('priority', formData.priority);
      data.append('description', formData.description || `${formData.damage_type} reported on ${formData.road_name}`);
      data.append('latitude', formData.latitude);
      data.append('longitude', formData.longitude);
      data.append('district', formData.district);
      data.append('state', 'Maharashtra');
      if (formData.landmark) {
        data.append('landmark', formData.landmark.trim());
      }
      if (capturedImage) {
        data.append('road_image', capturedImage, capturedImage.name || 'road_damage_camera.jpg');
      }

      const response = await complaintService.submitComplaint(data);
      showToast(`Complaint #${response.id} submitted & authority assigned successfully!`, 'success');
      navigate(`/complaints/${response.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit complaint. Please check your inputs and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
            <Shield className="h-3 w-3" /> Maharashtra Grievance Portal
          </span>
          <span className="text-xs text-slate-400">Map Location Reporting</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
          Report Road Damage
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Click the defect location on the map. The road type and responsible authority are determined automatically. Use your device camera to capture real-time photo evidence.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. MAP LOCATION SELECTION */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400" />
                1. Select Damage Location on Maharashtra Map *
              </h3>
              <p className="text-xs text-slate-400">
                Click anywhere on the map or use live GPS to pin the defect location
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoDetectGPS}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Locating...' : 'Use My GPS'}
            </button>
          </div>

          <MapPicker
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            onLocationSelect={handleLocationSelect}
          />

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-300">
                Selected Location: <strong className="text-white">{formData.displayName || `${formData.district}, Maharashtra`}</strong>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Within Maharashtra State
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <span>
                Coordinates: <strong className="text-amber-400">{formData.latitude.toFixed(6)}° N, {formData.longitude.toFixed(6)}° E</strong>
              </span>
              {formData.accuracy !== null && (
                <span className="text-slate-400">
                  GPS Accuracy: <strong className="text-emerald-400">±{formData.accuracy}m</strong>
                </span>
              )}
            </div>
            {formData.accuracyLevel === 'poor' && (
              <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium pt-1">
                <span>⚠️ Your location accuracy is low. Please wait for a better GPS signal or try again.</span>
              </p>
            )}
          </div>
        </div>

        {/* 2. AUTOMATICALLY DETERMINED ROAD CLASSIFICATION (READ-ONLY) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              2. Road Classification (Automatically Determined)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              🔒 Read-Only (GIS Verified)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <RoadTypeBadge roadType={formData.road_type} size="md" />
              <span className="text-xs font-semibold text-slate-300">
                🏛️ {formData.road_type_info?.authority_name || (
                  formData.road_type === 'National Highway' ? 'National Highways Authority of India (NHAI)' :
                  formData.road_type === 'State Highway' ? 'Maharashtra Public Works Department (PWD)' :
                  formData.road_type === 'Rural/Village Road' ? 'Zilla Parishad & PMGSY Rural Roads' :
                  'Municipal Corporation (Local Urban Body)'
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {formData.road_type_info?.reason || `Automatically determined as ${formData.road_type} based on the selected map coordinates (${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}).`}
              </span>
            </p>
          </div>
        </div>

        {/* 3. DEVICE CAMERA IMAGE CAPTURE (NO FILE UPLOAD) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Camera className="h-4 w-4 text-amber-400" />
              3. Take Photo of Road Damage (Camera Capture Only)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Device Camera Only
            </span>
          </div>

          <CameraCapture
            capturedImage={capturedImage}
            hideDeviceCameraFallback={true}
            onImageCapture={(file) => {
              setCapturedImage(file);
              setError('');
            }}
            onImageClear={() => {
              setCapturedImage(null);
              setImageValidationError('');
              setError('');
            }}
            onValidationChange={(isValid, errorMsg) => {
              setImageValidationError(isValid ? '' : (errorMsg || 'Invalid image'));
              if (!isValid) setError(errorMsg);
            }}
          />
        </div>

        {/* 4. ROAD METADATA & DEFECT DETAILS */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            4. Road & Defect Details
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
                placeholder="e.g. Western Express Highway, SV Road, Pune-Solapur Highway"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nearby Landmark (Optional)
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                placeholder="e.g. Near Metro Station, Opp. City Mall, Flyover Junction"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Damage Defect Type *
              </label>
              <select
                value={formData.damage_type}
                onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
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
                Priority / Severity Level *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Critical">Critical (Hazardous to vehicles)</option>
                <option value="High">High (Severe road defect)</option>
                <option value="Medium">Medium (Moderate road damage)</option>
                <option value="Low">Low (Minor surface defect)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Damage Description / Notes
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the potholes, cracks, or road distress to assist the engineering inspection..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || Boolean(imageValidationError)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Submitting Damage Report & Routing to Authority...</span>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Submit Road Damage Report</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};

export default SubmitComplaint;
