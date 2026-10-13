import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  X
} from 'lucide-react';
import { validateEmail, parseAuthError } from '../../utils/authValidation';

const AUTHORITIES = [
  {
    id: 'nhai',
    label: 'NHAI Highway',
    name: 'National Highways Authority of India (NHAI)',
    tag: 'National Highways',
    email: 'nhai@roadguard.ai',
    color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10',
    activeColor: 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50'
  },
  {
    id: 'pwd',
    label: 'State PWD',
    name: 'Maharashtra State Highway & PWD Authority',
    tag: 'State Highways',
    email: 'pwd@roadguard.ai',
    color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10',
    activeColor: 'bg-indigo-500/20 border-indigo-400 text-indigo-300 ring-1 ring-indigo-400/50'
  },
  {
    id: 'bmc',
    label: 'Municipal BMC',
    name: 'Brihanmumbai Municipal Corporation (BMC)',
    tag: 'City / Municipal',
    email: 'municipal@roadguard.ai',
    color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10',
    activeColor: 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50'
  },
  {
    id: 'pmgsy',
    label: 'Rural PMGSY',
    name: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
    tag: 'Rural Roads',
    email: 'pmgsy@roadguard.ai',
    color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10',
    activeColor: 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
  },
  {
    id: 'engineer',
    label: 'Field Engineer',
    name: 'Authorized Field Engineer Inspection Team',
    tag: 'Field Operations',
    email: 'engineer@roadguard.ai',
    color: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10',
    activeColor: 'bg-purple-500/20 border-purple-400 text-purple-300 ring-1 ring-purple-400/50'
  },
  {
    id: 'admin',
    label: 'System Admin',
    name: 'RoadGuard Central Governance & Administration',
    tag: 'Central Control',
    email: 'admin@roadguard.ai',
    color: 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10',
    activeColor: 'bg-rose-500/20 border-rose-400 text-rose-300 ring-1 ring-rose-400/50'
  },
];

const SAVED_EMAIL_KEY = 'roadguard_saved_email';

const Login = () => {
  const { login } = useAuth();
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

  const from = location.state?.from?.pathname || '/';

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

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-10 relative">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-lg space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 border border-amber-500/30 items-center justify-center text-amber-400 mb-1 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
            <ShieldAlert className="h-8 w-8 text-amber-400 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            Welcome to RoadGuard<span className="text-amber-500 ml-1">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Civil Infrastructure & AI-Driven Road Damage Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6 relative">

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
              <span>Citizen Portal</span>
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
              <span>Authority & Staff</span>
            </button>
          </div>

          {/* AUTHORITY MODE CONTEXT & DEPARTMENT SELECTOR */}
          {loginType === 'authority' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 animate-in fade-in duration-200">
              {/* Active Authority Display Banner */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Signing in as Authority:</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white truncate" title={selectedAuthority.name}>
                    {selectedAuthority.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Official Account: <span className="text-slate-300 font-mono">{selectedAuthority.email}</span>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedAuthority.tag}
                </span>
              </div>

              {/* Authority Selection Grid */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Select Department / Role:
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
                  <span className="font-semibold text-slate-200 block">Citizen Portal</span>
                  <span className="text-[11px]">Report road hazards, view AI metrics & track municipal repairs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFillDemoCitizen}
                className="shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="Fill demo credentials for instant testing"
              >
                Demo Fill
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
                  {loginType === 'authority' ? 'Official Authority Email' : 'Citizen Email Address'}
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
                  Password
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
                <span>Remember my email</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Encrypted JWT session
              </span>
            </div>

            {/* Submit Button with Loading Indicator and Duplicate-Submit Prevention */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Authenticating with RoadGuard...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 text-slate-950" />
                  <span>
                    {loginType === 'authority'
                      ? `Sign In as ${selectedAuthority.label}`
                      : 'Sign In to Citizen Portal'}
                  </span>
                </>
              )}
            </button>

          </form>

          {/* Footer Navigation */}
          {loginType === 'citizen' ? (
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              Don't have a citizen account yet?{' '}
              <Link
                to="/register"
                className="text-amber-400 hover:text-amber-300 font-semibold focus:outline-none focus-visible:underline"
              >
                Register Here
              </Link>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2">
              <span>Citizen reporting defects?</span>
              <button
                type="button"
                onClick={() => handleSelectLoginType('citizen')}
                className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 focus:outline-none focus-visible:underline"
              >
                Switch to Citizen Login <ChevronRight className="h-3 w-3" />
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
    </div>
  );
};

export default Login;
