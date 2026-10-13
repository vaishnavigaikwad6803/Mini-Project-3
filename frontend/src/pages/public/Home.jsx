import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  MapPin,
  Building2,
  ArrowRight,
  Search,
  Camera,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Shield,
  Activity,
  HardHat,
  X,
  Layers,
  Wrench,
  Sparkles,
  Compass,
  FileCheck2,
  BarChart3
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';

const DAMAGE_CATEGORIES = [
  {
    name: 'Potholes & Cavities',
    code: 'CLASS-01',
    severity: 'Critical',
    severityColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Deep structural depressions posing severe puncture, axle disruption, and road safety hazards.',
    tag: 'Urgent Patching'
  },
  {
    name: 'Alligator Fatigue Cracks',
    code: 'CLASS-02',
    severity: 'High',
    severityColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    description: 'Interconnected multi-directional crack networks caused by underlying pavement sub-base fatigue.',
    tag: 'Structural Milling'
  },
  {
    name: 'Longitudinal Surface Cracks',
    code: 'CLASS-03',
    severity: 'Medium',
    severityColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Linear fractures running parallel to travel direction, typically along joint seams.',
    tag: 'Bitumen Sealing'
  },
  {
    name: 'Transverse Thermal Cracks',
    code: 'CLASS-04',
    severity: 'Medium',
    severityColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Perpendicular cracks across the road lane caused by seasonal thermal contraction.',
    tag: 'Crack Infill'
  }
];

const ROAD_AUTHORITIES = [
  {
    name: 'NHAI Regional Offices',
    authority: 'National Highway Authority',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    description: 'Expressways, National Highways (NH-48, NH-66), and high-speed arterial corridors across India.',
    coverage: 'Expressways & National Highways'
  },
  {
    name: 'State PWD Divisions',
    authority: 'State Highway / PWD',
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
    description: 'State Highways (SH), Major District Roads (MDR), and regional inter-district transportation corridors.',
    coverage: 'State Highways & District Connectors'
  },
  {
    name: 'City Municipal Corporations',
    authority: 'Municipal Authority',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
    description: 'Urban city avenues, municipal ward roads, flyovers, interior streets, and residential colonies.',
    coverage: 'Urban Wards & City Streets'
  },
  {
    name: 'Zilla Parishad & PMGSY',
    authority: 'Rural Road Authority',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    description: 'Rural village links, agrarian connectors, and village panchayat roads under rural development initiatives.',
    coverage: 'Rural & Village Panchayat Roads'
  }
];

const PLATFORM_FEATURES = [
  {
    title: 'AI Road Damage Detection',
    tag: 'YOLOv8 Computer Vision',
    icon: Cpu,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    description: 'Neural vision engine identifies potholes, alligator cracks, longitudinal and transverse fissures with bounding box localization and confidence ratings.'
  },
  {
    title: 'GPS Geolocation Mapping',
    tag: 'Interactive Leaflet GIS',
    icon: MapPin,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    description: 'Automatic device GPS coordinate capture pins hazards onto live interactive Leaflet maps with district and division spatial boundaries.'
  },
  {
    title: 'Automated Authority Routing',
    tag: 'Multi-Tier Governance',
    icon: Building2,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    description: 'Intelligent jurisdiction matching dispatches each complaint to NHAI, State PWD, City Municipal Corporations, or Rural Zilla Parishad based on road classification.'
  },
  {
    title: 'End-to-End Repair Tracking',
    tag: 'Milestone Audit Trail',
    icon: Activity,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    description: 'Complete transparency with real-time status stages from citizen report through engineer inspection, material logs, after-repair photos, and verified sign-off.'
  }
];

const LIFECYCLE_STEPS = [
  {
    step: '01',
    title: 'Citizen Report',
    subtitle: 'Upload & Geotag',
    icon: Camera,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    description: 'Citizens capture hazard photos with auto-detected high-accuracy GPS coordinates and automated road type classification.'
  },
  {
    step: '02',
    title: 'AI Detection',
    subtitle: 'YOLOv8 Classification',
    icon: Cpu,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    description: 'Computer vision identifies damage categories, computes bounding boxes, and calculates severity and urgency ratings.'
  },
  {
    step: '03',
    title: 'Authority Assignment',
    subtitle: 'Jurisdictional Dispatch',
    icon: Building2,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
    description: 'Rules engine routes the complaint directly to the responsible body: NHAI, State PWD, City Municipal Corp, or PMGSY.'
  },
  {
    step: '04',
    title: 'Engineer Repair',
    subtitle: 'Audit & Closure',
    icon: HardHat,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Field engineers conduct repairs, log used materials, upload after photos, and submit for final verified closure.'
  }
];

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#06b6d4', '#a855f7', '#ef4444'];

const Home = () => {
  const [analyticsData, setAnalyticsData] = useState({
    road_type_distribution: [
      { name: 'National Highway', count: 2, percentage: 25.0 },
      { name: 'Municipal', count: 2, percentage: 25.0 },
      { name: 'Rural', count: 2, percentage: 25.0 },
      { name: 'State Highway', count: 2, percentage: 25.0 }
    ],
    damage_type_distribution: [
      { name: 'Alligator Crack', count: 1, percentage: 12.5 },
      { name: 'Longitudinal Crack', count: 1, percentage: 12.5 },
      { name: 'No Clear Damage Detected', count: 1, percentage: 12.5 },
      { name: 'Pothole', count: 2, percentage: 25.0 },
      { name: 'Surface Damage', count: 2, percentage: 25.0 },
      { name: 'Transverse Crack', count: 1, percentage: 12.5 }
    ]
  });

  useEffect(() => {
    complaintService.getPublicAnalytics()
      .then((res) => {
        if (res && res.road_type_distribution && res.damage_type_distribution) {
          // Normalize road type names for concise chart labels
          const normalizedRoadTypes = (res.road_type_distribution || []).map((item) => ({
            ...item,
            displayName: item.name.replace('/City Road', '').replace('/Village Road', '')
          }));
          setAnalyticsData({
            road_type_distribution: normalizedRoadTypes,
            damage_type_distribution: res.damage_type_distribution || []
          });
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live public analytics, using local dataset:', err);
      });
  }, []);

  return (
    <div className="space-y-12 sm:space-y-14 pb-12">

      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 pb-8 sm:pb-12 overflow-hidden">
        {/* Ambient background lighting */}
        <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[280px] h-[220px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Outfit'] max-w-4xl mx-auto leading-tight">
            Smarter Roads, Faster Repairs.
          </h1>

          {/* Concise Platform Description */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Intelligent road maintenance powered by YOLOv8 computer vision. Report potholes and surface cracks with precise GPS coordinates, automatically route complaints to the responsible road authority, and track field repairs through real-time milestone verification.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/citizen/report"
              className="btn-primary text-sm px-6 py-3 shadow-lg shadow-amber-500/25 inline-flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>Report Road Damage</span>
            </Link>
            <Link
              to="/map"
              className="btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>Explore Live Map</span>
            </Link>
          </div>

          {/* Live System Analytics: Pie Chart & Bar Chart */}
          <div className="mt-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">

            {/* 1. Complaints by Road Classification Donut Chart */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    Complaints by Road Classification
                  </h3>
                  <p className="text-xs text-slate-400">Jurisdiction distribution across highways & streets</p>
                </div>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <BarChart3 className="h-4 w-4" />
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData?.road_type_distribution || []}
                      dataKey="count"
                      nameKey="displayName"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      label={({ name, displayName, percent }) => `${(displayName || name || '').split('/')[0]} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {(analyticsData?.road_type_distribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. AI Detected Road Damage Types Bar Chart */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    AI Detected Road Damage Types
                  </h3>
                  <p className="text-xs text-slate-400">Potholes, cracks & surface degradation</p>
                </div>
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Cpu className="h-4 w-4" />
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData?.damage_type_distribution || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. CORE PLATFORM FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Core Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Engineered for Modern Road Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Key technologies that drive intelligent detection, spatial routing, and repair accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PLATFORM_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="card-interactive p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className={`h-10 w-10 rounded-xl ${feat.iconBg} flex items-center justify-center ${feat.iconColor} mb-3.5`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 block mb-1">
                    {feat.tag}
                  </span>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. FOUR-STEP DAMAGE-TO-REPAIR LIFECYCLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Operational Pipeline</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-1">
              Four-Step Road Repair Lifecycle
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Seamless end-to-end orchestration connecting citizens, computer vision, authorities, and field engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {LIFECYCLE_STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.step}
                  className="card-interactive p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`h-8 w-8 rounded-xl ${step.bg} flex items-center justify-center ${step.color} font-extrabold text-xs font-['Outfit']`}>
                        {step.step}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {step.subtitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <StepIcon className={`h-4 w-4 ${step.color}`} />
                      <h3 className="text-sm font-bold text-white font-['Outfit']">{step.title}</h3>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. DEFECT DETECTION SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Computer Vision Classification</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-1">
                Trained Damage Defect Classes
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>YOLOv8 Detection Pipeline</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DAMAGE_CATEGORIES.map((cat) => (
              <div key={cat.code} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-slate-500 uppercase font-bold">{cat.code}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.severityColor}`}>
                    {cat.severity}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white font-['Outfit']">{cat.name}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{cat.description}</p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Remediation</span>
                  <span className="text-amber-400 font-semibold">{cat.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COVERED ROAD AUTHORITIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Multi-Tier Administration</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-1">
                Covered Road Authority Ecosystem
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Automated jurisdictional routing matching road classes to the responsible governing department.
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              View GIS Authority Boundaries <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROAD_AUTHORITIES.map((auth) => (
              <div key={auth.name} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 card-interactive flex flex-col justify-between">
                <div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold uppercase mb-2 ${auth.color}`}>
                    <Building2 className="h-4 w-4" />
                    <span>{auth.authority}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-['Outfit']">{auth.name}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {auth.description}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-slate-800/80">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${auth.badgeBg}`}>
                    {auth.coverage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-tr from-amber-500/15 via-slate-900 to-cyan-500/10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] max-w-2xl mx-auto">
            Ready to Help Make Our Roads Safer?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 max-w-xl mx-auto leading-relaxed">
            Report road hazards with immediate GPS localization. Watch your submission progress through AI analysis, authority assignment, and verified field repair.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/citizen/report"
              className="btn-primary text-sm px-6 py-3 shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>Report Road Damage</span>
            </Link>
            <Link
              to="/map"
              className="btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>Explore Live Map</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
