import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit3,
  Clock,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { parseAuthError, validateEmail } from '../../utils/authValidation';

const COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendOtp, user } = useAuth();

  const initialEmail = searchParams.get('email') || user?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [emailError, setEmailError] = useState('');

  // 6 individual OTP digits
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // UI status
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    searchParams.get('registered') === 'true'
      ? 'Account created! A 6-digit verification code has been dispatched to your email.'
      : ''
  );
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  // Cooldown countdown timer
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first OTP input on mount
  useEffect(() => {
    if (!isEditingEmail && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isEditingEmail]);

  // Handle single-digit OTP input
  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // User pasted into a box
      handlePasteCode(cleaned);
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setErrorMessage('');

    // Advance focus to next input if digit entered
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Move to previous box on backspace if current is already empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePasteCode(pastedData);
  };

  const handlePasteCode = (codeStr) => {
    const digitsOnly = codeStr.replace(/\D/g, '').slice(0, 6);
    if (!digitsOnly) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < digitsOnly.length; i++) {
      newDigits[i] = digitsOnly[i];
    }
    setOtpDigits(newDigits);
    setErrorMessage('');

    const nextIndex = Math.min(digitsOnly.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmitVerification = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      setIsEditingEmail(true);
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      setIsEditingEmail(true);
      return;
    }

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      // Focus first empty digit
      const emptyIdx = otpDigits.findIndex((d) => !d);
      if (emptyIdx !== -1) inputRefs.current[emptyIdx]?.focus();
      return;
    }

    setLoading(true);

    try {
      const authResult = await verifyEmail(email.trim(), fullOtp);
      setIsVerifiedSuccess(true);

      // Auto redirect to appropriate dashboard after brief success display
      setTimeout(() => {
        const role = authResult.role || 'CITIZEN';
        if (role === 'ADMIN') navigate('/admin');
        else if (role === 'AUTHORITY') navigate('/authority');
        else if (role === 'ENGINEER') navigate('/engineer');
        else navigate('/citizen');
      }, 1600);
    } catch (err) {
      const parsed = parseAuthError(err, 'Verification failed. Please check the code and try again.');
      setErrorMessage(parsed);
      // Clear digits for re-entry if invalid
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      setIsEditingEmail(true);
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setResending(true);

    try {
      const res = await resendOtp(email.trim());
      setSuccessMessage(res.message || 'A fresh verification code has been dispatched to your inbox.');
      setCooldown(COOLDOWN_SECONDS);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const parsed = parseAuthError(err, 'Failed to resend code. Please wait a moment and try again.');
      setErrorMessage(parsed);
    } finally {
      setResending(false);
    }
  };

  if (isVerifiedSuccess) {
    return (
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-12 relative">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/95 border border-emerald-500/30 shadow-2xl backdrop-blur-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 stroke-[2.2]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white font-['Outfit']">Email Verified!</h1>
            <p className="text-sm text-slate-300">
              Your RoadGuard AI account has been successfully activated. Redirecting you to your portal...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-2 px-4 rounded-xl border border-emerald-500/20">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting to Dashboard</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-10 relative">
      {/* Background radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-gradient-to-tr from-amber-500/15 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-md space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/5 border border-amber-500/30 items-center justify-center text-amber-400 mb-1 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/20">
            <ShieldCheck className="h-8 w-8 text-amber-400 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Enter the 6-digit one-time code sent to your registered email to activate your account.
          </p>
        </div>

        {/* Verification Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">

          {/* Target Email Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="h-4 w-4 text-amber-400 shrink-0" />
              {isEditingEmail ? (
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="Enter your email"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                  {emailError && <p className="text-[11px] text-rose-400 mt-1">{emailError}</p>}
                </div>
              ) : (
                <span className="font-semibold text-slate-200 truncate">{email || 'No email provided'}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsEditingEmail(!isEditingEmail)}
              className="text-amber-400 hover:text-amber-300 font-medium text-xs flex items-center gap-1 shrink-0 p-1 hover:bg-amber-400/10 rounded-lg transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditingEmail ? 'Save' : 'Change'}</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-200"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* OTP Input Form */}
          <form onSubmit={handleSubmitVerification} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Enter 6-Digit Code
              </label>

              {/* 6 Digit Boxes */}
              <div
                className="flex items-center justify-center gap-2 sm:gap-3"
                onPaste={handlePaste}
              >
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-extrabold text-amber-400 bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-inner focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all caret-amber-400"
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>Code expires in <strong>5 minutes</strong></span>
              </div>
            </div>

            {/* Submit Verification Button */}
            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Activate Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="pt-2 border-t border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Didn&apos;t receive the code or did it expire?
            </p>

            <button
              type="button"
              disabled={cooldown > 0 || resending}
              onClick={handleResendOtp}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors py-1.5 px-3 rounded-xl hover:bg-amber-400/10 focus:outline-none"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? (
                <span>Sending Code...</span>
              ) : cooldown > 0 ? (
                <span>Resend Code in {cooldown}s</span>
              ) : (
                <span>Resend Verification Code</span>
              )}
            </button>
          </div>

          {/* Back to Login Link */}
          <div className="text-center pt-1">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VerifyEmail;
