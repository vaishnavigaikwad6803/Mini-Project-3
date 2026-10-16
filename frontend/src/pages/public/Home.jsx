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
import { useLanguage } from '../../context/LanguageContext';

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

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#06b6d4', '#a855f7', '#ef4444'];

const Home = () => {
  const { t } = useLanguage();

  const platformFeatures = [
    {
      title: t('home.features.f1_title', 'AI Road Damage Detection'),
      tag: t('home.features.f1_tag', 'YOLOv8 Computer Vision'),
      icon: Cpu,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      description: t('home.features.f1_desc', 'Neural vision engine identifies potholes, alligator cracks, longitudinal and transverse fissures with bounding box localization and confidence ratings.')
    },
    {
      title: t('home.features.f2_title', 'GPS Geolocation Mapping'),
      tag: t('home.features.f2_tag', 'Interactive Leaflet GIS'),
      icon: MapPin,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      description: t('home.features.f2_desc', 'Automatic device GPS coordinate capture pins hazards onto live interactive Leaflet maps with district and division spatial boundaries.')
    },
    {
      title: t('home.features.f3_title', 'Automated Authority Routing'),
      tag: t('home.features.f3_tag', 'Multi-Tier Governance'),
      icon: Building2,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
      description: t('home.features.f3_desc', 'Intelligent jurisdiction matching dispatches each complaint to NHAI, State PWD, City Municipal Corporations, or Rural Zilla Parishad based on road classification.')
    },
    {
      title: t('home.features.f4_title', 'End-to-End Repair Tracking'),
      tag: t('home.features.f4_tag', 'Milestone Audit Trail'),
      icon: Activity,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      description: t('home.features.f4_desc', 'Complete transparency with real-time status stages from citizen report through engineer inspection, material logs, after-repair photos, and verified sign-off.')
    }
  ];

  const lifecycleSteps = [
    {
      step: '01',
      title: t('home.lifecycle.step1Title', 'Citizen Report'),
      subtitle: t('home.lifecycle.step1Subtitle', 'Upload & Geotag'),
      icon: Camera,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      description: t('home.lifecycle.step1Desc', 'Citizens capture hazard photos with auto-detected high-accuracy GPS coordinates and automated road type classification.')
    },
    {
      step: '02',
      title: t('home.lifecycle.step2Title', 'AI Detection'),
      subtitle: t('home.lifecycle.step2Subtitle', 'YOLOv8 Classification'),
      icon: Cpu,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      description: t('home.lifecycle.step2Desc', 'Computer vision identifies damage categories, computes bounding boxes, and calculates severity and urgency ratings.')
    },
    {
      step: '03',
      title: t('home.lifecycle.step3Title', 'Authority Assignment'),
      subtitle: t('home.lifecycle.step3Subtitle', 'Jurisdictional Dispatch'),
      icon: Building2,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      description: t('home.lifecycle.step3Desc', 'Rules engine routes the complaint directly to the responsible body: NHAI, State PWD, City Municipal Corp, or PMGSY.')
    },
    {
      step: '04',
      title: t('home.lifecycle.step4Title', 'Engineer Repair'),
      subtitle: t('home.lifecycle.step4Subtitle', 'Audit & Closure'),
      icon: HardHat,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      description: t('home.lifecycle.step4Desc', 'Field engineers conduct repairs, log used materials, upload after photos, and submit for final verified closure.')
    }
  ];

  const roadAuthorities = [
    {
      name: t('home.authorities.a1_name', 'NHAI Regional Offices'),
      authority: t('home.authorities.a1_auth', 'National Highway Authority'),
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      description: t('home.authorities.a1_desc', 'Expressways, National Highways (NH-48, NH-66), and high-speed arterial corridors across India.'),
      coverage: t('home.authorities.a1_cov', 'Expressways & National Highways')
    },
    {
      name: t('home.authorities.a2_name', 'State PWD Divisions'),
      authority: t('home.authorities.a2_auth', 'State Highway / PWD'),
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
      description: t('home.authorities.a2_desc', 'State Highways (SH), Major District Roads (MDR), and regional inter-district transportation corridors.'),
      coverage: t('home.authorities.a2_cov', 'State Highways & District Connectors')
    },
    {
      name: t('home.authorities.a3_name', 'City Municipal Corporations'),
      authority: t('home.authorities.a3_auth', 'Municipal Authority'),
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
      description: t('home.authorities.a3_desc', 'Urban city avenues, municipal ward roads, flyovers, interior streets, and residential colonies.'),
      coverage: t('home.authorities.a3_cov', 'Urban Wards & City Streets')
    },
    {
      name: t('home.authorities.a4_name', 'Zilla Parishad & PMGSY'),
      authority: t('home.authorities.a4_auth', 'Rural Road Authority'),
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      description: t('home.authorities.a4_desc', 'Rural village links, agrarian connectors, and village panchayat roads under rural development initiatives.'),
      coverage: t('home.authorities.a4_cov', 'Rural & Village Panchayat Roads')
    }
  ];

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

          {/* Civic Badge */}
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider inline-block mb-3">
            {t('home.badge')}
          </span>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Outfit'] max-w-4xl mx-auto leading-tight">
            {t('home.heroTitle1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              {t('home.heroTitle2')}
            </span>
          </h1>

          {/* Concise Platform Description */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('home.heroDesc')}
          </p>

          {/* Quick CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/citizen/report"
              className="btn-primary text-sm px-5 py-2.5 shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>{t('home.ctaReport')}</span>
            </Link>
            <Link
              to="/map"
              className="btn-secondary text-sm px-5 py-2.5 inline-flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>{t('home.ctaMap')}</span>
            </Link>
            <Link
              to="/track"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Search className="h-4 w-4 text-cyan-400" />
              <span>{t('home.ctaTrack')}</span>
            </Link>
          </div>


          {/* Live System Analytics: Pie Chart & Bar Chart */}
          <div className="mt-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">

            {/* 1. Complaints by Road Classification Donut Chart */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {t('home.charts.roadTypeTitle', 'Complaints by Road Classification')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('home.charts.roadTypeDesc', 'Jurisdiction distribution across highways & streets')}
                  </p>
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
                    {t('home.charts.damageTypeTitle', 'AI Detected Road Damage Types')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('home.charts.damageTypeDesc', 'Potholes, cracks & surface degradation')}
                  </p>
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
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            {t('home.features.sectionTag', 'Core Capabilities')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            {t('home.features.sectionTitle', 'Engineered for Modern Road Governance')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            {t('home.features.sectionDesc', 'Key technologies that drive intelligent detection, spatial routing, and repair accountability.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {platformFeatures.map((feat) => {
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
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {t('home.lifecycle.sectionTag', 'Operational Pipeline')}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-1">
              {t('home.lifecycle.sectionTitle', 'Four-Step Road Repair Lifecycle')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('home.lifecycle.sectionDesc', 'Seamless end-to-end orchestration connecting citizens, computer vision, authorities, and field engineers.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {lifecycleSteps.map((step) => {
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


      {/* 5. COVERED ROAD AUTHORITIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t('home.authorities.sectionTag', 'Multi-Tier Administration')}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mt-1">
                {t('home.authorities.sectionTitle', 'Covered Road Authority Ecosystem')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('home.authorities.sectionDesc', 'Automated jurisdictional routing matching road classes to the responsible governing department.')}
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              {t('home.authorities.viewBoundaries', 'View GIS Authority Boundaries')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roadAuthorities.map((auth) => (
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
            {t('home.ctaBannerTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 max-w-xl mx-auto leading-relaxed">
            {t('home.ctaBannerDesc')}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/citizen/report"
              className="btn-primary text-sm px-6 py-3 shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>{t('home.ctaBannerBtn')}</span>
            </Link>
            <Link
              to="/map"
              className="btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>{t('home.ctaMap')}</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
