import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import StatusBadge from '../common/StatusBadge';
import RoadTypeBadge from '../common/RoadTypeBadge';
import {
  Filter,
  Layers,
  Eye,
  MapPin,
  AlertTriangle,
  Shield,
  Compass,
  Navigation,
  HardHat,
  Phone,
  Mail,
  Wrench,
  Globe2
} from 'lucide-react';
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
  ROAD_DIVISIONS,
  isWithinMaharashtra
} from '../../utils/geoUtils';

// Helper to determine status color and category
export const getStatusMarkerInfo = (status) => {
  switch (status) {
    case 'Repair Completed':
    case 'Closed':
      return {
        color: '#10b981', // Green
        label: 'Resolved',
        glow: 'rgba(16, 185, 129, 0.7)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        tag: '✓'
      };
    case 'Engineer Assigned':
    case 'Inspection Completed':
    case 'Repair Started':
    case 'Repair In Progress':
    case 'Authority Verification':
      return {
        color: '#f97316', // Orange
        label: 'Under Construction/Repair',
        glow: 'rgba(249, 115, 22, 0.7)',
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        tag: '⚙'
      };
    case 'Submitted':
    case 'AI Analyzed':
    case 'Authority Assigned':
    case 'Under Review':
    case 'Inspection Pending':
    default:
      return {
        color: '#ef4444', // Red
        label: 'Damage Reported',
        glow: 'rgba(239, 68, 68, 0.7)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        tag: '!'
      };
  }
};

// Create damage status colored marker icons
const createStatusMarkerIcon = (status, divisionTag = '') => {
  const statusInfo = getStatusMarkerInfo(status);
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${statusInfo.color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 14px ${statusInfo.glow};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 10px;
        font-family: monospace;
        cursor: pointer;
      ">
        ${divisionTag || statusInfo.tag}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
};

// Component to handle smooth camera moves
const MapFlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Component to handle map clicks for reporting
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        const { lat, lng } = e.latlng;
        onMapClick(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
      }
    }
  });
  return null;
};

// Map controller enforcing India overview vs. Maharashtra-only zoom/pan bounds
const MapBoundsController = ({ isZoomedIn, setIsZoomedIn }) => {
  const map = useMap();

  useMapEvents({
    zoomend() {
      const zoom = map.getZoom();
      if (zoom >= 6.0) {
        map.setMaxBounds(MAHARASHTRA_BOUNDS);
        setIsZoomedIn(true);
      } else {
        map.setMaxBounds(INDIA_BOUNDS);
        setIsZoomedIn(false);
      }
    },
    dragend() {
      const zoom = map.getZoom();
      if (zoom >= 6.0) {
        const center = map.getCenter();
        if (!isWithinMaharashtra(center.lat, center.lng)) {
          map.panTo(MAHARASHTRA_CENTER);
        }
      }
    }
  });

  return null;
};

const ComplaintMap = ({
  complaints = [],
  height = 'h-[520px]',
  showFilters = true,
  initialRoadDivision = 'ALL',
  startWithIndia = true,
  onMapClick = null,
  onViewDetails = null
}) => {
  const [selectedRoadDivision, setSelectedRoadDivision] = useState(initialRoadDivision);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDamage, setSelectedDamage] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Map View State
  const [mapCenter, setMapCenter] = useState(startWithIndia ? INDIA_CENTER : MAHARASHTRA_CENTER);
  const [mapZoom, setMapZoom] = useState(startWithIndia ? INDIA_DEFAULT_ZOOM : MAHARASHTRA_DEFAULT_ZOOM);
  const [isZoomedIn, setIsZoomedIn] = useState(!startWithIndia);

  // Switch to Full India View
  const handleFullIndiaView = () => {
    setSelectedDistrict('');
    setMapCenter(INDIA_CENTER);
    setMapZoom(INDIA_DEFAULT_ZOOM);
    setIsZoomedIn(false);
  };

  // Switch to Maharashtra Focus View
  const handleMaharashtraZoom = () => {
    setSelectedDistrict('');
    setMapCenter(MAHARASHTRA_CENTER);
    setMapZoom(MAHARASHTRA_DEFAULT_ZOOM);
    setIsZoomedIn(true);
  };

  // Handle Quick District Jump (Zooms directly into Maharashtra District)
  const handleDistrictJump = (districtName) => {
    setSelectedDistrict(districtName);
    if (!districtName || districtName === 'ALL') {
      handleMaharashtraZoom();
      return;
    }
    const found = MAHARASHTRA_DISTRICTS.find((d) => d.name === districtName);
    if (found) {
      setMapCenter([found.lat, found.lng]);
      setMapZoom(12);
      setIsZoomedIn(true);
    }
  };

  // Filter complaints based on Road Division (NH, State, Rural, Munci), Status, Damage, and District
  const filteredComplaints = complaints.filter((c) => {
    if (selectedRoadDivision !== 'ALL') {
      if (selectedRoadDivision === 'NH' && c.road_type !== 'National Highway') return false;
      if (selectedRoadDivision === 'STATE' && c.road_type !== 'State Highway') return false;
      if (selectedRoadDivision === 'RURAL' && c.road_type !== 'Rural/Village Road') return false;
      if (selectedRoadDivision === 'MUNCI' && c.road_type !== 'Municipal/City Road') return false;
    }
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'Reported' && !['Submitted', 'AI Analyzed', 'Authority Assigned', 'Under Review', 'Inspection Pending'].includes(c.status)) return false;
      if (selectedStatus === 'In Repair' && !['Engineer Assigned', 'Inspection Completed', 'Repair Started', 'Repair In Progress', 'Authority Verification'].includes(c.status)) return false;
      if (selectedStatus === 'Resolved' && !['Repair Completed', 'Closed'].includes(c.status)) return false;
      if (!['Reported', 'In Repair', 'Resolved'].includes(selectedStatus) && c.status !== selectedStatus) return false;
    }
    if (selectedDamage !== 'ALL' && c.damage_type !== selectedDamage) return false;
    if (selectedDistrict && selectedDistrict !== 'ALL') {
      if (!c.district?.toLowerCase().includes(selectedDistrict.toLowerCase())) return false;
    }
    return true;
  });

  // Calculate division counts
  const counts = {
    all: complaints.length,
    nh: complaints.filter(c => c.road_type === 'National Highway').length,
    state: complaints.filter(c => c.road_type === 'State Highway').length,
    rural: complaints.filter(c => c.road_type === 'Rural/Village Road').length,
    munci: complaints.filter(c => c.road_type === 'Municipal/City Road').length,
    reported: complaints.filter(c => ['Submitted', 'AI Analyzed', 'Authority Assigned', 'Under Review', 'Inspection Pending'].includes(c.status)).length,
    inRepair: complaints.filter(c => ['Engineer Assigned', 'Inspection Completed', 'Repair Started', 'Repair In Progress', 'Authority Verification'].includes(c.status)).length,
    resolved: complaints.filter(c => ['Repair Completed', 'Closed'].includes(c.status)).length,
  };

  return (
    <div className="space-y-4">
      {/* 1. Road Division & View Toolbar */}
      {showFilters && (
        <div className="space-y-3">
          {/* Division Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRoadDivision('ALL')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedRoadDivision === 'ALL'
                  ? 'bg-slate-100 text-slate-950 border-white shadow-lg'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🗺️</span>
                <span>All Maharashtra</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'ALL' ? 'bg-slate-300 text-slate-900 font-extrabold' : 'bg-slate-800 text-slate-400'}`}>
                {counts.all} Defects
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoadDivision('NH')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedRoadDivision === 'NH'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900/90 text-amber-300 border-slate-800 hover:bg-amber-950/30'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🛣️</span>
                <span>NH (National)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'NH' ? 'bg-amber-400/40 text-slate-950 font-extrabold' : 'bg-amber-500/20 text-amber-400'}`}>
                {counts.nh} NHAI
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoadDivision('STATE')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedRoadDivision === 'STATE'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-900/90 text-indigo-300 border-slate-800 hover:bg-indigo-950/30'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🛣️</span>
                <span>State (PWD)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'STATE' ? 'bg-indigo-400/40 text-white font-extrabold' : 'bg-indigo-500/20 text-indigo-300'}`}>
                {counts.state} PWD
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoadDivision('RURAL')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedRoadDivision === 'RURAL'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/90 text-emerald-300 border-slate-800 hover:bg-emerald-950/30'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🌾</span>
                <span>Rural (PMGSY)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'RURAL' ? 'bg-emerald-400/40 text-slate-950 font-extrabold' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {counts.rural} ZP/Rural
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoadDivision('MUNCI')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedRoadDivision === 'MUNCI'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900/90 text-cyan-300 border-slate-800 hover:bg-cyan-950/30'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🏙️</span>
                <span>Munci (City)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'MUNCI' ? 'bg-cyan-400/40 text-slate-950 font-extrabold' : 'bg-cyan-500/20 text-cyan-300'}`}>
                {counts.munci} Urban
              </span>
            </button>
          </div>

          {/* Secondary Filters & Map Navigation Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md">

            {/* Quick View Switchers */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFullIndiaView}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${!isZoomedIn
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                title="View entire map of India"
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>Full India Map</span>
              </button>

              <button
                type="button"
                onClick={handleMaharashtraZoom}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isZoomedIn
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                title="Zoom into Maharashtra state"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Zoom to Maharashtra</span>
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Maharashtra District Jump */}
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictJump(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">📍 All Districts in MH</option>
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.division})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Reported">🔴 Damage Reported ({counts.reported})</option>
                <option value="In Repair">🟠 Under Construction/Repair ({counts.inRepair})</option>
                <option value="Resolved">🟢 Resolved ({counts.resolved})</option>
              </select>

              {/* Damage Filter */}
              <select
                value={selectedDamage}
                onChange={(e) => setSelectedDamage(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Defects</option>
                <option value="Pothole">Pothole</option>
                <option value="Longitudinal Crack">Longitudinal Crack</option>
                <option value="Transverse Crack">Transverse Crack</option>
                <option value="Alligator Crack">Alligator Crack</option>
                <option value="Surface Damage">Surface Damage</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Showing <strong className="text-amber-400">{filteredComplaints.length}</strong> markers in MH
            </div>
          </div>
        </div>
      )}

      {/* Map Display: Full map of India, Zoom constrained only for Maharashtra */}
      <div className={`${height} w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-10`}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={4.0}
          maxZoom={18}
          maxBounds={isZoomedIn ? MAHARASHTRA_BOUNDS : INDIA_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <MapFlyTo center={mapCenter} zoom={mapZoom} />
          <MapBoundsController isZoomedIn={isZoomedIn} setIsZoomedIn={setIsZoomedIn} />
          {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Government of Maharashtra GIS'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Maharashtra Boundary Highlight Polygon */}
          <Polygon
            positions={MAHARASHTRA_BORDER_POLYGON}
            pathOptions={{
              color: '#f59e0b',
              weight: 2.5,
              opacity: 0.85,
              fillColor: '#f59e0b',
              fillOpacity: 0.08,
              dashArray: '5, 5'
            }}
          />

          {filteredComplaints.map((c) => {
            // Get division tag (NH, SH, RU, MU)
            let divTag = '●';
            if (c.road_type === 'National Highway') divTag = 'NH';
            else if (c.road_type === 'State Highway') divTag = 'SH';
            else if (c.road_type === 'Rural/Village Road') divTag = 'RU';
            else if (c.road_type === 'Municipal/City Road') divTag = 'MU';

            // Status marker icon (Red = Reported, Orange = Under Construction/Repair, Green = Resolved)
            const markerIcon = createStatusMarkerIcon(c.status, divTag);
            const statusInfo = getStatusMarkerInfo(c.status);

            return (
              <Marker
                key={c.id}
                position={[c.latitude, c.longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="p-1.5 space-y-2.5 max-w-xs text-slate-100 font-sans">

                    {/* Thumbnail Image or Map Pin Banner */}
                    {c.image_url ? (
                      <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                        <img
                          src={c.image_url}
                          alt={c.road_name}
                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-full rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-2 text-center">
                        <MapPin className="h-5 w-5 text-amber-400 mb-0.5" />
                        <span className="text-[11px] font-bold text-white">GIS Map Reported Damage</span>
                        <span className="text-[9px] text-slate-400 font-mono">📍 {c.district} ({c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)})</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                          {c.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 font-semibold text-slate-300 border border-slate-700">
                          {c.damage_type || c.primary_damage_type || 'Road Defect'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 mt-1">
                        {c.road_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                        {c.district}, {c.state || 'Maharashtra'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusInfo.badgeClass}`}>
                        {statusInfo.label} ({c.status})
                      </span>
                      <RoadTypeBadge roadType={c.road_type} size="xs" />
                    </div>

                    {/* ASSIGNED ENGINEER DETAILS SECTION */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <HardHat className="h-3.5 w-3.5 shrink-0" />
                        <span>Assigned Field Engineer</span>
                      </div>

                      {c.engineer_name ? (
                        <div className="space-y-1 text-slate-300 pl-5">
                          <p className="font-bold text-white text-xs">
                            {c.engineer_name} {c.engineer_employee_id && <span className="text-amber-400 font-mono text-[10px]">({c.engineer_employee_id})</span>}
                          </p>
                          {c.engineer_designation && (
                            <p className="text-[10px] text-slate-400">{c.engineer_designation}</p>
                          )}
                          <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                            {c.engineer_phone && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Phone className="h-3 w-3 text-emerald-400" />
                                {c.engineer_phone}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic pl-5">
                          Pending Authority Dispatch
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Authority:</span>
                      <strong className="text-slate-200 text-[11px] truncate max-w-[160px]">
                        {c.authority_name || 'Pending'}
                      </strong>
                    </div>

                    {onViewDetails ? (
                      <button
                        type="button"
                        onClick={() => onViewDetails(c)}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Full Details
                      </button>
                    ) : (
                      <Link
                        to={`/complaints/${c.id}`}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Full Details
                      </Link>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend (Req 2: Red = Reported, Orange = Under Construction/Repair, Green = Resolved) */}
      <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-200 text-xs">Map Status Pins:</span>

          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="h-3.5 w-3.5 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50 border border-white"></span>
            <strong>Red</strong> – Damage Reported
          </span>

          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="h-3.5 w-3.5 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/50 border border-white"></span>
            <strong>Orange</strong> – Under Construction / Repair
          </span>

          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50 border border-white"></span>
            <strong>Green</strong> – Resolved
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium">
          <Compass className="h-3.5 w-3.5" />
          <span>India Overview • Zooming Restricted to Maharashtra State</span>
        </div>
      </div>
    </div>
  );
};

export default ComplaintMap;
