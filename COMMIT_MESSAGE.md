# feat: Complete public-facing UI redesign and About page

## 🎯 Overview

Major overhaul of the public landing page, navigation structure, and addition of comprehensive About page. Updated terminology from "submissions" to "contributions" throughout the application, added animated counter, person search with autocomplete, and restructured contribution flows with clean URL patterns.

---

## 🏠 Landing Page Redesign

### New Messaging & Design

**Location**: `src/app/page.tsx`

**Changes**:
- **New title**: "We will not forget them"
- **Animated counter**: Counts up from 0 to total persons in database on page load
- **Subtitle**: Dynamic stats showing total persons from database
- **Removed**: Feature cards (Document, Track, Remember sections)
- **Removed**: Get Started and Sign In buttons
- **Added**: Prominent search box for contributing missing information

**Features**:
- `AnimatedCounter` component with smooth easing animation (2 second duration)
- Real-time stats fetched from `/api/public/stats`
- Responsive design with centered content
- Clear call-to-action card with border and shadow

**Files**:
- `src/app/page.tsx` - Main landing page
- `src/components/AnimatedCounter.tsx` - New animated counter component
- `src/components/PersonSearch.tsx` - New autocomplete search component

---

## 🔍 Person Search with Autocomplete

### New Component: PersonSearch

**Location**: `src/components/PersonSearch.tsx`

**Features**:
- Real-time search as you type (300ms debounce)
- Searches by name (Arabic/English) or external ID
- Shows up to 10 results with person details
- Displays name, English name, ID, birth/death dates
- Click to navigate to person detail page
- Loading spinner during search
- "No results found" state
- Closes when clicking outside

**API Integration**:
- Uses `/api/public/persons?search={query}&limit=10&confirmedOnly=false`
- Searches across all persons (MoH and community)

---

## 🗺️ Navigation Restructure

### Centered Logo with Left Navigation

**Location**: `src/components/PublicNavbar.tsx`

**Changes**:
- **Center**: "Gaza Deaths وفيات غزة" logo (absolute positioning)
- **Left**: Navigation links (Database, Contributions, About)
- **Right**: Theme toggle, Admin Tools (for staff), User menu
- **Order**: Database → Contributions → About (from left to right)
- **Mobile**: Hamburger menu with same order

**Responsive Design**:
- Desktop: Full horizontal nav with centered logo
- Mobile: Hamburger menu, logo visible, user buttons remain
- All pages accessible without sign-in requirement

---

## 📝 About Page

### New Comprehensive About Page

**Location**: `src/app/about/page.tsx`

**Sections**:

1. **Mission Statement**
   - "Gaza Death Toll aims to memorialise those dead and missing..."
   - Explanation of MoH foundation + community contributions
   - Purpose: canonical document for international justice
   - "Remembering is both an ethical and political act"

2. **Advisory Team** (8 members)
   - Profile photos from `/public/team/`
   - Name, title, description, LinkedIn/website links
   - Team members:
     - Dima Hamdan (Journalist and filmmaker)
     - Joshua Andresen (International lawyer & Legal academic)
     - Randa Mirza (Visual artist)
     - Jens Munch (Entrepreneur & Builder)
     - Wil Grace (Product leader)
     - Heidi El-Hosaini (Geo data & Activism)
     - Imran Sulemanji (Technical Lead)
     - Yousef Eldin (Director of video)

3. **FAQ Section** (7 questions)
   - Why call them "deaths"?
   - Who is involved?
   - Data ownership and usage
   - Project funding
   - Relationship to Iraq Body Count
   - Relationship to Tech4Palestine
   - Relationship to Gaza MoH

**Components Used**:
- shadcn `Card` for team member profiles
- shadcn `Accordion` for FAQ (installed via `npx shadcn@latest add accordion`)
- Responsive grid (2 columns on desktop, 1 on mobile)
- Round profile photos with hover effects
- Clickable names (external links)

---

## 🔄 Contributions → Terminology Change

### Updated from "Submissions" to "Contributions"

**Renamed**:
- Route: `/submission` → `/contribution`
- Navbar: "Submissions" → "Contributions"
- Page title: "Community Submissions" → "Community Contributions"
- Tab label: "My Submissions" → "My Contributions"
- Section: "Submission History" → "Contribution History"
- Variable names: `submissions` → `contributions`
- Function names: `fetchSubmissions` → `fetchContributions`

**Files Updated**:
- `src/app/contribution/page.tsx` (renamed from submission/page.tsx)
- `src/components/PublicNavbar.tsx`

**Interface Renamed**:
```typescript
interface Contribution {  // was: Submission
  id: string;
  type: 'NEW_RECORD' | 'EDIT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  // ...
}
```

---

## 🛣️ Clean URL Structure for Contributions

### New Route: `/contribution/edit/[externalId]`

**Location**: `src/app/contribution/edit/[externalId]/page.tsx`

**Purpose**: Direct link to contribute information for a specific person

**Features**:
- External ID in URL path (not query parameter)
- Clean, shareable URLs
- Prepopulated form with person's external ID
- All form fields (date of death, location, obituary, photo)
- Validation and moderation flow
- Redirects back to person page after submission

**Example**: `/contribution/edit/P12345`

**Integration**:
- Person detail page: "Contribute information" button links to this route
- Landing page search: Clicking result → person page → contribute button

**Removed**: Query parameter approach (`/submission?externalId=...`)
- Cleaner URLs
- Better for sharing
- RESTful pattern

---

## 🎨 UI/UX Improvements

### Landing Page

**Before**:
- Complex feature cards
- Multiple CTAs
- Busy layout

**After**:
- Single focused message
- Animated counter (impactful)
- One clear action: search and contribute
- Minimal, clean design

### Navigation

**Before**:
- Logo on left
- Nav items next to logo
- Cluttered on small screens

**After**:
- Logo centered (prominent)
- Nav items on left (logical order)
- User actions on right
- Balanced, professional layout

### About Page

- Professional team presentation
- Collapsible FAQ for easy scanning
- Clear mission statement at top
- External links open in new tabs
- Responsive images and layout

---

## 🐛 Bug Fixes

### Fixed: useSearchParams Suspense Boundary Error

**Problem**: Build failed with "useSearchParams() should be wrapped in a suspense boundary"

**Root Cause**: `/contribution/page.tsx` was using `useSearchParams()` but never using the result

**Fix**: 
- Removed `useSearchParams` import
- Removed unused `externalIdParam` variable
- No longer needed since we have dedicated `/contribution/edit/[externalId]` route

**Files**:
- `src/app/contribution/page.tsx`

### Fixed: Build Warnings

**Removed**: Unused variable `externalIdParam` (TypeScript warning)

---

## 🔧 Technical Details

### New Components

1. **AnimatedCounter** (`src/components/AnimatedCounter.tsx`)
   - Uses `requestAnimationFrame` for smooth 60fps animation
   - Easing function: `easeOutQuart` for natural counting effect
   - Props: `end` (number), `duration` (default 2000ms)
   - Cancels animation on unmount (cleanup)

2. **PersonSearch** (`src/components/PersonSearch.tsx`)
   - Client component (`'use client'`)
   - Debounced search (300ms)
   - Ref-based click outside detection
   - Loading and empty states
   - Keyboard accessible

### Route Configuration

- About page: Static generation (no dynamic data)
- Contribution edit page: Dynamic (uses `[externalId]` param)
- Landing page: Dynamic (fetches stats on server)

### Dependencies

- **New**: `@/components/ui/accordion` (installed via shadcn CLI)
- **Existing**: All other shadcn components already present

---

## 📦 File Summary

### New Files (4)
- `src/components/AnimatedCounter.tsx` - Animated number counter
- `src/components/PersonSearch.tsx` - Autocomplete search
- `src/app/about/page.tsx` - About page with team & FAQ
- `src/app/contribution/edit/[externalId]/page.tsx` - Contribution edit page
- `src/components/ui/accordion.tsx` - shadcn accordion (auto-installed)

### Modified Files (3)
- `src/app/page.tsx` - Complete redesign
- `src/components/PublicNavbar.tsx` - Centered logo, reordered nav
- `src/app/contribution/page.tsx` - Renamed from submission, terminology updates

### Renamed Directories (1)
- `src/app/submission/` → `src/app/contribution/`

### Assets Added
- Team photos in `/public/team/`:
  - dima.jpg, heidi.jpg, imran.jpg, jens.jpg
  - joshua.jpg, randa.jpg, wil.jpg, yousef.jpg

---

## ✅ Testing Checklist

- [x] Landing page displays animated counter
- [x] Person search autocomplete works
- [x] Search results link to person pages
- [x] About page displays team members with photos
- [x] FAQ accordion works correctly
- [x] Navigation centered and responsive
- [x] Contribution edit page accessible via clean URL
- [x] "Contribute information" button uses correct route
- [x] Mobile navigation hamburger menu works
- [x] All external links open in new tabs
- [x] Build successful (no errors, no warnings)
- [x] No TypeScript errors
- [x] No ESLint warnings

---

## 🚀 Deployment Notes

**No Database Changes**: Pure UI/frontend update

**Environment Variables**: None required

**Breaking Changes**: 
- Route changed: `/submission` → `/contribution`
- Old links will 404 (update any external references)

**Static Assets**: Team photos must be deployed to `/public/team/`

---

## 📈 Impact

**User Experience**:
- ✅ Clearer, more focused landing page
- ✅ Easier to find and contribute to person records
- ✅ Professional About page with team transparency
- ✅ Consistent terminology ("contributions" vs "submissions")
- ✅ Clean, shareable URLs

**SEO & Accessibility**:
- ✅ Semantic HTML structure
- ✅ Alt text for images
- ✅ Proper heading hierarchy
- ✅ Keyboard navigation support

**Code Quality**:
- ✅ Removed unused code
- ✅ TypeScript strict mode compliance
- ✅ Component reusability
- ✅ Clean separation of concerns

---

## 🔗 Related Changes

- Builds on previous person detail page work
- Uses existing `/api/public/persons` endpoint
- Integrates with existing moderation workflow
- Maintains version history tracking

---

**Status**: ✅ All changes tested and production-ready  
**Build**: ✅ Successful (Exit code: 0)  
**TypeScript**: ✅ No errors  
**ESLint**: ✅ No warnings
