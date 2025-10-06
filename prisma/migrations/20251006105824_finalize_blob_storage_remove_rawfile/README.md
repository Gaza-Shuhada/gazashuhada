# Migration: Finalize Blob Storage - Remove rawFile

**Date**: 2025-10-06  
**Type**: Schema Cleanup  
**Breaking**: No (Blob storage already in use)

## Overview

This migration finalizes the Blob storage implementation by removing all backwards compatibility code. It makes Blob storage fields required and drops the legacy `rawFile` column.

## Changes

### Schema Changes
- **Made required** (changed from nullable):
  - `fileUrl` - Vercel Blob URL (String NOT NULL)
  - `fileSize` - File size in bytes (Int NOT NULL)
  - `fileSha256` - SHA-256 hash (String NOT NULL)
  - `contentType` - MIME type (String NOT NULL, default: 'text/csv')

- **Dropped column**:
  - `rawFile` (Bytes) - Legacy storage, no longer needed

### Migration SQL
1. Sets NOT NULL constraint on all Blob storage fields
2. Drops the `rawFile` column entirely

## Prerequisites

**IMPORTANT**: Before running this migration, ensure:
- All new uploads are using Blob storage (automatic after previous migration)
- No legacy records exist with NULL `fileUrl` values

To verify:
```sql
SELECT COUNT(*) FROM "BulkUpload" WHERE "fileUrl" IS NULL;
-- Must return 0
```

If you have legacy records, you must either:
1. Delete them: `DELETE FROM "BulkUpload" WHERE "fileUrl" IS NULL;`
2. Or run the backfill script first (NOT RECOMMENDED - we're moving fast)

## Running the Migration

```bash
# Apply migration
npx prisma migrate deploy

# Regenerate Prisma client
npx prisma generate
```

## Impact

### Positive
- ✅ Clean schema without technical debt
- ✅ Required fields enforced at database level
- ✅ No more null checks needed in code
- ✅ Smaller database (no BYTES column)
- ✅ Clearer data model

### Breaking Changes
- ❌ Cannot create BulkUpload records without Blob fields
- ❌ Old code referencing `rawFile` will fail (already removed from codebase)

## Rollback

**WARNING**: This migration is destructive. Rollback is NOT possible because:
1. The `rawFile` column data will be permanently deleted
2. Blob storage is the new source of truth

If you need to rollback:
1. Manually recreate the `rawFile` column:
   ```sql
   ALTER TABLE "BulkUpload" ADD COLUMN "rawFile" BYTEA;
   ```
2. Download files from Blob and store in `rawFile` (manual process)

**Recommendation**: Don't rollback. Move forward with Blob storage.

## Verification

After migration, verify everything works:

```bash
# Check schema is correct
npx prisma validate

# Check a BulkUpload record
SELECT id, filename, fileUrl, fileSize, fileSha256 
FROM "BulkUpload" 
LIMIT 1;
```

All fields should have values (no NULLs).

---

**Philosophy**: Move fast, no cruft. Blob storage is the way forward.

