import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import StatusBadge from '../common/StatusBadge';
import RoadTypeBadge from '../common/RoadTypeBadge';
import EmptyState from '../common/EmptyState';
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
  Globe2,
  Search,
  X,
  Building2,
  Activity,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight,
  ListFilter,
  Maximize2
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

// Helper to determine status color, tag and label
export const getStatusMarkerInfo = (status) => {
  switch (status) {
    case 'Repair Completed':
    case 'Closed':
      return {
        color: '#10b981', // Emerald / Green
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
        label: 'In Repair',
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

// Check if coordinates are valid numbers and inside reasonable geographical bounds
export const isValidCoordinate = (lat, lng) => {
  if (lat == null || lng == null) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  return (
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180 &&
    numLat !== 0 &&
    numLng !== 0
  );
};

// Create custom colored marker icons
const createStatusMarkerIcon = (status, divisionTag = '', isSelected = false) => {
  const statusInfo = getStatusMarkerInfo(status);
  const size = isSelected ? 34 : 28;
  const borderWidth = isSelected ? '3px' : '2px';
  const borderColor = isSelected ? '#f59e0b' : '#ffffff';
  const shadowGlow = isSelected
    ? `0 0 16px #f59e0b, 0 0 8px ${statusInfo.glow}`
    : `0 0 8px ${statusInfo.glow}`;

  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${statusInfo.color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth} solid ${borderColor};
        box-shadow: ${shadowGlow};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: ${isSelected ? '11px' : '9.5px'};
        font-family: monospace;
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ${isSelected ? 'transform: scale(1.15); z-index: 1000;' : ''}
      ">
        ${divisionTag || statusInfo.tag}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

// Component to handle smooth camera moves
const MapFlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.1 });
    }
  }, [center, zoom, map]);
  return null;
};

// Component to enforce India overview vs. Maharashtra-only bounds
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
  authorities = [],
  height = 'h-[580px]',
  showFilters = true,
  initialRoadDivision = 'ALL',
  startWithIndia = true,
  onMapClick = null,
  onViewDetails = null
}) => {
  // Filter States
  const [selectedRoadDivision, setSelectedRoadDivision] = useState(initialRoadDivision);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedDamage, setSelectedDamage] = useState('ALL');
  const [selectedAuthority, setSelectedAuthority] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Complaint & View Modes
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showListPanel, setShowListPanel] = useState(true);

  // Map View State
  const [mapCenter, setMapCenter] = useState(startWithIndia ? INDIA_CENTER : MAHARASHTRA_CENTER);
  const [mapZoom, setMapZoom] = useState(startWithIndia ? INDIA_DEFAULT_ZOOM : MAHARASHTRA_DEFAULT_ZOOM);
  const [isZoomedIn, setIsZoomedIn] = useState(!startWithIndia);

  // Safe extraction of complaint list
  const safeComplaintsList = useMemo(() => {
    if (!complaints) return [];
    if (Array.isArray(complaints)) return complaints;
    if (Array.isArray(complaints.complaints)) return complaints.complaints;
    if (Array.isArray(complaints.data)) return complaints.data;
    return [];
  }, [complaints]);

  // Filter out any complaints with invalid/missing coordinates safely
  const validComplaints = useMemo(() => {
    return safeComplaintsList.filter((c) => isValidCoordinate(c?.latitude, c?.longitude));
  }, [safeComplaintsList]);

  // Dynamic authorities list computed from both authorities props and complaints
  const authorityOptions = useMemo(() => {
    const names = new Set();
    if (Array.isArray(authorities)) {
      authorities.forEach((a) => {
        if (typeof a === 'string' && a.trim()) names.add(a.trim());
        else if (a && a.name && typeof a.name === 'string') names.add(a.name.trim());
      });
    }
    safeComplaintsList.forEach((c) => {
      if (c?.authority_name && c.authority_name !== 'Pending Authority Assignment') {
        names.add(c.authority_name.trim());
      }
    });
    return Array.from(names).sort();
  }, [authorities, safeComplaintsList]);

  // Dynamic damage types computed from common types and reported defects
  const damageTypeOptions = useMemo(() => {
    const types = new Set(['Pothole', 'Alligator Crack', 'Longitudinal Crack', 'Transverse Crack', 'Cavity']);
    safeComplaintsList.forEach((c) => {
      const dt = c?.damage_type || c?.primary_damage_type;
      if (dt && dt !== 'Road Defect') types.add(dt);
    });
    return Array.from(types).sort();
  }, [safeComplaintsList]);

  // Apply all multi-attribute filters
  const filteredComplaints = useMemo(() => {
    return validComplaints.filter((c) => {
      // 1. Road Division Filter
      if (selectedRoadDivision !== 'ALL') {
        if (selectedRoadDivision === 'NH' && c.road_type !== 'National Highway') return false;
        if (selectedRoadDivision === 'STATE' && c.road_type !== 'State Highway') return false;
        if (selectedRoadDivision === 'RURAL' && c.road_type !== 'Rural/Village Road') return false;
        if (selectedRoadDivision === 'MUNCI' && c.road_type !== 'Municipal/City Road') return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'Reported') {
          if (!['Submitted', 'AI Analyzed', 'Authority Assigned', 'Under Review', 'Inspection Pending'].includes(c.status)) return false;
        } else if (selectedStatus === 'In Repair') {
          if (!['Engineer Assigned', 'Inspection Completed', 'Repair Started', 'Repair In Progress', 'Authority Verification'].includes(c.status)) return false;
        } else if (selectedStatus === 'Resolved') {
          if (!['Repair Completed', 'Closed'].includes(c.status)) return false;
        } else if (c.status !== selectedStatus) {
          return false;
        }
      }

      // 3. Severity / Priority Filter
      if (selectedSeverity !== 'ALL') {
        const itemPriority = (c.priority || c.ai_severity || '').toLowerCase();
        if (itemPriority !== selectedSeverity.toLowerCase()) return false;
      }

      // 4. Damage Defect Type Filter
      if (selectedDamage !== 'ALL') {
        const itemDamage = (c.damage_type || c.primary_damage_type || '').toLowerCase();
        if (!itemDamage.includes(selectedDamage.toLowerCase())) return false;
      }

      // 5. Authority Filter
      if (selectedAuthority !== 'ALL') {
        const authName = (c.authority_name || '').toLowerCase();
        if (!authName.includes(selectedAuthority.toLowerCase())) return false;
      }

      // 6. District Filter
      if (selectedDistrict && selectedDistrict !== 'ALL') {
        if (!c.district?.toLowerCase().includes(selectedDistrict.toLowerCase())) return false;
      }

      // 7. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const roadMatch = c.road_name?.toLowerCase().includes(query);
        const idMatch = c.id?.toLowerCase().includes(query);
        const distMatch = c.district?.toLowerCase().includes(query);
        if (!roadMatch && !idMatch && !distMatch) return false;
      }

      return true;
    });
  }, [
    validComplaints,
    selectedRoadDivision,
    selectedStatus,
    selectedSeverity,
    selectedDamage,
    selectedAuthority,
    selectedDistrict,
    searchQuery
  ]);

  // Aggregate Category Counts
  const counts = useMemo(() => ({
    all: validComplaints.length,
    nh: validComplaints.filter(c => c.road_type === 'National Highway').length,
    state: validComplaints.filter(c => c.road_type === 'State Highway').length,
    rural: validComplaints.filter(c => c.road_type === 'Rural/Village Road').length,
    munci: validComplaints.filter(c => c.road_type === 'Municipal/City Road').length,
    reported: validComplaints.filter(c => ['Submitted', 'AI Analyzed', 'Authority Assigned', 'Under Review', 'Inspection Pending'].includes(c.status)).length,
    inRepair: validComplaints.filter(c => ['Engineer Assigned', 'Inspection Completed', 'Repair Started', 'Repair In Progress', 'Authority Verification'].includes(c.status)).length,
    resolved: validComplaints.filter(c => ['Repair Completed', 'Closed'].includes(c.status)).length,
  }), [validComplaints]);

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

  // Handle Quick District Jump
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

  // Select Complaint & Focus Marker
  const handleSelectComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    if (isValidCoordinate(complaint.latitude, complaint.longitude)) {
      setMapCenter([complaint.latitude, complaint.longitude]);
      setMapZoom(15);
      setIsZoomedIn(true);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedRoadDivision('ALL');
    setSelectedStatus('ALL');
    setSelectedSeverity('ALL');
    setSelectedDamage('ALL');
    setSelectedAuthority('ALL');
    setSelectedDistrict('');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedRoadDivision !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedSeverity !== 'ALL' ||
    selectedDamage !== 'ALL' ||
    selectedAuthority !== 'ALL' ||
    Boolean(selectedDistrict) ||
    Boolean(searchQuery);

  return (
    <div className="space-y-4">

      {/* 1. ROAD DIVISION TABS */}
      {showFilters && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRoadDivision('ALL')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRoadDivision === 'ALL'
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
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRoadDivision === 'NH'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900/90 text-amber-300 border-slate-800 hover:bg-amber-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🛣️</span>
                <span>National (NHAI)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'NH' ? 'bg-amber-400/40 text-slate-950 font-extrabold' : 'bg-amber-500/20 text-amber-400'}`}>
                {counts.nh} NHAI
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoadDivision('STATE')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRoadDivision === 'STATE'
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
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRoadDivision === 'RURAL'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/90 text-emerald-300 border-slate-800 hover:bg-emerald-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🌾</span>
                <span>Rural (PMGSY)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'RURAL' ? 'bg-emerald-400/40 text-slate-950 font-extrabold' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {counts.rural} Rural
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoadDivision('MUNCI')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                selectedRoadDivision === 'MUNCI'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900/90 text-cyan-300 border-slate-800 hover:bg-cyan-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>🏙️</span>
                <span>Municipal (City)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRoadDivision === 'MUNCI' ? 'bg-cyan-400/40 text-slate-950 font-extrabold' : 'bg-cyan-500/20 text-cyan-300'}`}>
                {counts.munci} Urban
              </span>
            </button>
          </div>

          {/* 2. ADVANCED MULTI-ATTRIBUTE FILTER TOOLBAR */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">

              {/* View Buttons & Search Box */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search road name or complaint ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 rounded-xl border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleFullIndiaView}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      !isZoomedIn ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Globe2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">India View</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMaharashtraZoom}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isZoomedIn ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Maharashtra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowListPanel(!showListPanel)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      showListPanel ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Toggle defect list panel"
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{showListPanel ? 'Hide List' : 'Show List'}</span>
                  </button>
                </div>
              </div>

              {/* Status / Count Summary */}
              <div className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-2">
                <span>
                  Showing <strong className="text-amber-400">{filteredComplaints.length}</strong> of {validComplaints.length} mapped defects
                </span>
                {safeComplaintsList.length > validComplaints.length && (
                  <span
                    className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800"
                    title="Defects without coordinates are omitted from map to prevent inaccurate pin fabrication"
                  >
                    ({safeComplaintsList.length - validComplaints.length} unmapped without GPS)
                  </span>
                )}
              </div>
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-800/80">

              {/* District Jump */}
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictJump(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Status: All</option>
                <option value="Reported">🔴 Damage Reported ({counts.reported})</option>
                <option value="In Repair">🟠 In Repair / Assigned ({counts.inRepair})</option>
                <option value="Resolved">🟢 Resolved ({counts.resolved})</option>
              </select>

              {/* Severity / Priority Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Severity: All</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Defect Damage Type Filter */}
              <select
                value={selectedDamage}
                onChange={(e) => setSelectedDamage(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Damage: All</option>
                {damageTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Authority Filter */}
              <select
                value={selectedAuthority}
                onChange={(e) => setSelectedAuthority(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Authority: All</option>
                {authorityOptions.map((authName) => (
                  <option key={authName} value={authName}>
                    {authName}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Filters currently applied.</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MAIN MAP & RESPONSIVE LIST PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left: Leaflet Map Container */}
        <div className={`${showListPanel ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300`}>
          <div className={`${height} w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-10 bg-slate-950`}>

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

              {/* OpenStreetMap Tile Layer with Attribution */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | Government of Maharashtra GIS'
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

              {/* Complaint Markers */}
              {filteredComplaints.map((c) => {
                let divTag = '●';
                if (c.road_type === 'National Highway') divTag = 'NH';
                else if (c.road_type === 'State Highway') divTag = 'SH';
                else if (c.road_type === 'Rural/Village Road') divTag = 'RU';
                else if (c.road_type === 'Municipal/City Road') divTag = 'MU';

                const isSelected = selectedComplaint?.id === c.id;
                const markerIcon = createStatusMarkerIcon(c.status, divTag, isSelected);
                const statusInfo = getStatusMarkerInfo(c.status);

                return (
                  <Marker
                    key={c.id}
                    position={[c.latitude, c.longitude]}
                    icon={markerIcon}
                    eventHandlers={{
                      click: () => {
                        handleSelectComplaint(c);
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-2.5 max-w-xs text-slate-100 font-sans">
                        {/* Image preview */}
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
                            <span className="text-[9px] text-slate-400 font-mono">
                              📍 {c.district} ({c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)})
                            </span>
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

                        {/* Engineer info */}
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                            <HardHat className="h-3.5 w-3.5 shrink-0" />
                            <span>Assigned Field Engineer</span>
                          </div>
                          {c.engineer_name ? (
                            <div className="text-slate-300 pl-4 space-y-0.5">
                              <p className="font-bold text-white text-xs">
                                {c.engineer_name} {c.engineer_employee_id && <span className="text-amber-400 font-mono text-[10px]">({c.engineer_employee_id})</span>}
                              </p>
                              {c.engineer_phone && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-emerald-400" />
                                  {c.engineer_phone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic pl-4">
                              Pending Authority Dispatch
                            </p>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-700/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Authority:</span>
                          <strong className="text-slate-200 text-[11px] truncate max-w-[150px]">
                            {c.authority_name || 'Pending'}
                          </strong>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          <Link
                            to={`/track?id=${encodeURIComponent(c.id)}`}
                            className="flex-1 text-center py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-[11px] border border-slate-700 transition-colors"
                          >
                            Track Status
                          </Link>
                          <Link
                            to={`/complaints/${c.id}`}
                            className="flex-1 text-center py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[11px] transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Right: Responsive Defect List & Detail Drawer Panel */}
        {showListPanel && (
          <div className="lg:col-span-4 flex flex-col space-y-3 max-h-[580px]">

            {/* Selected Complaint Inspector Card */}
            {selectedComplaint ? (
              <div className="p-4 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      {selectedComplaint.id}
                    </span>
                    <h3 className="text-sm font-bold text-white font-['Outfit'] line-clamp-1 mt-0.5">
                      {selectedComplaint.road_name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Close selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {selectedComplaint.image_url && (
                  <div className="h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img
                      src={selectedComplaint.image_url}
                      alt={selectedComplaint.road_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Status</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                      {selectedComplaint.status}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Severity</span>
                    <span className="font-semibold text-amber-400 mt-0.5 block truncate">
                      {selectedComplaint.priority || selectedComplaint.ai_severity || 'Medium'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{selectedComplaint.district}, {selectedComplaint.state || 'Maharashtra'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{selectedComplaint.authority_name || 'Pending Authority'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <Link
                    to={`/track?id=${encodeURIComponent(selectedComplaint.id)}`}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors"
                  >
                    Track Status
                  </Link>
                  <Link
                    to={`/complaints/${selectedComplaint.id}`}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Scrollable Filtered Complaints List */}
            <div className="flex-1 overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-white font-['Outfit']">
                  Defect Queue ({filteredComplaints.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Click to pinpoint on map
                </span>
              </div>

              {filteredComplaints.length === 0 ? (
                <div className="py-12 text-center">
                  <EmptyState
                    icon={Filter}
                    title="No Defects Match"
                    description="Try adjusting your filters or clearing search criteria."
                    actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
                    onAction={hasActiveFilters ? handleResetFilters : undefined}
                  />
                </div>
              ) : (
                filteredComplaints.map((c) => {
                  const isSelected = selectedComplaint?.id === c.id;
                  const statusInfo = getStatusMarkerInfo(c.status);

                  return (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectComplaint(c)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleSelectComplaint(c);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left focus:outline-none ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: statusInfo.color }}
                          />
                          <span className="text-[11px] font-mono font-bold text-amber-400">
                            {c.id}
                          </span>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 mt-1 font-['Outfit']">
                        {c.road_name}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>📍 {c.district}</span>
                        <span className="text-slate-300 font-medium">
                          {c.damage_type || c.primary_damage_type || 'Road Defect'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}
      </div>

      {/* 4. MAP STATUS & SEVERITY LEGEND */}
      <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-200">Map Legend:</span>

          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="h-3 w-3 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50 border border-white"></span>
            <span>Damage Reported</span>
          </span>

          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="h-3 w-3 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/50 border border-white"></span>
            <span>In Repair</span>
          </span>

          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50 border border-white"></span>
            <span>Resolved</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="text-amber-400 font-semibold font-mono">NH: National Highway</span>
          <span>•</span>
          <span className="text-indigo-400 font-semibold font-mono">SH: State Highway</span>
          <span>•</span>
          <span className="text-cyan-400 font-semibold font-mono">MU: Municipal Road</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold font-mono">RU: Rural Road</span>
        </div>
      </div>

    </div>
  );
};

export default ComplaintMap;
