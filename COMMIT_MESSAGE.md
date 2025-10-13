# feat: Enhance person pages with image support and UI improvements

## Overview

Major UI/UX improvements to person detail pages, homepage, and database views. Fixed Tailwind CSS 4 color theming, added consistent mock photo support across all pages, and improved responsive layouts.

## Changes

### 🎨 Tailwind CSS 4 Color Fix (`globals.css`)
- **Fixed `text-accent-foreground` not displaying green color**
- Changed `@theme inline` block to use actual `oklch()` values instead of `var()` references
- Added missing `--destructive-foreground` color definition
- Ensures proper color rendering in Tailwind CSS 4

### 🖼️ Consistent Mock Photo Support
- **Homepage** (`[locale]/page.tsx`):
  - Fetches real person records from API (24 records matching database page)
  - Links to correct person detail pages via `externalId`
  - Uses same mock photos as database page for consistency
  
- **Person Detail API** (`api/public/person/[id]/route.ts`):
  - Added mock photo assignment logic matching list API
  - Queries database to find person's position in list
  - Assigns consistent mock photo based on index
  - Ensures same photo appears on homepage, database, and detail pages

### 📱 Person Detail Page (`[locale]/person/[externalId]/page.tsx`)
- **Layout Improvements**:
  - Image now 1/3 width, content 2/3 width on desktop
  - Image maintains square aspect ratio (`aspect-square`)
  - Content expands to full width when no image present
  - Mobile: Image appears first, then content (using `flex-col-reverse`)
  
- **Typography**:
  - Reduced name font sizes to match homepage
  - h1: `text-5xl sm:text-6xl lg:text-7xl` (responsive scaling)
  - h2: `text-2xl sm:text-3xl lg:text-4xl` (secondary name)
  - Added `tracking-tight` for consistent text rendering
  
- **Header**:
  - Search bar hidden on mobile (`hidden md:block`)
  - Search bar visible and centered on desktop
  - Cleaner mobile header (Back + Contribute buttons only)
  
- **UX**:
  - Removed image links that opened in new tab
  - Added scroll to top on page navigation (`window.scrollTo(0, 0)`)

### 🗃️ Database Page (`PersonsTable.tsx`)
- Default view changed to "Photos" (grid view)
- Button order: Photos first, List second
- Removed image click-to-open links (images now navigate to person page)

### 🧹 Cleanup
- Deleted unnecessary seeding scripts and documentation
- Removed mock photo array from homepage (now fetches from API)

## Technical Details

**Color System:**
```css
/* Before (broken) */
--color-accent-foreground: var(--accent-foreground);

/* After (working) */
--color-accent-foreground: oklch(0.6036 0.1379 138.23);
```

**Mock Photo Consistency:**
- All pages use same query ordering: `updatedAt: 'desc'`
- Photo assignment based on person's index in results
- Ensures same person always gets same mock photo

**Responsive Layout:**
```tsx
/* Desktop: Card (2/3) | Image (1/3) */
/* Mobile: Image (full) then Card (full) */
<div className="flex flex-col-reverse md:flex-row gap-6">
  <Card className={`w-full ${hasPhoto ? 'md:w-2/3' : ''}`} />
  <div className="w-full md:w-1/3 aspect-square" />
</div>
```

## Testing Checklist

- [x] Build passes (`npm run build`)
- [x] No linter errors
- [x] Homepage displays real records with images
- [x] Database page defaults to Photos view
- [x] Person pages show consistent images
- [x] Mobile layout displays image before content
- [x] Desktop search bar works, hidden on mobile
- [x] Color theming (`text-accent-foreground`) displays green
- [x] Content expands full width when no image
- [x] Scroll to top on person page navigation

## Breaking Changes

None. All changes are UI/UX improvements and bug fixes.

## Impact

**User Experience:**
- Cleaner, more consistent UI across all pages
- Better mobile experience with improved layouts
- Faster navigation with scroll-to-top
- Professional appearance with consistent mock photos

**Performance:**
- Homepage fetches 24 records (optimized from hardcoded array)
- Single person API adds one additional query for photo consistency
- Build size remains similar

---

**Files Modified:** 6  
**Lines Changed:** ~300+ additions, ~150 deletions  
**Branch:** `add-person-images`
