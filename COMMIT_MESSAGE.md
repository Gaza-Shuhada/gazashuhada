# refactor: Remove duplicate color definitions from :root

## Overview

Clean up CSS color system to follow proper Tailwind CSS 4 pattern. Removed duplicate color definitions from `:root` block, keeping only `@theme inline` as single source of truth.

## Changes

### `globals.css`
**Before:**
- ❌ Colors defined in both `:root` (35+ lines) and `@theme inline`
- ❌ Duplication requiring updates in two places
- ❌ Not following Tailwind CSS v4 best practices

**After:**
- ✅ `:root` contains only `--radius` (needed for calc() references)
- ✅ All colors defined once in `@theme inline` with direct `oklch()` values
- ✅ Single source of truth for all color tokens
- ✅ Proper Tailwind CSS v4 pattern

**Removed from `:root`:**
- All `--background`, `--foreground`, `--card`, `--popover` definitions
- All `--primary`, `--secondary`, `--muted` definitions
- All `--accent`, `--accent-foreground` definitions
- All `--destructive`, `--border`, `--input`, `--ring` definitions
- All `--chart-*` and `--sidebar-*` definitions

### `sonner.tsx`
**Updated references:**
```tsx
// Before (broken after :root cleanup)
"--normal-bg": "var(--popover)"

// After (using @theme variables)
"--normal-bg": "var(--color-popover)"
```

Updated all Sonner toast component references to use `--color-*` prefixed variables.

## Why This Matters

### Tailwind CSS v4 Pattern
The `@theme inline` directive requires actual color values (not `var()` references) to generate utility classes at build time:

```css
/* ✅ Works - Tailwind generates text-accent-foreground */
@theme inline {
  --color-accent-foreground: oklch(0.6036 0.1379 138.23);
}

/* ❌ Doesn't work - Tailwind can't resolve var() at build time */
@theme inline {
  --color-accent-foreground: var(--accent-foreground);
}
```

### Benefits
- ✅ **DRY:** Colors defined once, not twice
- ✅ **Maintainable:** Single place to update colors
- ✅ **Correct:** Follows Tailwind CSS v4 architecture
- ✅ **Cleaner:** Removed 30+ lines of duplicate definitions

## Testing

- [x] Build passes (`npm run build`)
- [x] No linter errors
- [x] All color utilities work (`text-accent-foreground`, etc.)
- [x] Toast notifications render correctly
- [x] No visual regressions

## Breaking Changes

None. All changes are internal refactoring.

---

**Files Modified:** 2  
**Lines Removed:** ~35 duplicate color definitions  
**Pattern:** Tailwind CSS v4 @theme inline (single source of truth)
