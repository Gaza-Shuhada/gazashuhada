# refactor: Update person detail API to use new image naming scheme

## Overview

Update single person API endpoint to use the new programmatic image naming scheme (`person1.webp` through `person50.webp`) instead of hardcoded array, matching the list API implementation.

## Changes

### `api/public/person/[id]/route.ts`

**Before:**
- 50-line hardcoded array of image paths
- Included old screenshots and named files

**After:**
- Single line programmatic generation: `Array.from({ length: 50 }, (_, i) => ...)`
- Uses clean naming: `/people/person1.webp` through `person50.webp`
- Matches list API implementation exactly

**Code:**
```typescript
const mockPhotos = Array.from({ length: 50 }, (_, i) => `/people/person${i + 1}.webp`);
```

## Benefits

- ✅ **DRY:** Programmatic generation vs hardcoded array
- ✅ **Maintainable:** Easy to add/remove images (just change length)
- ✅ **Consistent:** Matches list API implementation
- ✅ **Cleaner:** Removed 48 lines of array definition

## Testing

- [x] Build passes (`npm run build`)
- [x] No linter errors
- [x] Person pages display correct images

---

**Files Modified:** 1  
**Lines Changed:** -48 lines (replaced with 1 line)  
**Compatibility:** Works with new person1-50.webp naming scheme
