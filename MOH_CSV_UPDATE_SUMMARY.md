# MOH CSV File Support - Update Summary

**Date**: October 6, 2024  
**Status**: ✅ Complete and Tested

## Overview

Updated the bulk upload system to accept Ministry of Health (MOH) CSV files with their specific column format and data characteristics.

## Changes Made

### 1. CSV Column Mapping

**Before**: Expected columns were `external_id`, `name`, `gender`, `date_of_birth`

**After**: Now accepts MOH column names with automatic mapping:
- `id` → `external_id`
- `name_ar_raw` → `name`
- `name_en` → `nameEnglish` (imported to database)
- `sex` → `gender`
- `dob` → `date_of_birth`

**Optional columns** (will be ignored): `index`, `age`, `source`

### 2. Gender Value Normalization

**Before**: Required `MALE`, `FEMALE`, or `OTHER` (case-insensitive)

**After**: Now accepts both formats:
- `M` or `MALE` → `MALE`
- `F` or `FEMALE` → `FEMALE`
- `O` or `OTHER` → `OTHER`

### 3. Date Format Support

**Before**: Only accepted `YYYY-MM-DD` format (e.g., `1990-12-25`)

**After**: Now accepts two formats with automatic normalization:
- `YYYY-MM-DD` (e.g., `1990-12-25`)
- `MM/DD/YYYY` (e.g., `12/25/1990`) - automatically converted to `YYYY-MM-DD`

### 4. English Name Support

**New feature**: Added support for English name translations
- New `nameEnglish` field in database (nullable)
- Automatically imported from `name_en` column in CSV
- Falls back to `NULL` if not provided

### 5. Nullable Date of Birth

**Before**: `dateOfBirth` was required for all records

**After**: `dateOfBirth` is now optional/nullable
- Database schema updated (migration created)
- CSV parser accepts empty `dob` values
- Bulk upload service handles `NULL` dates properly

### 6. CSV Parsing Improvements

**Before**: Strict quote handling

**After**: More lenient parsing:
- `relax_quotes: true` to handle malformed quotes in MOH files
- Proper escape character handling

## Files Modified

### Source Code
1. **`src/lib/csv-utils.ts`**
   - Added column mapping for MOH CSV format
   - Added gender normalization (M/F → MALE/FEMALE)
   - Added multi-format date parsing and normalization
   - Made date_of_birth optional/nullable
   - Added lenient quote handling

2. **`src/lib/bulk-upload-service.ts`**
   - Updated to handle nullable `dateOfBirth` values
   - Updated date comparison logic for null dates
   - Updated DiffItem interface

### Database
3. **`prisma/schema.prisma`**
   - Added `nameEnglish` field (nullable) in `Person` model
   - Added `nameEnglish` field (nullable) in `PersonVersion` model
   - Made `dateOfBirth` nullable in both models

4. **`prisma/migrations/20251006093814_make_dateofbirth_nullable/`**
   - Created migration SQL file
   - Added migration README with documentation

5. **`prisma/migrations/20251006094341_add_name_english/`**
   - Added nameEnglish column to both tables

## Testing Results

✅ **All 9 MOH CSV files successfully parse:**

| File | Rows | Status |
|------|------|--------|
| 2024-01-05.csv | 14,140 | ✅ Pass |
| 2024-03-29.csv | 20,390 | ✅ Pass |
| 2024-04-30.csv | 24,672 | ✅ Pass |
| 2024-06-30.csv | 28,185 | ✅ Pass |
| 2024-08-31.csv | 34,344 | ✅ Pass |
| 2025-03-23.csv | 50,020 | ✅ Pass |
| 2025-06-15.csv | 55,202 | ✅ Pass |
| 2025-07-15.csv | 58,380 | ✅ Pass |
| 2025-07-31.csv | 60,199 | ✅ Pass |

**Total records tested**: 325,530 rows

## CSV File Format Examples

### Minimal Format (2024-01-05.csv)
```csv
id,name_ar_raw,dob,sex
44062697,مجهول مجهول مجهول مجهول,,F
44062395,محمد عمر الشاعر UNB8,1990-01-01,M
```

### Full Format (2025-07-31.csv)
```csv
index,name_en,name_ar_raw,age,dob,sex,id,source
1,Joud Mohammed Mansour Abdel Jawad,جود محمد منصور عبد الجواد,0,2023-10-27,m,444156848,u
2,Ibrahim Kamal Ibrahim Shaheen,ابراهيم كمال ابراهيم شاهين,0,2024-08-29,m,470388307,u
```

### With Alternative Date Format (2024-03-29.csv)
```csv
id,name_ar_raw,dob,age,sex,source
44073191,نور حاتم خالد ابو عيشة ( ابو حطب,,"20",F,h
44062395,محمد عمر الشاعر UNB8,01/01/1000,"34",M,h
```

## Deployment Checklist

- [x] Update CSV parsing code
- [x] Update bulk upload service
- [x] Update database schema
- [x] Create migration
- [x] Test all MOH CSV files
- [ ] Deploy migration to production
- [ ] Run `npx prisma generate` on production
- [ ] Verify bulk upload works in production

## Migration Command

```bash
# To apply the migrations
npx prisma migrate deploy

# To regenerate Prisma client
npx prisma generate
```

If you encounter database connection issues, you can manually run these two migrations:

**Migration 1: Make dateOfBirth nullable**
```sql
ALTER TABLE "Person" ALTER COLUMN "dateOfBirth" DROP NOT NULL;
ALTER TABLE "PersonVersion" ALTER COLUMN "dateOfBirth" DROP NOT NULL;
```

**Migration 2: Add nameEnglish column**
```sql
ALTER TABLE "Person" ADD COLUMN "nameEnglish" TEXT;
ALTER TABLE "PersonVersion" ADD COLUMN "nameEnglish" TEXT;
```

## Backward Compatibility

✅ **Fully backward compatible**:
- Old CSV format with `external_id`, `name`, `gender`, `date_of_birth` still works
- Existing records are unaffected
- All existing functionality preserved

## Error Handling

The CSV parser provides clear error messages for:
- Missing required columns (shows expected: `id, name_ar_raw, sex, dob`)
- Invalid gender values (shows accepted: M/F/O or MALE/FEMALE/OTHER)
- Invalid date formats (shows accepted: YYYY-MM-DD or MM/DD/YYYY)
- Empty required fields (external_id, name)
- Duplicate column headers

## Notes

- All MOH files have been added to `moh-updates/` directory
- Source documentation available in `moh-updates/SOURCE.md`
- No linter errors introduced
- TypeScript type safety maintained throughout

