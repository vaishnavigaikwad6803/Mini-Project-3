/**
 * Authentication validation and error parsing utilities for RoadGuard AI
 */

/**
 * Standard RFC-compliant email regex
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email format
 * @param {string} email
 * @returns {string|null} error message or null if valid
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
};

/**
 * Validates password and computes strength metrics
 * @param {string} password
 * @returns {{ error: string|null, score: number, label: string, color: string, rules: { minLength: boolean, hasLower: boolean, hasUpper: boolean, hasNumber: boolean, hasSpecial: boolean } }}
 */
export const evaluatePassword = (password) => {
  const pwd = password || '';
  const minLength = pwd.length >= 8;
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (hasLower) score += 1;
  if (hasUpper) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  let label = 'Weak';
  let color = 'bg-rose-500 text-rose-400';

  if (!pwd) {
    label = 'Empty';
    color = 'bg-slate-700 text-slate-500';
  } else if (score <= 2) {
    label = 'Weak';
    color = 'bg-rose-500 text-rose-400';
  } else if (score === 3) {
    label = 'Fair';
    color = 'bg-amber-500 text-amber-400';
  } else if (score === 4) {
    label = 'Good';
    color = 'bg-cyan-500 text-cyan-400';
  } else if (score === 5) {
    label = 'Strong';
    color = 'bg-emerald-500 text-emerald-400';
  }

  let error = null;
  if (!pwd) {
    error = 'Password is required.';
  } else if (!minLength) {
    error = 'Password must be at least 8 characters.';
  } else if (!hasLower) {
    error = 'Password must include at least one lowercase letter.';
  } else if (!hasUpper) {
    error = 'Password must include at least one uppercase letter.';
  } else if (!hasNumber) {
    error = 'Password must include at least one number.';
  } else if (!hasSpecial) {
    error = 'Password must include at least one special character.';
  }

  return {
    error,
    score,
    label,
    color,
    rules: {
      minLength,
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial,
    },
  };
};

/**
 * Validates phone number (optional, but if provided must be realistic)
 * @param {string} phone
 * @returns {string|null}
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return null;
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (!/^\d{10,14}$/.test(clean)) {
    return 'Please enter a valid 10-digit mobile number.';
  }
  return null;
};

/**
 * Parses server error responses from FastAPI / Axios
 * @param {any} err
 * @param {string} fallbackMsg
 * @returns {string}
 */
export const parseAuthError = (err, fallbackMsg = 'Authentication request failed. Please try again.') => {
  if (!err) return fallbackMsg;

  const data = err.response?.data;

  // Handle FastAPI detail
  if (data?.detail) {
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (typeof data.detail === 'object' && data.detail.message) {
      return data.detail.message;
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          const field = item.loc ? item.loc[item.loc.length - 1] : 'Field';
          return `${field}: ${item.msg}`;
        })
        .join(' • ');
    }
  }

  const status = err.response?.status;
  if (status === 401) {
    return 'Incorrect email or password. Please verify your credentials.';
  }
  if (status === 403) {
    return data?.detail || 'Account access restricted. Please verify your email or contact support.';
  }
  if (status === 404) {
    return 'Authentication service endpoint not reachable.';
  }
  if (status === 429) {
    return data?.detail || 'Too many attempts. Please wait a few moments before trying again.';
  }
  if (status && status >= 500) {
    return 'RoadGuard server error encountered. Please try again shortly.';
  }

  if (err.message === 'Network Error' || !err.response) {
    return 'Unable to connect to the RoadGuard server. Please ensure the backend is running.';
  }

  return err.message || fallbackMsg;
};
