import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, SUPPORTED_LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('roadguard_language');
      if (saved && ['en', 'mr', 'hi'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore localStorage errors
    }
    return 'en';
  });

  // Synchronize document.documentElement.lang attribute
  useEffect(() => {
    try {
      document.documentElement.lang = language;
      localStorage.setItem('roadguard_language', language);
    } catch (e) {
      console.warn('Failed to persist language preference:', e);
    }
  }, [language]);

  const setLanguage = useCallback((newLang) => {
    if (['en', 'mr', 'hi'].includes(newLang)) {
      setLanguageState(newLang);
    }
  }, []);

  /**
   * Translate function supporting dot-notation paths (e.g., 'nav.home', 'status.PENDING')
   * and optional variable replacement: t('welcomeUser', { name: 'Vaishnavi' })
   */
  const t = useCallback(
    (keyPath, fallbackOrParams = '', maybeParams = {}) => {
      let fallback = '';
      let params = {};

      if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
        params = fallbackOrParams;
        fallback = '';
      } else {
        fallback = fallbackOrParams;
        params = maybeParams || {};
      }

      if (!keyPath || typeof keyPath !== 'string') return '';

      const keys = keyPath.split('.');

      // Helper to traverse object
      const resolvePath = (obj) => {
        let current = obj;
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k];
          } else {
            return undefined;
          }
        }
        return current;
      };

      // 1. Try active language
      let result = resolvePath(translations[language]);

      // 2. Fall back to English
      if (result === undefined && language !== 'en') {
        result = resolvePath(translations.en);
      }

      // 3. Fall back to provided fallback string or last segment of keyPath
      if (result === undefined || result === null) {
        result = fallback || keys[keys.length - 1];
      }

      // Interpolate parameters if any: {paramName}
      if (typeof result === 'string' && Object.keys(params).length > 0) {
        return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
          return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramVal);
        }, result);
      }

      return result;
    },
    [language]
  );

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
