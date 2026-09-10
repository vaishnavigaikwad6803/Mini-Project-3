import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Building2,
  ArrowRight,
  Sparkles,
  Search
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [complaintIdInput, setComplaintIdInput] = useState('');

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (complaintIdInput.trim()) {
      navigate(`/track?id=${encodeURIComponent(complaintIdInput.trim())}`);
    }
  };

  return (
    <div className="space-y-20 pb-16">

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-semibold text-amber-400 mb-6 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>AI-Driven Road Damage Detection & Multi-Authority Management</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-['Outfit'] max-w-4xl mx-auto leading-tight">
            Smarter Roads  ,  Faster Repairs
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Report road hazards with instant GPS geolocation. Our neural computer vision engine detects potholes and cracks, auto-assigns the responsible highway or municipal authority, and tracks field repairs from inspection to verified closure.
          </p>

          {/* Quick Track Bar */}
          <div className="mt-10 max-w-lg mx-auto">
            <form onSubmit={handleTrackSubmit} className="flex items-center rounded-2xl bg-slate-900/90 border border-slate-700 p-1.5 focus-within:border-amber-500 transition-colors shadow-2xl">
              <Search className="h-5 w-5 text-slate-400 ml-3" />
              <input
                type="text"
                placeholder="Enter Complaint ID (e.g. RGD-2026-1001)"
                value={complaintIdInput}
                onChange={(e) => setComplaintIdInput(e.target.value)}
                className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
              >
                Track Status
              </button>
            </form>
          </div>

          {/* Live Metrics Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">YOLOv8</span>
              <p className="text-xs text-slate-400 mt-1">Computer Vision Engine</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-['Outfit']">4 Road Types</span>
              <p className="text-xs text-slate-400 mt-1">National, State, City, Rural</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-['Outfit']">100% GIS</span>
              <p className="text-xs text-slate-400 mt-1">Leaflet Spatial Mapping</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-['Outfit']">Full Audit</span>
              <p className="text-xs text-slate-400 mt-1">End-to-End Lifecycle</p>
            </div>
          </div>

        </div>
      </section>

      {/* 2. HOW ROADGUARD AI WORKS (4-STEP WORKFLOW) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">System Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Automated Damage-to-Repair Lifecycle
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Seamless integration between Citizens, Neural AI, Authorities, and Field Engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-amber-500/40 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 font-extrabold text-lg font-['Outfit']">
              01
            </div>
            <h3 className="text-sm font-bold text-white">Citizen Report & GPS</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Citizens capture road defects with auto-detected device GPS coordinates and automated neural road classification.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-cyan-500/40 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 font-extrabold text-lg font-['Outfit']">
              02
            </div>
            <h3 className="text-sm font-bold text-white">YOLOv8 AI Inference</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Computer vision classifies potholes, longitudinal/transverse/alligator cracks, and generates confidence scores and bounding boxes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-indigo-500/40 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 font-extrabold text-lg font-['Outfit']">
              03
            </div>
            <h3 className="text-sm font-bold text-white">Authority Routing</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Automated routing rules match road type & district to the responsible body (NHAI, PWD, Municipal Corp, or PMGSY Rural).
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-emerald-500/40 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-extrabold text-lg font-['Outfit']">
              04
            </div>
            <h3 className="text-sm font-bold text-white">Engineer Repair & Sign-off</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Field engineers conduct inspections, log materials and repair before/after photos, followed by final authority verification and closure.
            </p>
          </div>

        </div>
      </section>

      {/* 4. COVERED ROAD AUTHORITIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Multi-Tier Administration</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-1">
                Configured Road Authority Ecosystem
              </h2>
            </div>
            <Link
              to="/map"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
            >
              View Authority Map Boundaries <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs uppercase mb-2">
                <Building2 className="h-4 w-4" /> National Highway Authority
              </div>
              <h4 className="text-sm font-bold text-white">NHAI Regional Offices</h4>
              <p className="text-xs text-slate-400 mt-1">
                Expressways, National Highways (NH-48, NH-66), High-speed arterial corridors.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-xs uppercase mb-2">
                <Building2 className="h-4 w-4" /> State Highway / PWD
              </div>
              <h4 className="text-sm font-bold text-white">State PWD Divisions</h4>
              <p className="text-xs text-slate-400 mt-1">
                State Highways (SH-27, SH-114), Major District Roads (MDR) connecting towns.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-xs uppercase mb-2">
                <Building2 className="h-4 w-4" /> Municipal Authority
              </div>
              <h4 className="text-sm font-bold text-white">City Municipal Corporations</h4>
              <p className="text-xs text-slate-400 mt-1">
                Urban wards, city streets, colony roads, flyovers, and municipal bridges (e.g. BMC).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs uppercase mb-2">
                <Building2 className="h-4 w-4" /> Rural Road Authority
              </div>
              <h4 className="text-sm font-bold text-white">Zilla Parishad & PMGSY</h4>
              <p className="text-xs text-slate-400 mt-1">
                Rural village links, agrarian connectors, and village panchayat roads.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-slate-900 to-cyan-500/15 border border-slate-800 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit'] max-w-2xl mx-auto">
            Ready to Help Make Our Roads Safer & Defect-Free?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-xl mx-auto">
            Upload a photo of any road defect, get real-time AI damage metrics, and watch your complaint progress from assignment to verified repair.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/map"
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Explore GIS Road Map
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
