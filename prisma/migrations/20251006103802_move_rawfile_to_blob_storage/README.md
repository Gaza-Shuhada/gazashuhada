# Migration: Move BulkUpload.rawFile to Blob Storage

**Date**: 2025-10-06  
**Type**: Schema + Data Migration  
**Breaking**: No (backwards compatible during transition)

## Overview

This migration moves bulk upload CSV files from PostgreSQL `BYTES` column to Vercel Blob storage, improving database performance and reducing costs.

## Changes

### Schema
- **Added** Blob storage reference columns:
  - `fileUrl` (String?) - Vercel Blob URL
  - `fileSize` (Int?) - File size in bytes
  - `fileSha256` (String?) - SHA-256 hash for integrity
  - `contentType` (String?) - MIME type (default: 'text/csv')
  - `previewLines` (String?) - Optional gzipped preview (~20 lines)

- **Kept** `rawFile` (Bytes?) - Marked as deprecated, will be removed after backfill

### Migration Strategy

**Phase 1: Add new columns (this migration)**
- New columns are nullable
- Old `rawFile` column remains
- Both old and new systems work during transition

**Phase 2: Backfill data (run migration script)**
- Script uploads existing `rawFile` data to Blob storage
- Populates new columns (`fileUrl`, `fileSize`, etc.)
- Script: `scripts/migrate-bulk-uploads-to-blob.ts`

**Phase 3: Make new columns required (future migration)**
- After all data is migrated, make new columns NOT NULL
- Drop old `rawFile` column
- Update code to require new fields

## Running the Migration

```bash
# 1. Apply schema changes
npx prisma migrate deploy

# 2. Regenerate Prisma client
npx prisma generate

# 3. Run backfill script (after implementing)
npx tsx scripts/migrate-bulk-uploads-to-blob.ts

# 4. Verify all records migrated
# Check: SELECT COUNT(*) FROM "BulkUpload" WHERE "fileUrl" IS NULL;

# 5. Apply finalization migration (future)
# This will make fileUrl/fileSize/fileSha256 NOT NULL and drop rawFile
```

## Rollback

If needed, the migration can be rolled back:
```bash
# Rollback schema
npx prisma migrate resolve --rolled-back 20251006103802_move_rawfile_to_blob_storage

# Revert schema.prisma manually
```

## Impact

- **Database size**: Reduced by ~MB per bulk upload (CSV files no longer in DB)
- **Performance**: Faster queries on BulkUpload table
- **Cost**: Lower database storage costs
- **Functionality**: No change (files accessible via Blob URL)

## Related Files

- Schema: `prisma/schema.prisma`
- Migration script: `scripts/migrate-bulk-uploads-to-blob.ts` (to be created)
- Upload endpoint: `src/app/api/admin/bulk-upload/apply/route.ts` (to be updated)
- Service layer: `src/lib/bulk-upload-service-ultra-optimized.ts` (to be updated)

