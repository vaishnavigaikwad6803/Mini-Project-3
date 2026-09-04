import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import ComplaintMap from '../../components/map/ComplaintMap';
import Loader from '../../components/common/Loader';
import { MapPin, ShieldAlert, Layers, Info, Shield } from 'lucide-react';

const PublicMap = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getMapComplaints()
      .then((data) => setComplaints(data))
      .catch((err) => console.error("Error fetching map complaints:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Maharashtra State GIS Network
            </span>
            <span className="text-xs text-slate-400">Road Divisions: NH • State • Rural • Munci</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Maharashtra Road Defect GIS Spatial Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore active potholes, cracks, and repaired infrastructure across Maharashtra's **National Highways (NHAI)**, **State Corridors (PWD)**, **Rural Village Links (PMGSY)**, and **Municipal Wards (BMC/PMC)**.
          </p>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Interactive GIS: Switch between Road Divisions (NH, State, Rural, Munci) and jump directly to any Maharashtra district.</span>
        </div>
        <span className="font-semibold text-amber-400">
          {complaints.length} Total Incidents in Maharashtra
        </span>
      </div>

      {/* Map */}
      {loading ? (
        <Loader text="Loading Maharashtra GIS spatial layers..." />
      ) : (
        <ComplaintMap complaints={complaints} height="h-[620px]" showFilters={true} />
      )}

    </div>
  );
};

export default PublicMap;
