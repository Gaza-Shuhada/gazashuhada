# feat: Add grayscale-to-color hover effect on image grids

## Overview

Add visual hover effect to person images on homepage and database page. Images display in grayscale by default and transition to full color on hover for a striking visual effect.

## Changes

### Homepage Image Grid (`[locale]/page.tsx`)
```tsx
// Before
className="object-cover opacity-80 transition-all duration-100 group-hover:opacity-80"

// After
className="object-cover opacity-80 grayscale group-hover:grayscale-0 transition-all duration-100"
```

### Database Page Photo Grid (`PersonsTable.tsx`)
```tsx
// Before
className="object-cover grayscale"

// After
className="object-cover grayscale group-hover:grayscale-0 transition-all"
```

## Visual Effect

**Default State:**
- Images rendered in grayscale
- Creates cohesive, respectful visual aesthetic

**On Hover:**
- Grayscale removed (`grayscale-0`)
- Full color image revealed
- Smooth transition via `transition-all`

## Benefits

- ✅ **Respectful:** Grayscale creates somber, appropriate tone
- ✅ **Interactive:** Color on hover adds life and engagement
- ✅ **Consistent:** Same effect on both homepage and database
- ✅ **Smooth:** Transitions are fluid and polished

## Testing

- [x] Build passes (`npm run build`)
- [x] No linter errors
- [x] Hover effect works on homepage grid
- [x] Hover effect works on database photo view

---

**Files Modified:** 2  
**Effect:** Grayscale → Color on hover  
**Pages:** Homepage, Database
