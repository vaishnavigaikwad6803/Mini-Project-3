import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  KeyRound,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ShieldAlert,
  Send
} from 'lucide-react';
import { validateEmail, parseAuthError } from '../../utils/authValidation';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (serverError) setServerError('');
    if (touched) {
      setError(validateEmail(val) || '');
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email) || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setTouched(true);
    const validationErr = validateEmail(email);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setServerError('');
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      const parsed = parseAuthError(err, 'Failed to process password reset. Please try again.');
      setServerError(parsed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-10 relative">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-md space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 border border-amber-500/30 items-center justify-center text-amber-400 mb-1 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
            <KeyRound className="h-8 w-8 text-amber-400 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Enter your registered email address to receive password recovery instructions and a secure reset code.
          </p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">

          {success ? (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="inline-flex h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white font-['Outfit']">Check Your Inbox</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  If an account associated with <strong className="text-white">{email}</strong> exists, we have dispatched a password reset link and 6-digit code.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-400 space-y-2">
                <p className="flex items-center gap-2 text-slate-300 font-semibold">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                  Next Steps:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] sm:text-xs">
                  <li>Click the link inside the email or enter the 6-digit code directly.</li>
                  <li>The reset link and code will expire in <strong>15 minutes</strong>.</li>
                  <li>Check your spam or junk folder if the message does not appear shortly.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Enter Reset Code Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors pt-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Server Error Alert */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1 leading-relaxed">{serverError}</div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleBlur}
                    placeholder="e.g. name@example.com"
                    autoComplete="email"
                    className={`w-full pl-11 pr-4 py-3 bg-slate-950/80 border rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none transition-all duration-200 ${
                      error
                        ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50'
                    }`}
                  />
                </div>
                {error && <p className="text-xs text-rose-400">{error}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Recovery Instructions...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Reset Instructions</span>
                  </>
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
