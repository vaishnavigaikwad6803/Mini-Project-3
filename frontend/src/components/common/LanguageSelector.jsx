import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

/**
 * LanguageSelector Component
 * Provides a responsive dropdown or segmented pill to switch between
 * English ('en'), Marathi ('mr' - मराठी), and Hindi ('hi' - हिंदी).
 */
const LanguageSelector = ({ variant = 'dropdown', className = '' }) => {
  const { language, setLanguage, languages, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Segmented Pill Variant (ideal for mobile drawers or footers)
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-700/80 ${className}`}>
        {languages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown Variant (default for desktop/tablet navbar)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          isOpen
            ? 'bg-slate-800 text-amber-400 border-amber-500/50 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 border-slate-700/80 hover:border-slate-600'
        }`}
        aria-label="Change language / भाषा बदला"
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="hidden sm:inline font-['Outfit']">{currentLanguage.nativeName}</span>
        <span className="sm:hidden font-mono text-[11px] font-bold uppercase">{currentLanguage.short}</span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800 mb-1">
            Language / भाषा
          </div>
          <div className="space-y-0.5">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400">{lang.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
