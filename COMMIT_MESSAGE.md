# Improve navigation UX and standardize admin page layouts

## Navigation Improvements

### Active State Indicators
- Add active page state tracking to both `ToolsNavbar` and `PublicNavbar` components
- Implement `usePathname()` hook from Next.js to detect current route
- Apply visual feedback for active navigation links:
  - Active links: darker text (`text-foreground`) + bold font weight
  - Inactive links: muted text (`text-muted-foreground`) with hover states
- Consistent styling across desktop and mobile navigation menus

**Files changed:**
- `src/components/ToolsNavbar.tsx`
- `src/components/PublicNavbar.tsx`

**User benefit:** Users can now instantly see which page they're currently on in the navigation menu, improving spatial awareness and reducing navigation confusion.

---

## Admin Page Layout Standardization

### Consistent Header Layout
- Standardize the header layout across Audit Logs and Moderation pages
- Implement uniform structure: title/description on left, refresh button on right
- Use `flex justify-between` for consistent alignment
- Ensure refresh button shows loading state ("Refreshing..." text)

### Moderation Page Refactor
- Move page heading from `page.tsx` to `ModerationClient.tsx` component
- Remove duplicate heading that was causing visual inconsistency
- Update heading text to "Pending Moderation" (matches original design)
- Wrap content in consistent loading states with card components

### Layout Structure
Both pages now follow this pattern:
```
┌─────────────────────────────────────────────────────┐
│ [Title]                            [Refresh Button] │
│ [Description]                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Content Area with Loading/Empty States]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Files changed:**
- `src/app/tools/moderation/ModerationClient.tsx`
- `src/app/tools/moderation/page.tsx`

**User benefit:** Consistent UI patterns across admin tools reduce cognitive load and make the interface more predictable and professional.

---

## Technical Details

### Navigation Changes
- Import `usePathname` from `next/navigation` in both navbar components
- Conditional className logic compares `pathname` with link href
- Removed background highlight (`bg-accent`) for cleaner, more subtle active state
- Applied to all navigation links: Bulk Uploads, Moderation, Audit Logs, Admin, Submissions, Database

### Moderation Page Changes
- Consolidated loading state handling into single ternary chain
- Added consistent loading card UI matching Audit Logs pattern
- Moved header into `space-y-6` wrapper for proper spacing
- Removed wrapper div from page component to eliminate nesting

---

## Design Decisions

1. **Subtle active states:** Initial implementation used background highlights, but we simplified to text color + bold font for a cleaner look that works well in both light and dark modes.

2. **Consistent refresh button:** All admin pages now have the refresh button in the same position (top-right) with identical styling and loading states.

3. **Component responsibility:** Headers are now consistently owned by client components rather than split between page and client components, making the architecture cleaner.

---

## Testing Recommendations

- [ ] Navigate between all admin tool pages and verify active state updates
- [ ] Test in both light and dark modes
- [ ] Verify mobile navigation drawer shows active states correctly
- [ ] Test refresh buttons on Audit Logs and Moderation pages
- [ ] Confirm no duplicate headings visible on any page
