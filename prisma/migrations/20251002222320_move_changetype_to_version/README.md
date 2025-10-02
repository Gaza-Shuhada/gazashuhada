# Migration: Move changeType to PersonVersion

**Date**: October 2, 2024  
**Type**: Schema Change (Breaking)

## Summary

Moved the `changeType` field from `ChangeSource` table to `PersonVersion` table.

## Rationale

A single bulk upload can contain INSERT, UPDATE, and DELETE operations simultaneously (based on `external_id` matching). Storing `changeType` at the `ChangeSource` level was misleading since one source could generate multiple operation types.

## Changes

### Schema
- ✅ Added `changeType` column to `PersonVersion` (default: INSERT)
- ✅ Removed `changeType` column from `ChangeSource`
- ✅ Added unique constraint: `PersonVersion(personId, versionNumber)`
- ✅ Added index: `PersonVersion(sourceId, changeType)`
- ✅ Added index: `PersonVersion(createdAt)`

### Data Migration
Existing records were migrated using the following logic:
```sql
UPDATE "PersonVersion" 
SET "changeType" = 
  CASE 
    WHEN "isDeleted" = true THEN 'DELETE'::"ChangeType"
    WHEN "versionNumber" = 1 THEN 'INSERT'::"ChangeType"
    ELSE 'UPDATE'::"ChangeType"
  END;
```

## Code Changes Required

### Before
```typescript
const changeType = upload.changeSource.changeType; // ❌ No longer exists
```

### After
```typescript
// Query changeType per version
const inserts = versions.filter(v => v.changeType === 'INSERT').length;
const updates = versions.filter(v => v.changeType === 'UPDATE').length;
const deletes = versions.filter(v => v.changeType === 'DELETE').length;
```

## Rollback

⚠️ **Not recommended**. If absolutely necessary:
1. Back up your database first
2. Reverse the migration by:
   - Adding `changeType` back to `ChangeSource`
   - Removing it from `PersonVersion`
   - Determining an appropriate default for `ChangeSource.changeType` (loses granularity)

## Impact

- ✅ More accurate analytics per bulk upload
- ✅ Ability to query specific operation types from a single upload
- ✅ Better data integrity with unique constraints
- ⚠️ Requires code updates for stats calculations

## Related Files

- `src/lib/bulk-upload-service.ts` - Updated to set changeType per version
- `src/app/api/admin/bulk-upload/list/route.ts` - Updated stats calculation
- See [CHANGELOG.md](../../../CHANGELOG.md) for complete change history


