"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const LanguageContext = createContext();
const DEFAULT_LOCALE = 'en';
const LANGUAGE_STORAGE_KEY = 'docbuilder-language-v2';

export function LanguageProvider({ children, initialLocale = DEFAULT_LOCALE }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === 'undefined') return initialLocale;
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || initialLocale;
  });
  const [dictionary, setDictionary] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDictionaries = async () => {
      try {
        const [
          common,
          documents,
          templates,
          editor,
          settings,
          quotation,
          verification
        ] = await Promise.all([
          import(`@/locales/${locale}/common.json`).catch(() => ({ default: {} })),
          import(`@/locales/${locale}/documents.json`).catch(() => ({ default: {} })),
          import(`@/locales/${locale}/templates.json`).catch(() => ({ default: {} })),
          import(`@/locales/${locale}/editor.json`).catch(() => ({ default: {} })),
          import(`@/locales/${locale}/settings.json`).catch(() => ({ default: {} })),
          import(`@/locales/${locale}/quotation.json`).catch(() => ({ default: {} })),
          import(`@/locales/${locale}/verification.json`).catch(() => ({ default: {} }))
        ]);

        if (isMounted) {
          setDictionary({
            common: common.default,
            documents: documents.default,
            templates: templates.default,
            editor: editor.default,
            settings: settings.default,
            quotation: quotation.default,
            verification: verification.default
          });
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load dictionaries:", error);
      }
    };

    loadDictionaries();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const setLocale = useCallback((newLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
    
    // Background API call to save settings
    fetch('/api/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language: newLocale }),
    }).catch(err => console.error("Failed to update language setting:", err));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback((key, params) => {
    if (!key) return '';

    const isLeaf = (val) =>
      typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';

    const resolve = (obj, path) => {
      if (!obj || typeof obj !== 'object') return undefined;
      const keys = path.split('.');
      let val = obj;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          return undefined;
        }
      }
      return isLeaf(val) ? val : undefined;
    };

    // 1. Try direct path e.g. "common.nav.dashboard" or "templates.templates.newTemplate"
    let value = resolve(dictionary, key);

    // 2. If not found, search in each namespace e.g. "nav.dashboard" -> dictionary.common.nav.dashboard
    if (value === undefined) {
      for (const ns of Object.keys(dictionary)) {
        value = resolve(dictionary[ns], key);
        if (value !== undefined) break;
      }
    }

    if (value === undefined) {
      return key; // Fallback to key
    }

    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (match, p1) => {
        return params[p1] !== undefined ? params[p1] : match;
      });
    }

    return typeof value === 'string' ? value : String(value);
  }, [dictionary]);

  const contextValue = useMemo(() => ({
    locale,
    t,
    setLocale,
    isLoaded
  }), [locale, t, setLocale, isLoaded]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
