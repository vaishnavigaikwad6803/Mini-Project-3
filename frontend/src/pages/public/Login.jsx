import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import {
  ShieldAlert,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  User,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  HardHat,
  ShieldCheck,
  ChevronRight,
  Info,
  CheckCircle2,
  Sparkles,
  X,
  BarChart3,
  TrendingUp,
  Cpu,
  Layers,
  Flame,
  Activity,
  MapPin,
  Check,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { validateEmail, parseAuthError } from '../../utils/authValidation';
import { useLanguage } from '../../context/LanguageContext';

const AUTHORITIES = [
  {
    id: 'nhai',
    label: 'NHAI Highway',
    name: 'National Highways Authority of India (NHAI)',
    tag: 'National Highways',
    email: 'nhai@roadguard.ai',
    color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10',
    activeColor: 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50',
    chartColor: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    id: 'pwd',
    label: 'State PWD',
    name: 'Maharashtra State Highway & PWD Authority',
    tag: 'State Highways',
    email: 'pwd@roadguard.ai',
    color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10',
    activeColor: 'bg-indigo-500/20 border-indigo-400 text-indigo-300 ring-1 ring-indigo-400/50',
    chartColor: '#6366f1',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'bmc',
    label: 'Municipal BMC',
    name: 'Brihanmumbai Municipal Corporation (BMC)',
    tag: 'City / Municipal',
    email: 'municipal@roadguard.ai',
    color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10',
    activeColor: 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50',
    chartColor: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'pmgsy',
    label: 'Rural PMGSY',
    name: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
    tag: 'Rural Roads',
    email: 'pmgsy@roadguard.ai',
    color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10',
    activeColor: 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50',
    chartColor: '#10b981',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'engineer',
    label: 'Field Engineer',
    name: 'Authorized Field Engineer Inspection Team',
    tag: 'Field Operations',
    email: 'engineer@roadguard.ai',
    color: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10',
    activeColor: 'bg-purple-500/20 border-purple-400 text-purple-300 ring-1 ring-purple-400/50',
    chartColor: '#a855f7',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'admin',
    label: 'System Admin',
    name: 'RoadGuard Central Governance & Administration',
    tag: 'Central Control',
    email: 'admin@roadguard.ai',
    color: 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10',
    activeColor: 'bg-rose-500/20 border-rose-400 text-rose-300 ring-1 ring-rose-400/50',
    chartColor: '#f43f5e',
    gradient: 'from-rose-500 to-red-500'
  },
];

const SAVED_EMAIL_KEY = 'roadguard_saved_email';

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial login option from query param or state, default to citizen
  const initialType =
    searchParams.get('type') === 'authority' || location.state?.type === 'authority'
      ? 'authority'
      : 'citizen';

  const [loginType, setLoginType] = useState(initialType);
  const [selectedAuthority, setSelectedAuthority] = useState(AUTHORITIES[0]);

  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & UI State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Telemetry & Visual Analytics State
  const [publicAnalytics, setPublicAnalytics] = useState(null);
  const [analyticsTab, setAnalyticsTab] = useState('status'); // 'status' | 'defects' | 'trends'

  const from = location.state?.from?.pathname || '/';

  // Load public telemetry on mount
  useEffect(() => {
    complaintService.getPublicAnalytics()
      .then((data) => setPublicAnalytics(data))
      .catch(() => {});
  }, []);

  // Load saved email or initial defaults on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberEmail(true);
    } else {
      if (initialType === 'authority') {
        setEmail(AUTHORITIES[0].email);
        setPassword('password123');
      } else {
        setEmail('citizen@roadguard.ai');
        setPassword('password123');
      }
    }
  }, []);

  // Sync with searchParams if url changes
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'authority' && loginType !== 'authority') {
      setLoginType('authority');
      setEmail(selectedAuthority.email);
      setPassword('password123');
    } else if (!typeParam && loginType === 'authority' && !location.state?.type) {
      setLoginType('citizen');
    }
  }, [searchParams]);

  // Handle switching between the two primary login options
  const handleSelectLoginType = (type) => {
    setLoginType(type);
    setServerError('');
    setErrors({});
    setTouched({});

    if (type === 'citizen') {
      const saved = localStorage.getItem(SAVED_EMAIL_KEY);
      setEmail(saved || 'citizen@roadguard.ai');
      setPassword('password123');
      setSearchParams({});
    } else {
      setEmail(selectedAuthority.email);
      setPassword('password123');
      setSearchParams({ type: 'authority' });
    }
  };

  // Handle selecting which authority is logging in
  const handleSelectAuthority = (auth) => {
    setSelectedAuthority(auth);
    setEmail(auth.email);
    setPassword('password123');
    setServerError('');
    setErrors({});
  };

  // Quick fill citizen demo helper
  const handleFillDemoCitizen = () => {
    setEmail('citizen@roadguard.ai');
    setPassword('password123');
    setErrors({});
    setServerError('');
  };

  // Field level validation
  const validateField = (field, value) => {
    if (field === 'email') {
      return validateEmail(value);
    }
    if (field === 'password') {
      if (!value) return 'Password is required.';
      if (value.length < 6) return 'Password must be at least 6 characters.';
      return null;
    }
    return null;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    const errorMsg = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (serverError) setServerError('');
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateField('email', val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (serverError) setServerError('');
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', val) }));
    }
  };

  // Duplicate-submit prevention and authentication execution
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submission
    if (loading) return;

    // Run client-side validation
    const emailErr = validateField('email', email);
    const passwordErr = validateField('password', password);

    const newErrors = {};
    if (emailErr) newErrors.email = emailErr;
    if (passwordErr) newErrors.password = passwordErr;

    setTouched({ email: true, password: true });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Focus first error field
      const firstErrorField = newErrors.email ? 'login-email' : 'login-password';
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setServerError('');
    setLoading(true);

    try {
      // Real API authentication call via AuthContext
      const user = await login(email.trim(), password);

      // Handle remember email preference (never store plaintext password)
      if (rememberEmail) {
        localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }

      // Role-based destination redirect
      if (from !== '/') {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'AUTHORITY') navigate('/authority');
        else if (user.role === 'ENGINEER') navigate('/engineer');
        else navigate('/citizen');
      }
    } catch (err) {
      const parsed = parseAuthError(err, 'Invalid email or password. Please try again.');
      setServerError(parsed);
    } finally {
      setLoading(false);
    }
  };

  // Computations for Active Role Telemetry & Visual Analytics
  const totalSystemComplaints = publicAnalytics?.stats?.total_complaints || 42;
  const completedRepairs = publicAnalytics?.stats?.completed_repairs || 31;
  const activeRepairs = publicAnalytics?.stats?.active_repairs || 11;
  const resolutionPct = totalSystemComplaints > 0
    ? Math.round((completedRepairs / totalSystemComplaints) * 100)
    : 74;

  const isCitizen = loginType === 'citizen';
  const activeKey = isCitizen ? 'citizen' : selectedAuthority.id;

  const roleMeta = {
    citizen: {
      title: 'Citizen Civic Telemetry & Road Health',
      subtitle: 'Public crowdsourced road hazard reports, AI severity verification, and municipal repair status across Maharashtra.',
      kpis: [
        { label: 'Citizen Reports', value: totalSystemComplaints, sub: 'Total Logged', color: 'text-amber-400' },
        { label: 'Repairs Completed', value: completedRepairs, sub: 'Potholes Fixed', color: 'text-emerald-400' },
        { label: 'Resolution Rate', value: `${resolutionPct}%`, sub: 'Velocity Index', color: 'text-teal-400' },
        { label: 'Public SLA', value: '< 48h', sub: 'Target Turnaround', color: 'text-cyan-400' },
      ],
      description: 'Citizens can report road hazards in under 30 seconds with automated device GPS geocoding, YOLOv8 computer vision classification, and instant SMS repair alerts.'
    },
    nhai: {
      title: 'NHAI National Highway Intelligence',
      subtitle: 'Expressways, Golden Quadrilateral corridors, and high-speed carriageway structural pavement metrics.',
      kpis: [
        { label: 'Highway Defects', value: Math.round(totalSystemComplaints * 0.32), sub: 'Active Corridors', color: 'text-amber-400' },
        { label: 'Corridor Repairs', value: Math.round(completedRepairs * 0.35), sub: 'NHAI Certified', color: 'text-emerald-400' },
        { label: 'Highway Index', value: '94.2%', sub: 'Pavement Quality', color: 'text-amber-300' },
        { label: 'Express SLA', value: '< 24h', sub: 'Lane Safety Rule', color: 'text-orange-400' },
      ],
      description: 'National Highways Authority of India (NHAI) engineers monitor expressway pavement condition, toll road defect routing, and heavy freight lane safety.'
    },
    pwd: {
      title: 'Maharashtra State PWD Arterials',
      subtitle: 'Inter-district arterial highways, divisional road infrastructure, and state bridge structural maintenance.',
      kpis: [
        { label: 'State Highways', value: Math.round(totalSystemComplaints * 0.38), sub: 'Divisional Reports', color: 'text-indigo-400' },
        { label: 'Roads Resurfaced', value: Math.round(completedRepairs * 0.36), sub: 'PWD Verified', color: 'text-emerald-400' },
        { label: 'Divisional SLA', value: '89.5%', sub: 'On-Time Fixes', color: 'text-indigo-300' },
        { label: 'Avg Restoration', value: '3.4d', sub: 'Mean Repair Days', color: 'text-teal-400' },
      ],
      description: 'Maharashtra Public Works Department coordinates territorial road repair tenders, inter-district highway resurfacing, and divisional engineer task allocation.'
    },
    bmc: {
      title: 'Brihanmumbai Municipal Corporation (BMC)',
      subtitle: 'Urban city avenues, flyover ramps, storm water road integrity, and emergency monsoon pothole response.',
      kpis: [
        { label: 'Urban Complaints', value: Math.round(totalSystemComplaints * 0.22), sub: 'BMC Ward Reports', color: 'text-cyan-400' },
        { label: 'Patched Potholes', value: Math.round(completedRepairs * 0.20), sub: 'Cold Mix Repairs', color: 'text-emerald-400' },
        { label: 'Ward Resolution', value: '88.0%', sub: 'Municipal Index', color: 'text-cyan-300' },
        { label: 'Monsoon Patch SLA', value: '< 36h', sub: 'Rapid Response', color: 'text-amber-400' },
      ],
      description: 'Municipal engineering teams deploy cold mix asphalt patching, inspect storm drainage road perimeters, and resolve ward-level citizen grievances.'
    },
    pmgsy: {
      title: 'Rural PMGSY & Gram Sadak Network',
      subtitle: 'All-weather village road connectivity, farm-to-market pavement durability, and Zilla Parishad monitoring.',
      kpis: [
        { label: 'Village Roads', value: Math.max(3, Math.round(totalSystemComplaints * 0.08)), sub: 'Gram Panchayat', color: 'text-emerald-400' },
        { label: 'Roads Restored', value: Math.max(2, Math.round(completedRepairs * 0.09)), sub: 'ZP Verified', color: 'text-teal-400' },
        { label: 'Connectivity', value: '92.8%', sub: 'All-Weather Pass', color: 'text-emerald-300' },
        { label: 'Inspection Audit', value: '100%', sub: 'Field Audited', color: 'text-green-400' },
      ],
      description: 'Pradhan Mantri Gram Sadak Yojana (PMGSY) ensures rural village transit corridors withstand heavy monsoon cycles and support agricultural supply chains.'
    },
    engineer: {
      title: 'Field Operations & Engineering Telemetry',
      subtitle: 'On-ground task queue, mobile GPS geofenced photo inspection, material batching, and sign-off.',
      kpis: [
        { label: 'Active Work Orders', value: activeRepairs, sub: 'In Work Queue', color: 'text-purple-400' },
        { label: 'Certified Sites', value: completedRepairs, sub: 'Inspection Passes', color: 'text-emerald-400' },
        { label: 'Quality Pass Rate', value: '96.8%', sub: 'First-time Pass', color: 'text-purple-300' },
        { label: 'Site Turnaround', value: '1.8h', sub: 'Avg Field Visit', color: 'text-amber-400' },
      ],
      description: 'Field engineers utilize mobile GPS-stamped before-and-after photo capture, verify bitumen and cold mix materials, and sign off on completed civil road works.'
    },
    admin: {
      title: 'Central Governance & AI Infrastructure Command',
      subtitle: 'Statewide macro telemetry, multi-agency authority performance benchmarking, and AI vision inference health.',
      kpis: [
        { label: 'Total Complaints', value: totalSystemComplaints, sub: 'Statewide Intake', color: 'text-rose-400' },
        { label: 'Repairs Verified', value: completedRepairs, sub: 'System Cleared', color: 'text-emerald-400' },
        { label: 'Cross-Agency Rate', value: `${resolutionPct}%`, sub: 'Overall Index', color: 'text-rose-300' },
        { label: 'AI Confidence', value: `${Math.round((publicAnalytics?.stats?.avg_ai_confidence || 0.88) * 100)}%`, sub: 'YOLOv8 Accuracy', color: 'text-amber-400' },
      ],
      description: 'Central administrators manage multi-tier role permissions, inspect state road telemetry, reallocate divisional civil budgets, and monitor YOLOv8 computer vision health.'
    }
  };

  const activeMeta = roleMeta[activeKey] || roleMeta.citizen;

  // Donut Chart Stage Data
  const getStageChartData = () => {
    if (isCitizen) {
      return [
        { name: 'Damage Reported', count: publicAnalytics?.stats?.pending_complaints || 12, color: '#f59e0b' },
        { name: 'Under Review', count: 8, color: '#6366f1' },
        { name: 'In Repair', count: activeRepairs, color: '#a855f7' },
        { name: 'Resolved & Verified', count: completedRepairs, color: '#10b981' },
      ];
    }
    const id = selectedAuthority.id;
    if (id === 'nhai') {
      return [
        { name: 'Corridor Inspection', count: 3, color: '#f59e0b' },
        { name: 'Resurfacing Work', count: 5, color: '#3b82f6' },
        { name: 'Structural Verification', count: 2, color: '#a855f7' },
        { name: 'Corridors Restored', count: 12, color: '#10b981' },
      ];
    }
    if (id === 'pwd') {
      return [
        { name: 'Divisional Review', count: 4, color: '#6366f1' },
        { name: 'Road Resurfacing', count: 6, color: '#06b6d4' },
        { name: 'Quality Inspection', count: 3, color: '#eab308' },
        { name: 'State Roads Fixed', count: 15, color: '#10b981' },
      ];
    }
    if (id === 'bmc') {
      return [
        { name: 'Ward Review', count: 5, color: '#06b6d4' },
        { name: 'Cold Mix Patching', count: 6, color: '#f97316' },
        { name: 'Ward Sign-off', count: 2, color: '#a855f7' },
        { name: 'City Roads Cleared', count: 14, color: '#10b981' },
      ];
    }
    if (id === 'pmgsy') {
      return [
        { name: 'GP Intake', count: 2, color: '#10b981' },
        { name: 'Rural Patching', count: 3, color: '#f59e0b' },
        { name: 'ZP Verification', count: 1, color: '#6366f1' },
        { name: 'Village Roads Fixed', count: 7, color: '#14b8a6' },
      ];
    }
    if (id === 'engineer') {
      return [
        { name: 'Assigned Work Orders', count: 4, color: '#a855f7' },
        { name: 'Site Inspection Complete', count: 3, color: '#3b82f6' },
        { name: 'Repair In Progress', count: 5, color: '#f59e0b' },
        { name: 'Certified & Closed', count: 18, color: '#10b981' },
      ];
    }
    // Admin comparative distribution
    return [
      { name: 'NHAI Highway', count: 28, color: '#f59e0b' },
      { name: 'State PWD', count: 35, color: '#6366f1' },
      { name: 'BMC City', count: 25, color: '#06b6d4' },
      { name: 'PMGSY Rural', count: 14, color: '#10b981' },
    ];
  };

  const stageChartData = getStageChartData();

  // Admin comparative bar data
  const adminComparisonData = [
    { authority: 'NHAI', assigned: 28, completed: 22 },
    { authority: 'State PWD', assigned: 35, completed: 27 },
    { authority: 'BMC City', assigned: 25, completed: 21 },
    { authority: 'PMGSY Rural', assigned: 14, completed: 11 },
  ];

  // AI Damage Type Distribution
  const damageDistributionData = publicAnalytics?.damage_type_distribution && publicAnalytics.damage_type_distribution.length > 0
    ? publicAnalytics.damage_type_distribution
    : [
        { name: 'Pothole', count: 28 },
        { name: 'Surface Damage', count: 18 },
        { name: 'Alligator Crack', count: 12 },
        { name: 'Longitudinal Crack', count: 7 },
        { name: 'Transverse Crack', count: 4 },
      ];

  // Monthly Activity Trends
  const monthlyTrendsData = publicAnalytics?.monthly_trends && publicAnalytics.monthly_trends.length > 0
    ? publicAnalytics.monthly_trends
    : [
        { month: 'Oct', complaints: 18, resolved: 14 },
        { month: 'Nov', complaints: 24, resolved: 20 },
        { month: 'Dec', complaints: 32, resolved: 28 },
        { month: 'Jan', complaints: 45, resolved: 38 },
        { month: 'Feb', complaints: 39, resolved: 34 },
        { month: 'Mar', complaints: 48, resolved: 41 },
      ];

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-8 relative">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto space-y-6">

        {/* Brand Header for Mobile / Tablet */}
        <div className="text-center space-y-1.5 lg:hidden">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 border border-amber-500/30 items-center justify-center text-amber-400 mb-1 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
            <ShieldAlert className="h-6 w-6 text-amber-400 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] tracking-tight">
            {t('auth.brandTitle', 'Welcome to RoadGuard AI')}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t('auth.brandSubtitle', 'Civil Infrastructure & AI-Driven Road Damage Management System')}
          </p>
        </div>

        {/* 2-COLUMN RESPONSIVE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: BRAND HEADER (DESKTOP) + AUTHENTICATION FORM CARD */}
          <div className="lg:col-span-5 space-y-5">

            {/* Desktop Brand Header */}
            <div className="hidden lg:block space-y-1.5">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 border border-amber-500/30 items-center justify-center text-amber-400 mb-0.5 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
                <ShieldAlert className="h-6 w-6 text-amber-400 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl xl:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
                {t('auth.brandTitle', 'Welcome to RoadGuard AI')}
              </h1>
              <p className="text-xs text-slate-400">
                {t('auth.brandSubtitle', 'Civil Infrastructure & AI-Driven Road Damage Management System')}
              </p>
            </div>

            {/* Login Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5 relative">

              {/* TWO PRIMARY LOGIN OPTIONS: CITIZEN LOGIN & AUTHORITY LOGIN */}
              <div
                role="tablist"
                aria-label="Portal Selection"
                className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner"
              >
                <button
                  type="button"
                  role="tab"
                  id="citizen-login-tab"
                  aria-selected={loginType === 'citizen'}
                  aria-controls="login-form-panel"
                  onClick={() => handleSelectLoginType('citizen')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    loginType === 'citizen'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{t('auth.roleCitizen')}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="authority-login-tab"
                  aria-selected={loginType === 'authority'}
                  aria-controls="login-form-panel"
                  onClick={() => handleSelectLoginType('authority')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    loginType === 'authority'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>{t('auth.roleAuthority')}</span>
                </button>
              </div>

              {/* AUTHORITY MODE CONTEXT & DEPARTMENT SELECTOR */}
              {loginType === 'authority' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 animate-in fade-in duration-200">
                  {/* Active Authority Display Banner */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{t('auth.signingInAs', 'Signing in as Authority:')}</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white truncate" title={selectedAuthority.name}>
                        {selectedAuthority.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {t('auth.officialAccount', 'Official Account:')} <span className="text-slate-300 font-mono">{selectedAuthority.email}</span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedAuthority.tag}
                    </span>
                  </div>

                  {/* Authority Selection Grid */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {t('auth.quickSelectDept', 'Quick Select Department / Role:')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {AUTHORITIES.map((auth) => {
                        const isSelected = selectedAuthority.id === auth.id;
                        return (
                          <button
                            key={auth.id}
                            type="button"
                            onClick={() => handleSelectAuthority(auth)}
                            className={`px-2.5 py-2 rounded-xl border text-[11px] font-medium transition-all text-left flex flex-col justify-between truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              isSelected
                                ? auth.activeColor
                                : `bg-slate-900/80 ${auth.color} text-slate-300`
                            }`}
                            title={`${auth.name} (${auth.email})`}
                          >
                            <span className="font-semibold truncate">{auth.label}</span>
                            <span className="text-[9px] opacity-70 truncate">{auth.tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CITIZEN MODE CONTEXT BANNER */}
              {loginType === 'citizen' && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block">{t('citizen.portalTitle', 'Citizen Portal')}</span>
                      <span className="text-[11px]">{t('auth.citizenPortalDesc', 'Report road hazards, view AI metrics & track municipal repairs')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemoCitizen}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    title="Fill demo credentials for instant testing"
                  >
                    {t('auth.demoFill', 'Demo Fill')}
                  </button>
                </div>
              )}

              {/* SERVER ERROR ALERT BANNER */}
              {serverError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-2.5 text-xs text-rose-300 animate-in fade-in duration-200"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-200">Authentication Failed</p>
                      <p className="mt-0.5 leading-relaxed">{serverError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServerError('')}
                    className="text-rose-400 hover:text-rose-200 p-1 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                    aria-label="Dismiss error"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* LOGIN FORM */}
              <form
                id="login-form-panel"
                onSubmit={handleSubmit}
                noValidate
                className="space-y-4"
              >

                {/* Email Field with Label and Validation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-semibold text-slate-300"
                    >
                      {loginType === 'authority' ? 'Official Authority Email' : t('auth.emailLabel')}
                      <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                    </label>
                    {touched.email && !errors.email && email && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Valid format
                      </span>
                    )}
                  </div>

                  <div
                    className={`relative rounded-xl bg-slate-950 border transition-all ${
                      errors.email && touched.email
                        ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                        : 'border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                    }`}
                  >
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => handleBlur('email')}
                      placeholder="name@example.com"
                      aria-required="true"
                      aria-invalid={!!(errors.email && touched.email)}
                      aria-describedby={errors.email && touched.email ? 'login-email-error' : undefined}
                      className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                      disabled={loading}
                    />
                  </div>

                  {errors.email && touched.email && (
                    <p
                      id="login-email-error"
                      role="alert"
                      className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password Field with Label, Visibility Toggle, and Validation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-300"
                    >
                      {t('auth.passwordLabel')}
                      <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Min. 6 characters
                    </span>
                  </div>

                  <div
                    className={`relative rounded-xl bg-slate-950 border transition-all ${
                      errors.password && touched.password
                        ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                        : 'border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                    }`}
                  >
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                      placeholder="••••••••"
                      aria-required="true"
                      aria-invalid={!!(errors.password && touched.password)}
                      aria-describedby={errors.password && touched.password ? 'login-password-error' : undefined}
                      className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {errors.password && touched.password && (
                    <p
                      id="login-password-error"
                      role="alert"
                      className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Remember Email Option */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="remember-email"
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>{t('auth.rememberEmail', 'Remember my email')}</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {t('auth.encryptedSession', 'Encrypted JWT session')}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>{t('auth.loggingIn')}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 text-slate-950" />
                      <span>
                        {loginType === 'authority'
                          ? `${t('nav.login')} as ${selectedAuthority.label}`
                          : t('auth.loginButton')}
                      </span>
                    </>
                  )}
                </button>

              </form>

              {/* Footer Navigation */}
              {loginType === 'citizen' ? (
                <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  {t('auth.noAccount')}{' '}
                  <Link
                    to="/register"
                    className="text-amber-400 hover:text-amber-300 font-semibold focus:outline-none focus-visible:underline"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2">
                  <span>{t('auth.citizenReporting', 'Citizen reporting defects?')}</span>
                  <button
                    type="button"
                    onClick={() => handleSelectLoginType('citizen')}
                    className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 focus:outline-none focus-visible:underline"
                  >
                    {t('auth.switchCitizen', 'Switch to Citizen Login')} <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Security & System Badge */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500/70" />
                <span>256-Bit Encrypted Authentication • RoadGuard AI Civic Infrastructure</span>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: LIVE ROLE TELEMETRY & VISUAL ANALYTICS SHOWCASE */}
          <div className="lg:col-span-7 space-y-5">

            {/* Showcase Header Card with Live Status Badge */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Activity className="h-4 w-4" />
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                      {activeMeta.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">
                    {activeMeta.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Telemetry
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                    {isCitizen ? 'Citizen Portal' : selectedAuthority.tag}
                  </span>
                </div>
              </div>

              {/* 4 DYNAMIC ROLE-BASED KPI CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {activeMeta.kpis.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 flex flex-col justify-between"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                      {kpi.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl sm:text-2xl font-black font-['Outfit'] ${kpi.color}`}>
                        {kpi.value}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                      {kpi.sub}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* INTERACTIVE CHART SHOWCASE CONTAINER */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">

              {/* View Selector Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAnalyticsTab('status')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      analyticsTab === 'status'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lifecycle & Stages
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsTab('defects')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      analyticsTab === 'defects'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AI Defect Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsTab('trends')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      analyticsTab === 'trends'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly Trajectory
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-amber-400" />
                  YOLOv8 AI Engine
                </span>
              </div>

              {/* TAB 1: LIFECYCLE & STAGE BREAKDOWN */}
              {analyticsTab === 'status' && (
                <div className="space-y-4 pt-1">
                  {/* If Admin: show comparative multi-agency bar chart */}
                  {!isCitizen && selectedAuthority.id === 'admin' ? (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="font-semibold text-slate-300">
                          Cross-Authority Workload Comparison
                        </span>
                        <span>Assigned vs Resolved Tasks</span>
                      </div>
                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={adminComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                            <XAxis dataKey="authority" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                            <ChartTooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }} />
                            <Bar dataKey="assigned" name="Assigned Work" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="completed" name="Completed Fixes" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    /* For Citizen & other Authorities: Donut chart with stage pills */
                    <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                      <div className="h-56 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stageChartData}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={76}
                              paddingAngle={4}
                            >
                              {stageChartData.map((entry, index) => (
                                <Cell key={`stage-cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend List */}
                      <div className="space-y-2">
                        {stageChartData.map((item) => {
                          const total = stageChartData.reduce((acc, c) => acc + c.count, 0);
                          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                          return (
                            <div
                              key={item.name}
                              className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-slate-300 font-medium truncate max-w-[130px]">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-white">{item.count}</span>
                                <span className="text-[10px] font-mono text-slate-400">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AI DEFECT TYPE BREAKDOWN */}
              {analyticsTab === 'defects' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300">
                      YOLOv8 Automated Defect Classification
                    </span>
                    <span>Statewide telemetry</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={damageDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="loginDamageGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar dataKey="count" name="Defects Cataloged" fill="url(#loginDamageGrad)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* TAB 3: MONTHLY INTAKE & RESOLUTION TRAJECTORY */}
              {analyticsTab === 'trends' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300">
                      6-Month Reporting Velocity vs Repairs Completed
                    </span>
                    <span className="text-emerald-400 font-medium">Trajectory Positive</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="loginCompGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="loginResGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }} />
                        <Area type="monotone" dataKey="complaints" name="Reported Defects" stroke="#f59e0b" strokeWidth={2} fill="url(#loginCompGrad)" />
                        <Area type="monotone" dataKey="resolved" name="Repairs Closed" stroke="#10b981" strokeWidth={2} fill="url(#loginResGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Role Scope & Capability Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200 block">
                    Portal Security & Operational Scope
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {activeMeta.description}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
