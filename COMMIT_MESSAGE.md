# feat: Implement comprehensive Arabic localization with RTL support

## Overview

Implemented full bilingual support (English/Arabic) with route-based internationalization, RTL layout, and Arabic typography. The website now auto-detects browser language and provides seamless language switching while maintaining all functionality.

## What Changed

### Core Infrastructure
- **Route-based i18n**: All public pages now use `/[locale]/path` structure (`/en/*` and `/ar/*`)
- **Middleware**: Auto-detects browser language and redirects to appropriate locale
- **Language persistence**: User's language preference stored in cookies
- **Translation system**: Lightweight context-based translation with JSON files

### Layout & Routing
- **Created new locale-based layout** (`src/app/[locale]/layout.tsx`):
  - Dynamic `lang` and `dir` attributes based on locale
  - Font switching (Inter for English, Noto Sans Arabic for Arabic)
  - 107% font size increase for Arabic text
  - I18n context provider for all localized pages

- **Reorganized app structure**:
  - Root layout: Provides ClerkProvider for entire app
  - Locale layout: Provides html/body tags with language attributes
  - Sign-in/sign-up: Separate layouts (English only)
  - Admin tools: Separate layout (English only)

### Fonts & Typography
- **Added Noto Sans Arabic** font from Google Fonts
- **Automatic font switching** based on locale
- **Larger Arabic text** (107% of English size) for better readability
- **Proper RTL support** with Tailwind utilities

### Translations
- **Created comprehensive translation files**:
  - `src/locales/en.json` - English translations
  - `src/locales/ar.json` - Arabic translations (proper translations, not machine-generated)
  
- **Translation coverage**:
  - Navigation labels
  - Homepage hero and search
  - About page mission statement and FAQ
  - Database browser (table headers, filters, pagination)
  - Person detail pages (all field labels, version history)
  - Contribution pages (forms, status messages)
  - All UI components (buttons, badges, alerts)

### RTL (Right-to-Left) Support
- **Automatic layout flipping** for Arabic
- **Custom RTL utilities** in `globals.css`:
  - Margin/padding flipping
  - Text alignment reversal
  - Force-LTR class for technical data (IDs, dates, coordinates)

### Date & Number Formatting
- **Locale-aware formatting**:
  - English: "52,000" and "Jan 15, 2024"
  - Arabic: "٥٢٬٠٠٠" (Eastern Arabic numerals) and "١٥ يناير ٢٠٢٤"
- **Hooks for formatting**: `useFormatDate()` and `useFormatNumber()`

### Pages Migrated to Locale Structure
- ✅ Homepage: `page.tsx` → `[locale]/page.tsx`
- ✅ About: `about/page.tsx` → `[locale]/about/page.tsx`
- ✅ Database: `database/page.tsx` → `[locale]/database/page.tsx`
- ✅ Person detail: `person/[id]/page.tsx` → `[locale]/person/[id]/page.tsx`
- ✅ Contributions: `contribution/*` → `[locale]/contribution/*`

### Components Updated
- **PublicNavbar**: Functional language toggle, locale-aware routing, hidden in admin section
- **PersonSearch**: Translatable placeholder, locale-specific navigation, smart name display
- **PersonsTable**: Translated headers/filters/pagination, locale-aware links
- **AnimatedCounter**: Locale-specific number formatting
- All pages and components updated to use translation hooks

### Name Display Logic
- **English mode**: English name primary (if available), Arabic name secondary
- **Arabic mode**: Arabic name primary, English name secondary
- Both names always displayed when available

### Admin Section
- **Admin tools remain English-only** (as per requirements)
- **Language toggle hidden** in admin section
- Admin tools layout unaffected by localization

## Technical Details

### Translation System
```typescript
// Access translations
const { t, locale } = useTranslation();
t('nav.about') // Returns "About" or "عن المشروع"

// Format dates
const { formatDate } = useFormatDate();
formatDate(new Date()) // Locale-aware formatting

// Format numbers
const { formatNumber } = useFormatNumber();
formatNumber(52000) // "52,000" or "٥٢٬٠٠٠"
```

### Middleware Logic
1. Detects browser language from Accept-Language header
2. Checks for NEXT_LOCALE cookie (preference persistence)
3. Redirects root paths to `/en/` or `/ar/` accordingly
4. Excludes admin tools, API routes, and auth pages from localization

### SEO Optimization
- Locale-specific metadata (title, description)
- Proper `lang` attribute on `<html>` tag
- Shareable localized URLs
- SEO-friendly route structure

## Files Created
- `src/lib/i18n.ts` - Locale utilities and constants
- `src/lib/i18n-context.tsx` - React context, hooks, formatting utilities
- `src/locales/en.json` - English translations
- `src/locales/ar.json` - Arabic translations
- `src/app/layout.tsx` - Root layout with ClerkProvider
- `src/app/[locale]/layout.tsx` - Locale-specific layout
- `src/app/[locale]/*` - All public pages migrated
- `src/app/sign-in/layout.tsx` - Sign-in page layout
- `src/app/sign-up/layout.tsx` - Sign-up page layout

## Files Modified
- `src/middleware.ts` - Added locale detection and routing
- `src/app/globals.css` - Added Arabic font and RTL utilities
- `src/app/tools/layout.tsx` - Added complete layout structure
- `src/components/PublicNavbar.tsx` - Functional language toggle
- `src/components/PersonSearch.tsx` - i18n support
- `src/components/PersonsTable.tsx` - i18n support
- `src/components/AnimatedCounter.tsx` - Locale-specific formatting

## Files Deleted
- Old non-localized page files (moved to `[locale]` structure)
- Empty directories

## Testing Checklist

### Functionality
- ✅ Browser language detection works
- ✅ Language toggle switches between EN/AR
- ✅ Language preference persists via cookie
- ✅ All pages accessible in both languages
- ✅ Search works in both languages
- ✅ Navigation works correctly
- ✅ Sign-in/sign-up works
- ✅ Admin tools remain English-only

### Localization
- ✅ All text translates correctly
- ✅ RTL layout works properly
- ✅ Arabic font renders correctly
- ✅ Numbers use Eastern Arabic numerals in AR
- ✅ Dates use locale-specific formatting
- ✅ Name display logic works (primary/secondary)
- ✅ IDs and technical data remain LTR

### Build & Performance
- ✅ Production build succeeds
- ✅ No TypeScript errors
- ✅ Static generation works for both locales
- ✅ Middleware performs efficiently
- ✅ Font loading optimized with `display: swap`

## Impact

### User Experience
- **Arabic speakers** can now use the site in their native language
- **Improved accessibility** with proper RTL support
- **Better SEO** with locale-specific URLs and metadata
- **Shareable links** in specific languages
- **Respectful presentation** with proper Arabic typography

### Developer Experience
- **Simple translation system** - just edit JSON files
- **Type-safe hooks** for translations and formatting
- **Reusable utilities** for future localization needs
- **Clean architecture** - easy to add more languages later

## Breaking Changes

None - all existing routes now redirect to `/en/` equivalents, maintaining backward compatibility via middleware.

## Next Steps

- Monitor usage to see language preference distribution
- Refine translations based on user feedback
- Consider adding more languages in the future
- Potentially localize admin tools if needed

---

**Tested on**: Chrome, Safari (macOS)  
**Routes verified**: All public routes in both EN and AR  
**Build status**: ✅ Production build successful
