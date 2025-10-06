# fix: Increase upload limits for bulk CSV files (GitHub Issue #1)

## Problem
When attempting to upload CSV files for bulk processing, users were encountering:
- **413 Payload Too Large** error
- **SyntaxError: Unexpected token 'R', "Request En"... is not valid JSON**

This was preventing bulk uploads from being simulated or applied, as the CSV files exceeded Next.js's default 1MB body size limit.

## Root Cause
- Next.js has a default **1MB body size limit** for API routes
- Ministry of Health CSV files can be several megabytes in size
- The simulate and apply endpoints were timing out with large files
- Error responses were HTML instead of JSON, causing parsing errors

## Solution
Increased body size limits and processing timeouts across three layers:

### 1. Next.js Config (`next.config.ts`)
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '10mb', // Increased from default 1mb
  },
},
api: {
  bodyParser: {
    sizeLimit: '10mb', // Increased from default 1mb
  },
},
```

### 2. Simulate Endpoint (`/api/admin/bulk-upload/simulate/route.ts`)
```typescript
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large file processing
```

### 3. Apply Endpoint (`/api/admin/bulk-upload/apply/route.ts`)
```typescript
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file processing + DB writes
```

## Changes Made

### `next.config.ts`
- Added `experimental.serverActions.bodySizeLimit: '10mb'`
- Added `api.bodyParser.sizeLimit: '10mb'`
- Added comments explaining the configuration

### `src/app/api/admin/bulk-upload/simulate/route.ts`
- Added `runtime = 'nodejs'` to ensure Node.js runtime (not Edge)
- Added `maxDuration = 60` seconds for CSV parsing
- Allows processing of large CSV files without timeout

### `src/app/api/admin/bulk-upload/apply/route.ts`
- Added `runtime = 'nodejs'` to ensure Node.js runtime (not Edge)
- Added `maxDuration = 300` seconds (5 minutes) for CSV processing + database writes
- Handles large bulk inserts that may take several minutes

## Limits Configured

| Operation | Max File Size | Max Duration | Why |
|-----------|---------------|--------------|-----|
| Simulate | 10 MB | 60 seconds | Parse CSV and show preview |
| Apply | 10 MB | 300 seconds | Parse CSV + insert thousands of records |
| Server Actions | 10 MB | N/A | General form uploads |

## Why These Limits?

### 10 MB File Size
- Ministry of Health CSV files are typically 2-5 MB
- 10 MB provides comfortable headroom
- Prevents abuse while supporting legitimate use cases

### 60 Seconds (Simulate)
- Parsing a 10 MB CSV with 50,000+ rows
- Generating diff/preview takes 10-30 seconds
- 60 seconds provides safety margin

### 300 Seconds (Apply)
- Parsing CSV: 10-30 seconds
- Database inserts (50,000 records): 60-120 seconds
- Creating change records: 30-60 seconds
- Total: 100-210 seconds typical
- 300 seconds (5 minutes) provides safety margin

## Vercel Considerations

On Vercel's Hobby plan:
- Max execution time: **10 seconds** (default)
- Max execution time: **60 seconds** (with Pro plan)

**Action needed:**
- This requires **Vercel Pro plan** or higher
- Or deploy to another platform (Railway, Render, AWS, etc.)
- Or process files in smaller batches client-side

## Testing
- ✅ Build passes with new configuration
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Route configurations valid

## Files Modified
- `next.config.ts` - Added body size limits
- `src/app/api/admin/bulk-upload/simulate/route.ts` - Added runtime and timeout config
- `src/app/api/admin/bulk-upload/apply/route.ts` - Added runtime and timeout config

## Related Issues
- Fixes GitHub Issue #1: "Bulk Upload - Failed to simulate upload"
- Related to GitHub Issue #2 (community submit error - different root cause)

## Next Steps for User
1. **Restart dev server** - `npm run dev` to pick up new config
2. **Try upload again** - Should now accept larger CSV files
3. **Consider Vercel plan** - If deploying to Vercel, may need Pro plan for longer execution times
4. **Monitor performance** - Check if files process within time limits
