/**
 * Date formatting and parsing utility functions.
 * Enforces DD/MM/YY date presentation and handling across RoadGuard.
 */

/**
 * Format a Date object or timestamp string to "DD/MM/YY"
 * Example: new Date('2026-10-21') -> "21/10/26"
 */
export const formatDateToDDMMYY = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

/**
 * Convert an ISO string (YYYY-MM-DD) to "DD/MM/YY"
 * Example: "2026-10-21" -> "21/10/26"
 */
export const isoToDDMMYY = (isoStr) => {
  if (!isoStr) return '';
  const clean = isoStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.slice(-2)}`;
  }
  return isoStr;
};

/**
 * Convert a "DD/MM/YY" or "DD/MM/YYYY" string to "YYYY-MM-DD"
 * Useful for HTML5 <input type="date"> sync or backend serialization.
 * Example: "21/10/26" -> "2026-10-21"
 */
export const ddmmyyToISO = (ddmmyyStr) => {
  if (!ddmmyyStr) return '';
  const parts = ddmmyyStr.trim().split('/');
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (y.length === 2) {
      y = '20' + y;
    }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return ddmmyyStr;
};

/**
 * Auto-format numeric text input into DD/MM/YY with slashes.
 * Strips non-digits and restricts to 6 digits maximum.
 */
export const formatDDMMYYInput = (rawInput) => {
  if (!rawInput) return '';
  // Only allow digits
  const digits = rawInput.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)}`;
};

/**
 * Validates if a string is a valid DD/MM/YY date
 */
export const isValidDDMMYY = (str) => {
  if (!str) return false;
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(str)) return false;
  
  const [d, m, y] = str.split('/').map(Number);
  const fullYear = 2000 + y;
  const dateObj = new Date(fullYear, m - 1, d);
  return (
    dateObj.getFullYear() === fullYear &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  );
};
