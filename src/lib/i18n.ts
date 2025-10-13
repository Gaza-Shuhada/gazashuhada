/**
 * i18n Configuration and Utilities
 * 
 * Handles locale detection, translation loading, and language switching
 */

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  ar: { native: 'العربية', english: 'Arabic' },
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get locale from pathname
 * e.g., /ar/about → 'ar', /en/database → 'en'
 */
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }
  
  return null;
}

/**
 * Remove locale from pathname
 * e.g., /ar/about → /about
 */
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
}

/**
 * Add locale to pathname
 * e.g., /about + 'ar' → /ar/about
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  const pathWithoutLocale = removeLocaleFromPathname(pathname);
  return `/${locale}${pathWithoutLocale}`;
}

/**
 * Detect preferred locale from browser
 * Falls back to default locale if no match
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const browserLangs = navigator.languages || [navigator.language];
  
  for (const lang of browserLangs) {
    // Check exact match (e.g., 'ar')
    if (isValidLocale(lang)) {
      return lang;
    }
    
    // Check language code only (e.g., 'ar-SA' → 'ar')
    const langCode = lang.split('-')[0];
    if (isValidLocale(langCode)) {
      return langCode;
    }
  }
  
  return defaultLocale;
}

/**
 * Get direction for a locale
 */
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return localeDirections[locale];
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale: Locale): boolean {
  return localeDirections[locale] === 'rtl';
}

