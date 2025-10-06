# feat: Add Prisma migrations to Vercel build process

## Overview
Updated build script to run database migrations before building the Next.js app in production. This ensures the database schema is always up-to-date when deploying to Vercel.

## Changes

### Updated Build Script (`package.json`)
**Before:**
```json
"build": "next build --turbopack"
```

**After:**
```json
"build": "prisma migrate deploy && prisma generate && next build --turbopack"
```

## What This Does

### In Vercel (Production)
When Vercel builds your app, it now:
1. **`prisma migrate deploy`** - Applies any pending database migrations
2. **`prisma generate`** - Generates the Prisma Client
3. **`next build --turbopack`** - Builds the Next.js application

This ensures your database schema is always in sync with your code.

### Locally (Development)
- Use `npm run dev` for development (doesn't run migrations)
- Running `npm run build` locally requires `DATABASE_URL` in `.env.local`
- If you get "DATABASE_URL not found" locally, that's expected - just use `npm run dev` instead

## Why This Matters

### Before This Change
- Database migrations had to be run manually in production
- Schema could be out of sync with code after deployment
- Potential for runtime errors if schema not updated

### After This Change
- ✅ Migrations run automatically on every deployment
- ✅ Database schema always matches the deployed code
- ✅ No manual intervention needed
- ✅ Fixes potential issues from GitHub Issues #1 and #2

## Vercel Configuration

No changes needed in Vercel dashboard - it will automatically use the build script from `package.json`.

### Required Environment Variables (Vercel)
Make sure these are set in Vercel dashboard:
- `DATABASE_URL` - PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

## Testing

### Local Testing (Optional)
If you want to test the build locally:
```bash
# Add DATABASE_URL to .env.local
echo "DATABASE_URL=your-postgres-url" >> .env.local

# Then build
npm run build
```

### Vercel Testing
- Push this change to GitHub
- Vercel will automatically run the new build script
- Check deployment logs to see migrations being applied

## Files Modified
- `package.json` - Updated build script

## Related Issues
This may help resolve:
- GitHub Issue #1: "Bulk Upload - Failed to simulate upload"
- GitHub Issue #2: "Propose new record - Internal server error"

By ensuring migrations run before build, the database schema will be up-to-date.
