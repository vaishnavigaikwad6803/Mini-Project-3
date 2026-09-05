import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-slate-700 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 transform transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 transform transition-transform duration-300 -rotate-12 hover:rotate-0 text-indigo-600" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
