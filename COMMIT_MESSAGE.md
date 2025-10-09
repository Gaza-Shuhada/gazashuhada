# feat: Memorial photo grid background on landing page

## 🎯 Overview

Complete visual redesign of the landing page with a powerful memorial photo grid as the background, featuring 51 B&W photos of victims. Updated navbar to transparent overlay with white text.

---

## 🖼️ Photo Grid Background

### Memorial Wall Design

**Location**: `src/app/page.tsx`

**Changes**:
- **Full-page background**: Fixed position photo grid covering entire viewport
- **51 B&W photos**: All images converted to grayscale for memorial aesthetic
- **Minimal spacing**: 2px gap between photos (gap-0.5) for dense grid
- **Responsive grid**: 6-14 columns depending on screen size
- **120 photo instances**: Photos repeat to completely fill background
- **Dimmed overlay**: 40% opacity photos + 60% black overlay for text readability
- **Hover effects**: Photos brighten to 70% opacity, scale slightly, show names

**Photos**:
- 12 named individuals (Anas, Faten, Hind, Ismael, Khaled, Lana, Nahedh, Omar, Rakan, Sara, Suleiman, Yaqeen)
- 39 additional victims from screenshots
- All cropped to 500x500 (center crop, no distortion)
- All converted to black and white

**Visual Impact**:
- Creates powerful "memorial wall" effect
- Humanizes the statistics
- Content floats over photos with glassmorphism card

---

## 🎨 Navbar Redesign

### Transparent Overlay

**Location**: `src/components/PublicNavbar.tsx`

**Changes**:
- **Removed background**: Changed from `bg-background` to transparent
- **Removed border**: Removed `border-b` and `shadow-sm`
- **White text**: All nav items, logo, and buttons now white
- **Subtle hover**: White text at 80% opacity, full white on hover
- **Mobile menu button**: White with hover effects

**Before**: Solid background navbar with border
**After**: Transparent navbar floating over photo grid

---

## 📁 Photo Processing

### Image Preparation Pipeline

**Source**: `/public/people/originals/` (51 images)  
**Destination**: `/public/people/` (51 processed images)

**Processing Steps**:
1. **Center crop to 500x500**: Using sharp with `fit: 'cover'` (no aspect ratio distortion)
2. **Convert to grayscale**: All photos black and white for memorial aesthetic
3. **Optimize**: Proper compression and sizing

**Original Dimensions** (varied):
- 736x900, 739x1600, 1000x800, 1536x2048, 784x678, etc.

**Final Dimensions**: All 500x500 perfect squares

**Files**:
- `anas.jpeg`, `faten.jpeg`, `hind.jpg`, `ismael.jpeg`, `khaled.jpg`
- `lana.jpg`, `nahedh.jpg`, `omar.jpg`, `rakan.jpg`, `sara.jpeg`
- `suleiman.jpeg`, `yaqeen.jpg`
- 39 screenshot PNGs (11.10.17 through 11.21.07)

---

## 🎯 Design System

### Content Overlay

**Main Content**:
- `z-10` - Floats above background
- White text throughout
- Glassmorphism card: `bg-black/40 backdrop-blur-sm border-white/10`
- Full contrast against dark background

**Background Grid**:
- `z-0` - Behind all content
- Fixed positioning (stays while scrolling)
- Edge-to-edge coverage (no padding)
- Subtle interactions (hover brightness, names appear)

---

## 🔧 Technical Implementation

### Photo Grid Component

```typescript
// 120 photos displayed (51 unique photos repeated)
Array.from({ length: 120 }).map((_, index) => {
  const person = people[index % people.length];
  // Grid item with hover effects
})
```

**Grid Specifications**:
- Breakpoints: 6 → 8 → 10 → 12 → 14 columns
- Gap: 0.5 (2px)
- Aspect ratio: 1:1 (square)
- Hover scale: 105%
- Hover z-index: 10 (pops forward)

### Image Optimization

**Sharp Configuration**:
```javascript
.resize(500, 500, { fit: 'cover', position: 'center' })
.grayscale()
```

**Next.js Image**:
- `fill` prop for responsive sizing
- `object-cover` for proper cropping
- `sizes` attribute for responsive loading
- Optimized formats (WebP when supported)

---

## 📦 File Summary

### New/Modified Files

**Modified**:
- `src/app/page.tsx` - Added photo grid background, updated to 51 photos
- `src/components/PublicNavbar.tsx` - Transparent with white text
- `.gitignore` - Updated

**Added**:
- `public/people/originals/` - 51 original photos (stored for backup)
- `public/people/` - 51 processed photos (500x500, B&W)

**Assets**:
- 51 photos total
- All 500x500 px
- All black and white
- Properly cropped (no distortion)

---

## 🎨 Visual Aesthetic

### Memorial Design Language

**Color Palette**:
- Black background (#000000)
- White text (#FFFFFF)
- Grayscale photos
- Subtle gradients (black/60 overlay)

**Typography**:
- Hero title: White, 5xl/6xl
- Body text: gray-300
- Photo labels: Small, white, appear on hover

**Effects**:
- Backdrop blur on main card
- Smooth transitions (300ms)
- Hover brightness increase
- Glassmorphism for depth

**Emotional Impact**:
- Somber, respectful
- Powerful visual statement
- Each face visible and dignified
- Numbers become people

---

## ✅ Testing Checklist

- [x] All 51 photos properly cropped (500x500, no distortion)
- [x] All photos converted to black and white
- [x] Photo grid covers full viewport
- [x] Minimal spacing between photos (2px)
- [x] Content readable over photo background
- [x] Navbar transparent with white text
- [x] All text visible (sufficient contrast)
- [x] Hover effects work smoothly
- [x] Photos repeat to fill background
- [x] Responsive on all screen sizes
- [x] Names appear on hover
- [x] Glassmorphism card renders correctly

---

## 🚀 Deployment Notes

**Static Assets**: 
- 51 photos in `/public/people/` (~10-20MB total)
- Originals backed up in `/public/people/originals/`

**Performance**:
- Photos optimized by Next.js Image
- Lazy loading for off-screen images
- Fixed positioning (no layout shift)

**No Database Changes**: Pure frontend update

---

## 📈 Impact

**User Experience**:
- ✅ Powerful emotional impact
- ✅ Humanizes the death toll
- ✅ Memorial aesthetic appropriate for subject
- ✅ Clear, focused messaging over photos

**Accessibility**:
- ✅ Sufficient contrast (white on dark)
- ✅ Alt text for all photos
- ✅ Hover states for interaction feedback

**Brand**:
- ✅ Professional memorial design
- ✅ Respects dignity of victims
- ✅ Visual storytelling through faces
- ✅ Impactful first impression

---

**Status**: ✅ Production-ready  
**Visual QA**: ✅ All photos processed correctly  
**No breaking changes**: Purely additive
