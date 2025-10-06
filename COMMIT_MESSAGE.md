# fix: Make root page (/) public-only landing page

## Overview
Changed the root page from showing conditional content (dashboard for logged-in users, marketing for logged-out users) to always showing the public landing page for everyone.

## Problem
- Users visiting `/` while logged in were seeing a dashboard with stats and role information
- This was confusing - the root should be a public landing page
- Admin/staff dashboard should only be at `/tools`

## Solution
Simplified the root page to **always** show the public landing page:
- ✅ Shows to everyone (logged in or not)
- ✅ Clean marketing page with "Document and Track Gaza Casualties"
- ✅ Call-to-action buttons: "Get Started" and "Sign In"
- ✅ Three feature cards: Document, Track, Remember

## Changes Made

### `src/app/page.tsx`
**Before:**
- Checked if user is logged in
- If logged out → Show marketing page
- If logged in → Show personalized dashboard with stats and role badges

**After:**
- Simple static page
- No authentication checks
- Always shows public landing page
- Removed conditional logic completely

### Removed Unused Imports
- `auth` and `currentUser` from Clerk
- `StatsCards` component
- `Alert`, `AlertDescription`, `AlertTitle` components
- `Badge` component

## Page Structure Now

```
/                    → Public landing page (for everyone)
/community           → Community submissions (logged-in users)
/records             → Database records (logged-in users)
/tools               → Admin dashboard (admin/moderator only)
/tools/settings      → Settings (admin only)
/tools/bulk-uploads  → Bulk uploads (admin only)
/tools/moderation    → Moderation queue (moderator + admin)
/tools/audit-logs    → Audit logs (moderator + admin)
```

## Benefits

1. **Clear separation** - Public site vs admin tools
2. **Better UX** - Visitors immediately see what the platform is about
3. **Consistent branding** - Everyone sees the same homepage
4. **Simpler code** - No conditional rendering logic
5. **Static page** - Can be prerendered (faster, better SEO)

## Build Optimization

The root page is now **static** (○ in build output):
- Prerendered at build time
- No server-side rendering needed
- Faster page loads
- Better SEO

## Testing
- ✅ Production build passes
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Migrations ran successfully
- ✅ All 26 routes compiled successfully

## Files Modified
- `src/app/page.tsx` - Simplified to public landing page only
