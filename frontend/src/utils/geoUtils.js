/**
 * Maharashtra Geographic Utilities & Boundary Constraints
 * Provides high-accuracy GPS tracking, reverse geocoding, and Maharashtra GIS constraints.
 */

// Geographic Center of India & Outer Bounding Box
export const INDIA_CENTER = [21.8, 78.9629];
export const INDIA_DEFAULT_ZOOM = 4.8;
export const INDIA_BOUNDS = [
  [6.5, 68.0],  // Southwest coordinate (Kanyakumari / Arabian Sea)
  [37.5, 97.5]  // Northeast coordinate (Kashmir / Arunachal Pradesh)
];

// Bounding Box for Maharashtra State
// Southwest: [15.6, 72.6], Northeast: [22.1, 80.9]
export const MAHARASHTRA_BOUNDS = [
  [15.6000, 72.6000], // Southwest coordinate (Sindhudurg / Goa border)
  [22.1000, 80.9000]  // Northeast coordinate (Gondia / MP border)
];

// Geographic Center of Maharashtra
export const MAHARASHTRA_CENTER = [19.7515, 75.7139];
export const MAHARASHTRA_DEFAULT_ZOOM = 6.8;

// Default Fallback Center (Used only when device GPS is strictly unavailable/denied)
export const DEFAULT_MUMBAI_CENTER = [19.0760, 72.8777];

// Approximate Maharashtra state boundary polygon for visual emphasis on India Map
export const MAHARASHTRA_BORDER_POLYGON = [
  [20.08, 72.65], [20.25, 73.10], [21.35, 73.65], [21.60, 74.20],
  [21.50, 75.25], [21.35, 76.50], [21.55, 77.20], [21.75, 78.20],
  [21.65, 79.10], [21.40, 80.00], [21.25, 80.70], [20.50, 80.40],
  [19.80, 80.30], [19.10, 79.90], [18.70, 78.80], [18.40, 77.80],
  [17.80, 77.20], [17.30, 76.20], [16.80, 75.40], [15.80, 74.30],
  [15.65, 73.70], [16.50, 73.30], [17.50, 73.15], [18.60, 72.85],
  [19.30, 72.75], [19.80, 72.70], [20.08, 72.65]
];

// Standard Road Divisions in Maharashtra
export const ROAD_DIVISIONS = [
  {
    key: 'NH',
    value: 'National Highway',
    label: 'NH (National Highway)',
    shortLabel: 'NH',
    authority: 'NHAI / MoRTH / Expressway Division',
    color: 'amber',
    bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    activeClass: 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20',
    icon: '🛣️',
    description: 'High-speed national arterial highways & expressways (e.g. NH-48, NH-65, Mumbai-Pune Expressway)'
  },
  {
    key: 'STATE',
    value: 'State Highway',
    label: 'State Highway (PWD)',
    shortLabel: 'State',
    authority: 'Maharashtra Public Works Department (PWD)',
    color: 'indigo',
    bgClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    activeClass: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
    icon: '🛣️',
    description: 'Inter-district state highways & major state connecting corridors (e.g. SH-27, SH-114)'
  },
  {
    key: 'RURAL',
    value: 'Rural/Village Road',
    label: 'Rural / Village Road',
    shortLabel: 'Rural',
    authority: 'Zilla Parishad & PMGSY Rural Roads',
    color: 'emerald',
    bgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    activeClass: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20',
    icon: '🌾',
    description: 'Agrarian village links, Gram Panchayat connectors, and PMGSY road networks'
  },
  {
    key: 'MUNCI',
    value: 'Municipal/City Road',
    label: 'Municipal / City Road',
    shortLabel: 'Munci',
    authority: 'Municipal Corporations (BMC, PMC, TMC, PCMC, etc.)',
    color: 'cyan',
    bgClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    activeClass: 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20',
    icon: '🏙️',
    description: 'Urban city streets, ward roads, flyovers, and municipal arteries within city limits'
  }
];

// Major Maharashtra Districts with Representative Coordinates
export const MAHARASHTRA_DISTRICTS = [
  { name: 'Mumbai Suburban', lat: 19.1136, lng: 72.8697, division: 'Konkan' },
  { name: 'Mumbai City', lat: 18.9388, lng: 72.8354, division: 'Konkan' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, division: 'Pune' },
  { name: 'Thane', lat: 19.2183, lng: 72.9781, division: 'Konkan' },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, division: 'Nagpur' },
  { name: 'Nashik', lat: 19.9975, lng: 73.7898, division: 'Nashik' },
  { name: 'Chhatrapati Sambhaji Nagar', lat: 19.8762, lng: 75.3433, division: 'Marathwada' },
  { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, division: 'Pune' },
  { name: 'Solapur', lat: 17.6599, lng: 75.9064, division: 'Pune' },
  { name: 'Amravati', lat: 20.9374, lng: 77.7796, division: 'Amravati' },
  { name: 'Nanded', lat: 19.1383, lng: 77.3210, division: 'Marathwada' },
  { name: 'Satara', lat: 17.6805, lng: 74.0183, division: 'Pune' },
  { name: 'Raigad (Navi Mumbai)', lat: 18.9894, lng: 73.1175, division: 'Konkan' },
  { name: 'Palghar', lat: 19.6967, lng: 72.7699, division: 'Konkan' },
  { name: 'Jalgaon', lat: 21.0077, lng: 75.5626, division: 'Nashik' },
  { name: 'Ahmednagar', lat: 19.0952, lng: 74.7496, division: 'Nashik' },
  { name: 'Sangli', lat: 16.8524, lng: 74.5815, division: 'Pune' },
  { name: 'Ratnagiri', lat: 16.9902, lng: 73.3120, division: 'Konkan' },
  { name: 'Sindhudurg', lat: 16.1158, lng: 73.6931, division: 'Konkan' },
  { name: 'Akola', lat: 20.7002, lng: 77.0082, division: 'Amravati' },
  { name: 'Chandrapur', lat: 19.9615, lng: 79.2961, division: 'Nagpur' },
  { name: 'Latur', lat: 18.4088, lng: 76.5604, division: 'Marathwada' },
  { name: 'Dhule', lat: 20.9042, lng: 74.7749, division: 'Nashik' }
];

/**
 * Validates whether given coordinates fall inside Maharashtra boundaries
 */
export const isWithinMaharashtra = (lat, lng) => {
  if (lat == null || lng == null) return false;
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  return (
    numLat >= MAHARASHTRA_BOUNDS[0][0] &&
    numLat <= MAHARASHTRA_BOUNDS[1][0] &&
    numLng >= MAHARASHTRA_BOUNDS[0][1] &&
    numLng <= MAHARASHTRA_BOUNDS[1][1]
  );
};

/**
 * Finds closest Maharashtra district based on Euclidean distance
 */
export const getClosestMaharashtraDistrict = (lat, lng) => {
  if (!lat || !lng) return MAHARASHTRA_DISTRICTS[0];
  
  let closest = MAHARASHTRA_DISTRICTS[0];
  let minDistance = Infinity;

  MAHARASHTRA_DISTRICTS.forEach((d) => {
    const dLat = d.lat - lat;
    const dLng = d.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  });

  return closest;
};

/**
 * Automatically determines road classification and administrative division
 * based on geographic coordinates, road name, and OpenStreetMap metadata.
 */
export const detectRoadTypeFromLocation = (lat, lng, geoInfo = {}) => {
  const roadName = (geoInfo.roadName || '').trim();
  const displayName = (geoInfo.displayName || '').trim();
  const osmType = (geoInfo.osmType || '').toLowerCase();
  const address = geoInfo.address || {};
  const district = (geoInfo.district || '').toLowerCase();

  const combinedText = `${roadName} ${displayName} ${address.road || ''} ${address.suburb || ''} ${address.neighbourhood || ''} ${address.city || ''} ${address.county || ''}`.toLowerCase();

  // 1. Check for National Highway (NHAI / MoRTH / Expressway)
  const nhRegex = /\b(nh\b|nh-|nh\s*\d+|national highway|expressway|mahamarg|freeway|asian highway|ah\d+|ah-\d+|samruddhi|eastern freeway|western express highway|eastern express highway|sion panvel|mumbai pune expressway)\b/i;
  const isOsmMotorway = ['motorway', 'motorway_link', 'trunk', 'trunk_link'].includes(osmType);
  
  if (nhRegex.test(combinedText) || nhRegex.test(roadName) || isOsmMotorway) {
    return {
      road_type: 'National Highway',
      division_key: 'NH',
      authority_name: 'National Highways Authority of India (NHAI)',
      label: 'NH (National Highway)',
      icon: '🛣️',
      color: 'amber',
      reason: 'Identified as National Highway / Arterial Expressway corridor under NHAI jurisdiction'
    };
  }

  // 2. Check for Rural / Village Road (PMGSY / Zilla Parishad)
  const ruralRegex = /\b(village|gram|panchayat|grampanchayat|wadi|pada|vasti|gaon|khet|pmgsy|rural road|zilla parishad road|zp road|shetrasta)\b/i;
  const isOsmRural = ['unclassified', 'track', 'path', 'bridleway'].includes(osmType) || Boolean(address.village || address.hamlet || address.isolated_dwelling);
  
  if (ruralRegex.test(combinedText) || ruralRegex.test(roadName) || (isOsmRural && !address.city && !address.suburb)) {
    return {
      road_type: 'Rural/Village Road',
      division_key: 'RURAL',
      authority_name: 'Zilla Parishad & PMGSY Rural Roads',
      label: 'Rural / Village Road',
      icon: '🌾',
      color: 'emerald',
      reason: 'Identified as Village / Gram Panchayat road within rural Zilla Parishad link network'
    };
  }

  // 3. Check for State Highway (Maharashtra PWD)
  const shRegex = /\b(sh\b|sh-|sh\s*\d+|state highway|state road|mh-sh|pwd road|public works department)\b/i;
  const isOsmPrimary = ['primary', 'primary_link', 'secondary', 'secondary_link'].includes(osmType);
  
  // If it matches SH pattern or is a primary inter-district link outside major metro urban core
  const isMajorMetro = district.includes('mumbai') || district.includes('pune') || district.includes('thane');
  if (shRegex.test(combinedText) || shRegex.test(roadName) || (isOsmPrimary && !isMajorMetro)) {
    return {
      road_type: 'State Highway',
      division_key: 'STATE',
      authority_name: 'Maharashtra Public Works Department (PWD)',
      label: 'State Highway (PWD)',
      icon: '🛣️',
      color: 'indigo',
      reason: 'Identified as State Highway corridor under Maharashtra State PWD jurisdiction'
    };
  }

  // 4. Check for Municipal / City Road (BMC / PMC / TMC / Municipal Corporations)
  const cityRegex = /\b(marg|road|street|avenue|lane|cross|flyover|circle|nagar|chowk|ward|sector|colony|path|link road)\b/i;
  const isOsmUrban = ['tertiary', 'tertiary_link', 'residential', 'living_street', 'service', 'pedestrian', 'footway'].includes(osmType);
  const hasUrbanAddress = Boolean(address.city || address.suburb || address.neighbourhood || address.town || address.municipality || address.city_district);

  if (cityRegex.test(combinedText) || isOsmUrban || hasUrbanAddress || isMajorMetro) {
    return {
      road_type: 'Municipal/City Road',
      division_key: 'MUNCI',
      authority_name: 'Municipal Corporation (BMC / PMC / TMC / Local Urban Body)',
      label: 'Municipal / City Road',
      icon: '🏙️',
      color: 'cyan',
      reason: 'Identified as Urban City / Ward street under Local Municipal Corporation'
    };
  }

  // 5. Default Fallback based on district geography
  return {
    road_type: isMajorMetro ? 'Municipal/City Road' : 'State Highway',
    division_key: isMajorMetro ? 'MUNCI' : 'STATE',
    authority_name: isMajorMetro ? 'Municipal Corporation (Local Urban Body)' : 'Maharashtra Public Works Department (PWD)',
    label: isMajorMetro ? 'Municipal / City Road' : 'State Highway (PWD)',
    icon: isMajorMetro ? '🏙️' : '🛣️',
    color: isMajorMetro ? 'cyan' : 'indigo',
    reason: 'Automatically classified based on Maharashtra territorial administrative zoning'
  };
};

/**
 * Reverse geocodes coordinates to Village, Taluka, District, State, and Road Name.
 * The GPS coordinates (lat, lng) remain the authoritative source of truth.
 */
export const reverseGeocodeCoords = async (lat, lng) => {
  if (lat == null || lng == null) return null;
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${numLat}&lon=${numLng}&addressdetails=1&extratags=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Reverse geocode HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const address = data?.address || {};
    
    // Extract address hierarchy for Indian/Maharashtra rural and urban administrative divisions
    const village = address.village || address.hamlet || address.isolated_dwelling || null;
    const taluka = address.subdistrict || address.county || address.taluk || address.municipality || address.town || null;
    const rawDistrict = address.state_district || address.county || address.city_district || address.district || address.city || address.town || '';
    const district = rawDistrict ? rawDistrict.replace(/ District/gi, '').trim() : null;
    const state = address.state || 'Maharashtra';
    const road = address.road || address.highway || address.neighbourhood || address.suburb || address.residential || '';
    
    // Build descriptive location display name (prioritizing Village e.g. "Alave, Panhala, Kolhapur")
    const parts = [];
    if (village) parts.push(village);
    if (taluka && taluka !== village && taluka !== district) parts.push(taluka);
    if (district) parts.push(district);
    if (state) parts.push(state);
    
    const formattedDisplayName = parts.length > 0 ? parts.join(', ') : (data?.display_name || `${district || 'Maharashtra'}, India`);
    
    // Determine appropriate road label
    let resolvedRoadName = road;
    if (!resolvedRoadName) {
      if (village) {
        resolvedRoadName = `${village} Main Road`;
      } else if (taluka) {
        resolvedRoadName = `${taluka} Road`;
      } else if (district) {
        resolvedRoadName = `${district} Road`;
      } else {
        resolvedRoadName = 'Maharashtra State Road';
      }
    }

    const rawGeo = {
      village: village,
      taluka: taluka,
      district: district,
      state: state,
      roadName: resolvedRoadName,
      displayName: formattedDisplayName,
      fullOsmDisplayName: data?.display_name || '',
      osmType: data?.type || data?.extratags?.highway || '',
      address: address,
      latitude: numLat,
      longitude: numLng
    };

    const roadDetection = detectRoadTypeFromLocation(numLat, numLng, rawGeo);

    return {
      ...rawGeo,
      roadType: roadDetection.road_type,
      roadDivisionKey: roadDetection.division_key,
      roadTypeInfo: roadDetection
    };
  } catch (e) {
    console.warn(`Reverse geocoding fetch issue (${e.message}), using mathematical district fallback...`);
    const fallbackDistrict = getClosestMaharashtraDistrict(numLat, numLng);
    const roadDetection = detectRoadTypeFromLocation(numLat, numLng, { district: fallbackDistrict.name });
    
    return {
      village: null,
      taluka: null,
      district: fallbackDistrict.name,
      state: 'Maharashtra',
      roadName: `${fallbackDistrict.name} Road`,
      displayName: `${fallbackDistrict.name}, Maharashtra`,
      fullOsmDisplayName: `${fallbackDistrict.name}, Maharashtra, India`,
      roadType: roadDetection.road_type,
      roadDivisionKey: roadDetection.division_key,
      roadTypeInfo: roadDetection,
      latitude: numLat,
      longitude: numLng
    };
  }
};

/**
 * High-Accuracy Device Geolocation Acquisition & Validation.
 * Requests device GPS via browser Geolocation API, validates accuracy,
 * performs reverse geocoding, and outputs full debug diagnostics.
 */
export const detectCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      const defaultDist = MAHARASHTRA_DISTRICTS[0];
      const res = {
        success: false,
        latitude: DEFAULT_MUMBAI_CENTER[0],
        longitude: DEFAULT_MUMBAI_CENTER[1],
        accuracy: null,
        accuracyLevel: 'unavailable',
        accuracyMessage: 'Geolocation is not supported by your browser.',
        district: defaultDist.name,
        state: 'Maharashtra',
        road_name: `${defaultDist.name} Road`,
        displayName: `${defaultDist.name}, Maharashtra`,
        insideMaharashtra: true,
        message: 'Geolocation unsupported in this browser.'
      };
      console.warn('[GPS Debug] Geolocation API not available.');
      resolve(res);
      return;
    }

    const processPosition = async (pos) => {
      const rawLat = parseFloat(pos.coords.latitude.toFixed(6));
      const rawLng = parseFloat(pos.coords.longitude.toFixed(6));
      const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
      const timestamp = pos.timestamp || Date.now();

      // Validate GPS accuracy
      let accuracyLevel = 'good';
      let accuracyMessage = 'Location detected successfully';
      if (accuracy !== null) {
        if (accuracy <= 50) {
          accuracyLevel = 'good';
          accuracyMessage = `Location detected successfully (Accuracy: ${accuracy} meters)`;
        } else if (accuracy <= 150) {
          accuracyLevel = 'fair';
          accuracyMessage = `Location detected with moderate accuracy (±${accuracy}m)`;
        } else {
          accuracyLevel = 'poor';
          accuracyMessage = `Your location accuracy is low (±${accuracy}m). Please wait for a better GPS signal or try again.`;
        }
      }

      // Reverse geocode from exact coordinates
      const geoResult = await reverseGeocodeCoords(rawLat, rawLng);
      const closestDistrict = getClosestMaharashtraDistrict(rawLat, rawLng);
      
      const finalDistrict = geoResult?.district || closestDistrict.name;
      const finalVillage = geoResult?.village || null;
      const finalTaluka = geoResult?.taluka || null;
      const finalRoad = geoResult?.roadName || `${finalDistrict} Road`;
      const finalDisplayName = geoResult?.displayName || `${finalDistrict}, Maharashtra`;
      const insideMH = isWithinMaharashtra(rawLat, rawLng);

      // Console Diagnostic Logging
      console.log('================ [GPS DEBUG] ================');
      console.log(`Raw Latitude:        ${rawLat}`);
      console.log(`Raw Longitude:       ${rawLng}`);
      console.log(`GPS Accuracy:        ${accuracy !== null ? `${accuracy} meters` : 'Unknown'} [${accuracyLevel}]`);
      console.log(`Timestamp:           ${new Date(timestamp).toISOString()}`);
      console.log(`Reverse-Geocoded:    ${finalDisplayName}`);
      console.log(`Detected Village:    ${finalVillage || 'N/A'}`);
      console.log(`Detected Taluka:     ${finalTaluka || 'N/A'}`);
      console.log(`Detected District:   ${finalDistrict}`);
      console.log(`Inside Maharashtra:  ${insideMH}`);
      console.log('=============================================');

      resolve({
        success: true,
        latitude: rawLat,
        longitude: rawLng,
        accuracy: accuracy,
        accuracyLevel: accuracyLevel,
        accuracyMessage: accuracyMessage,
        village: finalVillage,
        taluka: finalTaluka,
        district: finalDistrict,
        state: geoResult?.state || 'Maharashtra',
        road_name: finalRoad,
        road_type: geoResult?.roadType || 'Municipal/City Road',
        road_type_info: geoResult?.roadTypeInfo || null,
        displayName: finalDisplayName,
        insideMaharashtra: insideMH,
        timestamp: timestamp,
        message: finalVillage 
          ? `Live GPS: ${finalVillage}, ${finalDistrict}${accuracy ? ` (±${accuracy}m)` : ''}`
          : `Live GPS: ${finalDistrict}${accuracy ? ` (±${accuracy}m)` : ''}`
      });
    };

    // Request high accuracy GPS
    navigator.geolocation.getCurrentPosition(
      processPosition,
      (err) => {
        console.warn('[GPS Debug] High-accuracy GPS request timed out or was denied:', err.message);
        
        // Retry with standard accuracy
        navigator.geolocation.getCurrentPosition(
          processPosition,
          (err2) => {
            const defaultDist = MAHARASHTRA_DISTRICTS[0];
            console.warn('[GPS Debug] Standard GPS request also failed:', err2.message);
            resolve({
              success: false,
              latitude: DEFAULT_MUMBAI_CENTER[0],
              longitude: DEFAULT_MUMBAI_CENTER[1],
              accuracy: null,
              accuracyLevel: 'unavailable',
              accuracyMessage: 'GPS permission denied or location unavailable.',
              district: defaultDist.name,
              state: 'Maharashtra',
              road_name: `${defaultDist.name} Road`,
              displayName: `${defaultDist.name}, Maharashtra`,
              error: err2.message,
              insideMaharashtra: true,
              message: 'Location access unavailable. Using default map center.'
            });
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
};

/**
 * Calculates the Haversine distance in meters between two geographic coordinates
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};
