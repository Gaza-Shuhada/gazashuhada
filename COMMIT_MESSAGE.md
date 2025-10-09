# Add community contribution stats and fix Next.js config

## Overview
Added a dynamic subtitle showing the percentage of records missing community contributions, updated Next.js image configuration to use the new `remotePatterns` format, and expanded the landing page background grid to cover ultra-wide screens (1800px+).

## Changes

### 1. Homepage - Community Contribution Stats (`src/app/page.tsx`)
- **Added community contribution tracking**: Query database for records with approved community submissions
- **Calculate missing percentage**: Show how many records still need community input
- **Display dynamic subtitle**: Shows "X% of our records are still missing information. Help us by spreading the word and contributing."
- **Responsive messaging**: Different text when percentage is 0%

### 2. Next.js Configuration (`next.config.js`)
- **Fixed deprecation warning**: Replaced `images.domains` with `images.remotePatterns`
- **Updated format**: Now uses explicit protocol and hostname objects
- **Maintained functionality**: Kept support for Clerk images (`img.clerk.com`) and Unsplash (`images.unsplash.com`)

### 3. Background Grid Enhancement (`src/app/page.tsx`)
- **Increased photo count**: From 84 to 160 photos to cover wider screens
- **Added breakpoints**: 
  - `xl:grid-cols-16` for 1280px+ screens
  - `2xl:grid-cols-20` for 1536px+ screens
- **Full coverage**: Background now seamlessly fills screens 1800px wide and beyond

### 4. Tailwind CSS Custom Utilities (`src/app/globals.css`)
- **Added custom grid columns**: grid-cols-14, grid-cols-16, grid-cols-20
- **Tailwind 4 format**: Used `@theme` directive with CSS custom properties
- **Proper syntax**: `--grid-template-columns-{n}: repeat({n}, minmax(0, 1fr))`

## Technical Details

### Database Query
```typescript
const personsWithCommunityEdits = await prisma.person.count({
  where: {
    isDeleted: false,
    submissions: {
      some: { status: 'APPROVED' }
    }
  }
});
```

### Grid Breakpoints
- Mobile (0-639px): 6 columns
- Small (640-767px): 8 columns  
- Medium (768-1023px): 10 columns
- Large (1024-1279px): 12 columns
- XL (1280-1535px): 16 columns
- 2XL (1536px+): 20 columns

## Testing Checklist
- [ ] Homepage loads without errors
- [ ] Community contribution percentage displays correctly
- [ ] Subtitle appears below main title
- [ ] Next.js image deprecation warning is gone
- [ ] Background grid covers full width on 1800px+ screens
- [ ] Background grid responsive on all screen sizes
- [ ] No console errors or linter warnings

## Impact
- **User Experience**: Better encourages community participation with clear statistics
- **Visual Quality**: Background grid now properly fills ultra-wide displays
- **Developer Experience**: Removed deprecation warning, cleaner config
- **Performance**: No negative impact, single additional database query cached by Next.js
