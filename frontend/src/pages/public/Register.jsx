import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Building,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import {
  validateEmail,
  evaluatePassword,
  validatePhone,
  parseAuthError
} from '../../utils/authValidation';
import { useLanguage } from '../../context/LanguageContext';

const DISTRICT_SUGGESTIONS = [
  'Mumbai Suburban',
  'Mumbai City',
  'Pune',
  'Thane',
  'Navi Mumbai',
  'Nashik',
  'Nagpur',
  'Aurangabad',
  'Solapur',
  'Kolhapur',
];

const Register = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    password: '',
    confirm_password: '',
  });

  const [termsAgreed, setTermsAgreed] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field errors and touch status
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic password evaluation
  const passwordEval = evaluatePassword(formData.password);

  const validateField = (field, value, allData = formData) => {
    switch (field) {
      case 'full_name':
        if (!value || !value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        return null;

      case 'email':
        return validateEmail(value);

      case 'phone':
        return validatePhone(value);

      case 'district':
        if (!value || !value.trim()) return 'District is required.';
        return null;

      case 'state':
        if (!value || !value.trim()) return 'State is required.';
        return null;

      case 'password': {
        const evalRes = evaluatePassword(value);
        if (evalRes.error) return evalRes.error;
        return null;
      }

      case 'confirm_password':
        if (!value) return 'Please confirm your password.';
        if (value !== allData.password) return 'Passwords do not match.';
        return null;

      case 'terms':
        if (!termsAgreed) return 'You must agree to the civic participation terms.';
        return null;

      default:
        return null;
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (serverError) setServerError('');

    // Revalidate if field has been touched
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, updated) }));
    }

    // If changing password, also revalidate confirm_password if already touched
    if (name === 'password' && touched.confirm_password) {
      setErrors((prev) => ({
        ...prev,
        confirm_password: validateField('confirm_password', updated.confirm_password, updated)
      }));
    }
  };

  // Duplicate-submit prevention and registration execution
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submit
    if (loading) return;

    // Validate all fields
    const fields = ['full_name', 'email', 'phone', 'district', 'state', 'password', 'confirm_password'];
    const newErrors = {};

    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });

    if (!termsAgreed) {
      newErrors.terms = 'You must agree to the civic participation terms.';
    }

    const allTouched = fields.reduce((acc, f) => ({ ...acc, [f]: true }), { terms: true });
    setTouched(allTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Focus first erroneous input
      const firstError = Object.keys(newErrors)[0];
      const elem = document.getElementById(`register-${firstError.replace('_', '-')}`);
      elem?.focus();
      return;
    }

    setServerError('');
    setLoading(true);

    try {
      // Call actual registration endpoint via AuthContext
      await register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        confirm_password: formData.confirm_password,
        district: formData.district.trim(),
        state: formData.state.trim(),
        role: 'CITIZEN',
      });

      // On successful registration, redirect to verify-email
      navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}&registered=true`);
    } catch (err) {
      const parsed = parseAuthError(err, 'Registration failed. Please check your details and try again.');
      setServerError(parsed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-10 relative">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-xl space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 border border-amber-500/30 items-center justify-center text-amber-400 mb-1 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
            <UserPlus className="h-8 w-8 text-amber-400 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            {t('auth.registerTitle', 'Citizen Registration')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {t('auth.registerSubtitle', 'Join the civic network to report road hazards, verify AI detections, and track municipal repairs in real-time')}
          </p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6 relative">

          {/* Civic Trust Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">{t('auth.roleCitizen', 'Civic Citizen Account')}</span>
              <span className="text-[11px]">{t('auth.citizenPortalDesc', 'Free access to report road defects and view verified GIS resolution logs')}</span>
            </div>
          </div>

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
                  <p className="font-semibold text-rose-200">Registration Error</p>
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

          {/* REGISTRATION FORM */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Full Name Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="register-full-name" className="block text-xs font-semibold text-slate-300">
                  {t('auth.fullNameLabel', 'Full Name')} <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                </label>
                {touched.full_name && !errors.full_name && formData.full_name && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Valid
                  </span>
                )}
              </div>

              <div
                className={`relative rounded-xl bg-slate-950 border transition-all ${
                  errors.full_name && touched.full_name
                    ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                    : 'border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                }`}
              >
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="register-full-name"
                  type="text"
                  required
                  name="full_name"
                  autoComplete="name"
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('full_name')}
                  placeholder={t('auth.fullNamePlaceholder', 'e.g. Rahul Sharma')}
                  aria-required="true"
                  aria-invalid={!!(errors.full_name && touched.full_name)}
                  aria-describedby={errors.full_name && touched.full_name ? 'register-full-name-error' : undefined}
                  className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              {errors.full_name && touched.full_name && (
                <p id="register-full-name-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.full_name}</span>
                </p>
              )}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Email Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="register-email" className="block text-xs font-semibold text-slate-300">
                    {t('auth.emailLabel', 'Email Address')} <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                  </label>
                  {touched.email && !errors.email && formData.email && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Valid
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
                    id="register-email"
                    type="email"
                    required
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    placeholder={t('auth.emailPlaceholder', 'name@example.com')}
                    aria-required="true"
                    aria-invalid={!!(errors.email && touched.email)}
                    aria-describedby={errors.email && touched.email ? 'register-email-error' : undefined}
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>

                {errors.email && touched.email && (
                  <p id="register-email-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="register-phone" className="block text-xs font-semibold text-slate-300">
                    {t('auth.phoneLabel', 'Mobile Phone')}
                  </label>
                  {touched.phone && !errors.phone && formData.phone && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Valid
                    </span>
                  )}
                </div>

                <div
                  className={`relative rounded-xl bg-slate-950 border transition-all ${
                    errors.phone && touched.phone
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                      : 'border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                  }`}
                >
                  <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="register-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                    placeholder={t('auth.phonePlaceholder', 'e.g. 9876543210')}
                    aria-invalid={!!(errors.phone && touched.phone)}
                    aria-describedby={errors.phone && touched.phone ? 'register-phone-error' : undefined}
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>

                {errors.phone && touched.phone && (
                  <p id="register-phone-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

            </div>

            {/* District & State Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* District Field with Quick Suggestions */}
              <div>
                <label htmlFor="register-district" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('auth.districtLabel', 'District / City')} <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                </label>

                <div
                  className={`relative rounded-xl bg-slate-950 border transition-all ${
                    errors.district && touched.district
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                      : 'border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                  }`}
                >
                  <MapPin className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="register-district"
                    type="text"
                    required
                    name="district"
                    list="district-list"
                    value={formData.district}
                    onChange={handleChange}
                    onBlur={() => handleBlur('district')}
                    placeholder={t('auth.districtPlaceholder', 'e.g. Mumbai Suburban')}
                    aria-required="true"
                    aria-invalid={!!(errors.district && touched.district)}
                    aria-describedby={errors.district && touched.district ? 'register-district-error' : undefined}
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    disabled={loading}
                  />
                  <datalist id="district-list">
                    {DISTRICT_SUGGESTIONS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                {errors.district && touched.district && (
                  <p id="register-district-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.district}</span>
                  </p>
                )}
              </div>

              {/* State Field */}
              <div>
                <label htmlFor="register-state" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('auth.stateLabel', 'State / Region')} <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                </label>

                <div
                  className={`relative rounded-xl bg-slate-950 border transition-all ${
                    errors.state && touched.state
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                      : 'border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                  }`}
                >
                  <Building className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="register-state"
                    type="text"
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    onBlur={() => handleBlur('state')}
                    placeholder={t('auth.statePlaceholder', 'e.g. Maharashtra')}
                    aria-required="true"
                    aria-invalid={!!(errors.state && touched.state)}
                    aria-describedby={errors.state && touched.state ? 'register-state-error' : undefined}
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>

                {errors.state && touched.state && (
                  <p id="register-state-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.state}</span>
                  </p>
                )}
              </div>

            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="register-password" className="block text-xs font-semibold text-slate-300">
                    {t('auth.passwordLabel', 'Create Password')} <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Min. 8 chars
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
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    aria-required="true"
                    aria-invalid={!!(errors.password && touched.password)}
                    aria-describedby="register-password-rules"
                    className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.password && touched.password && (
                  <p id="register-password-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div id="register-password-rules" className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-semibold ${passwordEval.color.split(' ')[1]}`}>
                        {passwordEval.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-800">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-full rounded-full transition-colors ${
                            passwordEval.score >= lvl ? passwordEval.color.split(' ')[0] : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-400">
                      <span className={`flex items-center gap-1 ${passwordEval.rules.minLength ? 'text-emerald-400' : ''}`}>
                        {passwordEval.rules.minLength ? '✓' : '•'} 8+ chars
                      </span>
                      <span className={`flex items-center gap-1 ${passwordEval.rules.hasUpper ? 'text-emerald-400' : ''}`}>
                        {passwordEval.rules.hasUpper ? '✓' : '•'} Uppercase
                      </span>
                      <span className={`flex items-center gap-1 ${passwordEval.rules.hasLower ? 'text-emerald-400' : ''}`}>
                        {passwordEval.rules.hasLower ? '✓' : '•'} Lowercase
                      </span>
                      <span className={`flex items-center gap-1 ${passwordEval.rules.hasNumber ? 'text-emerald-400' : ''}`}>
                        {passwordEval.rules.hasNumber ? '✓' : '•'} Number
                      </span>
                      <span className={`col-span-2 flex items-center gap-1 ${passwordEval.rules.hasSpecial ? 'text-emerald-400' : ''}`}>
                        {passwordEval.rules.hasSpecial ? '✓' : '•'} Symbol (!@#$% etc.)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-slate-300">
                    {t('auth.confirmPasswordLabel', 'Confirm Password')} <span className="text-amber-400 ml-1" aria-hidden="true">*</span>
                  </label>
                  {formData.confirm_password && formData.password === formData.confirm_password && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3" /> Match
                    </span>
                  )}
                </div>

                <div
                  className={`relative rounded-xl bg-slate-950 border transition-all ${
                    errors.confirm_password && touched.confirm_password
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                      : 'border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
                  }`}
                >
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    name="confirm_password"
                    autoComplete="new-password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirm_password')}
                    placeholder="••••••••"
                    aria-required="true"
                    aria-invalid={!!(errors.confirm_password && touched.confirm_password)}
                    aria-describedby={errors.confirm_password && touched.confirm_password ? 'register-confirm-password-error' : undefined}
                    className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.confirm_password && touched.confirm_password && (
                  <p id="register-confirm-password-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.confirm_password}</span>
                  </p>
                )}
              </div>

            </div>

            {/* Terms and Civic Responsibility Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="register-terms"
                  checked={termsAgreed}
                  onChange={(e) => {
                    setTermsAgreed(e.target.checked);
                    if (e.target.checked && errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: null }));
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  {t('auth.termsText', 'I agree to provide authentic and accurate road defect observations to support municipal infrastructure repairs and civic safety.')}
                </span>
              </label>

              {errors.terms && touched.terms && (
                <p role="alert" className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.terms}</span>
                </p>
              )}
            </div>

            {/* Submit Button with Loading Indicator and Duplicate-Submit Prevention */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>{t('auth.registering', 'Creating Citizen Account...')}</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 text-slate-950" />
                  <span>{t('auth.registerButton', 'Create Citizen Account')}</span>
                </>
              )}
            </button>

          </form>

          {/* Footer Navigation */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            {t('auth.haveAccount', 'Already registered?')}{' '}
            <Link
              to="/login"
              className="text-amber-400 hover:text-amber-300 font-semibold focus:outline-none focus-visible:underline"
            >
              {t('nav.login', 'Sign In Here')}
            </Link>
          </div>

          {/* Security & System Assurance */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500/70" />
            <span>Encrypted Registration • RoadGuard AI Civic Infrastructure</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Register;
