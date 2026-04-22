'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { type Locale, defaultLocale, supportedLocales } from '@/lib/i18n';
import '@/lib/i18n/config';

const LOCALE_STORAGE_KEY = 'locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function isSupported(code: string): code is Locale {
  return supportedLocales.some((l) => l.code === code);
}

function writeCookie(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const { i18n } = useTranslation();
  const resolvedInitial: Locale =
    initialLocale && isSupported(initialLocale) ? initialLocale : defaultLocale;

  const [locale, setLocaleState] = useState<Locale>(resolvedInitial);

  // Ensure the i18next singleton's language reflects the current locale so
  // any code that reads `i18n.language` directly stays in sync. Must run in
  // an effect — changeLanguage fires internal events that update subscribers,
  // which would violate React's "no side effects during render" rule.
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  // `t` is bound to the current locale via getFixedT so it does NOT depend
  // on the mutable i18next singleton state. This prevents stale translations
  // when multiple components subscribe to `t` across render boundaries.
  const t = useMemo(() => {
    const fixed = i18n.getFixedT(locale);
    return ((key: string, options?: Record<string, unknown>) =>
      fixed(key, options) as unknown as string) as I18nContextType['t'];
  }, [i18n, locale]);

  // On mount, reconcile localStorage (legacy) with cookie-driven initial
  // locale. If localStorage has a different supported locale, adopt it and
  // refresh the cookie so subsequent SSR matches.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && isSupported(stored) && stored !== locale) {
        setLocaleState(stored);
        writeCookie(stored);
      } else if (!stored) {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      }
    } catch {
      // localStorage unavailable — cookie remains source of truth
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    writeCookie(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // localStorage unavailable
    }
  };

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
