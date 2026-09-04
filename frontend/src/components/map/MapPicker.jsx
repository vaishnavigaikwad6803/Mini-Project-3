import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Shield, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  INDIA_CENTER,
  INDIA_DEFAULT_ZOOM,
  INDIA_BOUNDS,
  MAHARASHTRA_BOUNDS, 
  MAHARASHTRA_CENTER,
  MAHARASHTRA_DEFAULT_ZOOM,
  DEFAULT_MUMBAI_CENTER,
  MAHARASHTRA_DISTRICTS,
  MAHARASHTRA_BORDER_POLYGON,
  isWithinMaharashtra,
  getClosestMaharashtraDistrict,
  detectCurrentLocation
} from '../../utils/geoUtils';

// Custom Leaflet marker pin icon fix
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle marker and accuracy radius
const LocationMarker = ({ position, readOnly, accuracy, accuracyLevel, setPosition, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      if (readOnly) {
        // Location cannot be manually chosen
        return;
      }
      const { lat, lng } = e.latlng;
      const newPos = [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))];
      const districtInfo = getClosestMaharashtraDistrict(newPos[0], newPos[1]);

      if (setPosition) setPosition(newPos);
      if (onLocationSelect) {
        onLocationSelect(newPos[0], newPos[1], districtInfo.name);
      }
    },
  });

  if (!position || position[0] == null || position[1] == null) return null;

  const circleColor = accuracyLevel === 'poor' ? '#f43f5e' : (accuracyLevel === 'fair' ? '#f59e0b' : '#10b981');

  return (
    <>
      <Marker position={position} icon={customMarkerIcon} />
      {accuracy && accuracy > 0 && (
        <Circle
          center={position}
          radius={Math.min(accuracy, 300)}
          pathOptions={{
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '3, 4'
          }}
        />
      )}
    </>
  );
};

// Component to smoothly fly/pan map view
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

const MapPicker = ({ 
  initialLat = DEFAULT_MUMBAI_CENTER[0], 
  initialLng = DEFAULT_MUMBAI_CENTER[1], 
  onLocationSelect,
  autoDetect = false,
  readOnly = true,
  isLocating = false,
  onRefreshGps = null,
  accuracy = null,
  accuracyLevel = 'good',
  locationStatus = '',
  districtName = ''
}) => {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [internalLocating, setInternalLocating] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(districtName || '');
  const [statusMessage, setStatusMessage] = useState(locationStatus || '');

  const locating = isLocating || internalLocating;

  // Sync position state if parent coordinates change
  useEffect(() => {
    if (initialLat != null && initialLng != null) {
      setPosition([initialLat, initialLng]);
      const dist = districtName || getClosestMaharashtraDistrict(initialLat, initialLng).name;
      setSelectedDistrict(dist);
    }
  }, [initialLat, initialLng, districtName]);

  // Sync status message if parent passes it
  useEffect(() => {
    if (locationStatus) {
      setStatusMessage(locationStatus);
    }
  }, [locationStatus]);

  // Auto-detect GPS location on mount if autoDetect is enabled
  useEffect(() => {
    if (autoDetect) {
      handleAutoLocate();
    } else if (!districtName) {
      const dist = getClosestMaharashtraDistrict(initialLat, initialLng);
      setSelectedDistrict(dist.name);
    }
  }, []);

  const handleAutoLocate = async () => {
    if (onRefreshGps) {
      onRefreshGps();
      return;
    }
    setInternalLocating(true);
    setStatusMessage('Acquiring high-accuracy device GPS...');
    const result = await detectCurrentLocation();
    
    const newPos = [result.latitude, result.longitude];
    setPosition(newPos);
    setZoomLevel(15);
    setSelectedDistrict(result.district);
    setStatusMessage(result.message);
    setInternalLocating(false);

    if (onLocationSelect) {
      onLocationSelect(result.latitude, result.longitude, result.district);
    }
  };

  const handleDistrictChange = (dName) => {
    if (readOnly) return; // Disabled in readOnly mode
    const found = MAHARASHTRA_DISTRICTS.find((d) => d.name === dName);
    if (found) {
      const newPos = [found.lat, found.lng];
      setPosition(newPos);
      setZoomLevel(13);
      setSelectedDistrict(found.name);
      setStatusMessage(`Selected ${found.name} District (${found.division} Division)`);
      if (onLocationSelect) {
        onLocationSelect(found.lat, found.lng, found.name);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Maharashtra State Banner & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 text-[10px] flex items-center gap-1">
            <Shield className="h-3 w-3" /> Maharashtra GIS
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Coordinates: <strong className="text-amber-400 font-mono">{typeof position[0] === 'number' ? position[0].toFixed(6) : position[0]}° N, {typeof position[1] === 'number' ? position[1].toFixed(6) : position[1]}° E</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {readOnly ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-slate-800/90 text-amber-300 font-medium text-[11px] border border-slate-700 flex items-center gap-1.5 shadow-sm">
                <Lock className="h-3 w-3 text-amber-400" />
                <span>GPS Auto-Locked</span>
              </span>

              {(onRefreshGps || autoDetect) && (
                <button
                  type="button"
                  onClick={onRefreshGps || handleAutoLocate}
                  disabled={locating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  title="Re-query device GPS coordinates"
                >
                  <Navigation className={`h-3.5 w-3.5 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Acquiring...' : 'Refresh GPS'}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Manual District Selector (only visible if not readOnly) */}
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="" disabled>Jump to District</option>
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    📍 {d.name} ({d.division})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAutoLocate}
                disabled={locating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Navigation className={`h-3.5 w-3.5 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Locating...' : 'Auto-Detect GPS'}
              </button>
            </>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300/90 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Navigation className="h-3 w-3 text-amber-400 shrink-0" />
            {statusMessage}
          </span>
          {selectedDistrict && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              District: <strong>{selectedDistrict}</strong>
            </span>
          )}
        </div>
      )}

      {/* Interactive Map Container - Locked to Maharashtra Bounds */}
      <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-700 shadow-inner relative z-10">
        <MapContainer
          center={position}
          zoom={zoomLevel}
          minZoom={6.5}
          maxZoom={18}
          maxBounds={MAHARASHTRA_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <ChangeView center={position} zoom={zoomLevel} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Maharashtra Road Network'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polygon
            positions={MAHARASHTRA_BORDER_POLYGON}
            pathOptions={{
              color: '#f59e0b',
              weight: 2,
              opacity: 0.8,
              fillColor: '#f59e0b',
              fillOpacity: 0.06,
              dashArray: '4, 4'
            }}
          />
          <LocationMarker 
            position={position} 
            readOnly={readOnly}
            accuracy={accuracy}
            accuracyLevel={accuracyLevel}
            setPosition={setPosition} 
            onLocationSelect={onLocationSelect} 
          />
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        {readOnly ? (
          <p className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Defect location is strictly auto-detected via device GPS. Manual location selection is disabled.</span>
          </p>
        ) : (
          <p className="flex items-center gap-1">
            <Compass className="h-3 w-3 text-amber-500" />
            <span>Click or tap anywhere on Maharashtra's road network to pin exact coordinates.</span>
          </p>
        )}
        <span className="text-slate-500 text-[10px]">
          Boundaries locked to Maharashtra State (15.6°N - 22.1°N, 72.6°E - 80.9°E)
        </span>
      </div>
    </div>
  );
};

export default MapPicker;

