import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  ChevronLeft,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { evaluatePassword, validateEmail, parseAuthError } from '../../utils/authValidation';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const urlToken = searchParams.get('token') || '';
  const urlEmail = searchParams.get('email') || '';

  const [token, setToken] = useState(urlToken);
  const [email, setEmail] = useState(urlEmail);
  const [otp, setOtp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength evaluation
  const passwordEval = evaluatePassword(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  useEffect(() => {
    if (urlToken) setToken(urlToken);
    if (urlEmail) setEmail(urlEmail);
  }, [urlToken, urlEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setTouched({
      newPassword: true,
      confirmPassword: true,
      email: true,
      otp: true
    });

    // Validate inputs
    if (!token && (!email.trim() || !otp.trim())) {
      setServerError('Please provide either the reset link or both your email and the 6-digit reset code.');
      return;
    }

    if (!token && email.trim()) {
      const emailErr = validateEmail(email.trim());
      if (emailErr) {
        setServerError(emailErr);
        return;
      }
    }

    if (passwordEval.error) {
      setServerError(passwordEval.error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setServerError('Password confirmation does not match.');
      return;
    }

    setServerError('');
    setLoading(true);

    try {
      const payload = {
        new_password: newPassword,
        confirm_password: confirmPassword,
      };

      if (token) {
        payload.token = token;
      } else {
        payload.email = email.trim();
        payload.otp = otp.trim();
      }

      await resetPassword(payload);
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful! You can now log in with your new credentials.' }
        });
      }, 2000);
    } catch (err) {
      const parsed = parseAuthError(err, 'Failed to reset password. The link or code may have expired.');
      setServerError(parsed);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-12 relative">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/95 border border-emerald-500/30 shadow-2xl backdrop-blur-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 stroke-[2.2]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white font-['Outfit']">Password Reset Complete!</h1>
            <p className="text-sm text-slate-300">
              Your password has been securely updated and all previous sessions have been refreshed.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-2.5 px-4 rounded-xl border border-emerald-500/20">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting to Sign In...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-10 relative">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-md space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 border border-amber-500/30 items-center justify-center text-amber-400 mb-1 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
            <KeyRound className="h-8 w-8 text-amber-400 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            Set New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Choose a strong password with at least 8 characters including uppercase, lowercase, numbers, and symbols.
          </p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">

          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* If no URL token, allow manual email and 6-digit code entry */}
            {!token && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Manual Verification Details</span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="block text-xs font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your registered email"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-otp" className="block text-xs font-medium text-slate-300">
                    6-Digit Reset Code
                  </label>
                  <input
                    id="reset-otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code from email"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 font-mono tracking-widest text-center text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* New Password Input */}
            <div className="space-y-2">
              <label htmlFor="new-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (serverError) setServerError('');
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, newPassword: true }))}
                  placeholder="Create a strong new password"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Strength:</span>
                    <span className={`font-bold ${passwordEval.color.split(' ')[1]}`}>
                      {passwordEval.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 h-1.5 rounded-full overflow-hidden bg-slate-800">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-full rounded-full transition-all duration-300 ${
                          level <= passwordEval.score ? passwordEval.color.split(' ')[0] : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400">
                    <div className={`flex items-center gap-1 ${passwordEval.rules.minLength ? 'text-emerald-400' : ''}`}>
                      {passwordEval.rules.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>8+ Characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordEval.rules.hasUpper ? 'text-emerald-400' : ''}`}>
                      {passwordEval.rules.hasUpper ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordEval.rules.hasLower ? 'text-emerald-400' : ''}`}>
                      {passwordEval.rules.hasLower ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordEval.rules.hasNumber ? 'text-emerald-400' : ''}`}>
                      {passwordEval.rules.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1 col-span-2 ${passwordEval.rules.hasSpecial ? 'text-emerald-400' : ''}`}>
                      {passwordEval.rules.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>Special Symbol (!@#$% etc.)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirm-new-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="confirm-new-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (serverError) setServerError('');
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {confirmPassword && (
                <div className="flex items-center gap-1.5 text-xs pt-1">
                  {passwordsMatch ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Check className="h-3.5 w-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-semibold">
                      <X className="h-3.5 w-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordEval.score < 5 || !passwordsMatch}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password & Sign In</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Cancel & Return to Login</span>
              </Link>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
