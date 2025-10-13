'use client';

/**
 * i18n Context and Hooks
 * 
 * Provides translation functions and locale state to client components
 */

import { createContext, useContext, useMemo } from 'react';
import { Locale, defaultLocale, getDirection } from './i18n';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

type Translations = typeof enTranslations;

interface I18nContextValue {
  locale: Locale;
  translations: Translations;
  t: (key: string, fallback?: string) => string;
  direction: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const translationsMap: Record<Locale, Translations> = {
  en: enTranslations,
  ar: arTranslations,
};

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const translations = translationsMap[locale] || translationsMap[defaultLocale];
    const direction = getDirection(locale);

    /**
     * Get translation by dot notation key
     * e.g., t('nav.about') → 'About' or 'عن المشروع'
     */
    const t = (key: string, fallback?: string): string => {
      const keys = key.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = translations;

      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          return fallback || key;
        }
      }

      return typeof result === 'string' ? result : fallback || key;
    };

    return {
      locale,
      translations,
      t,
      direction,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access i18n context
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

/**
 * Hook to get translation function
 */
export function useTranslation() {
  const { t, locale, direction } = useI18n();
  return { t, locale, direction };
}

/**
 * Format date based on locale
 */
export function useFormatDate() {
  const { locale } = useI18n();

  return {
    formatDate: (date: Date | string | null, options?: Intl.DateTimeFormatOptions) => {
      if (!date) return '—';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Arabic locale uses Arabic numerals and month names
      const localeString = locale === 'ar' ? 'ar-EG' : 'en-US';
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      
      return dateObj.toLocaleDateString(localeString, options || defaultOptions);
    },
    formatDateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      const localeString = locale === 'ar' ? 'ar-EG' : 'en-US';
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      
      return dateObj.toLocaleString(localeString, options || defaultOptions);
    },
  };
}

/**
 * Format number based on locale
 */
export function useFormatNumber() {
  const { locale } = useI18n();

  return {
    formatNumber: (num: number | undefined | null) => {
      if (num === undefined || num === null) return '0';
      // Arabic locale uses Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩)
      const localeString = locale === 'ar' ? 'ar-EG' : 'en-US';
      return num.toLocaleString(localeString);
    },
  };
}

