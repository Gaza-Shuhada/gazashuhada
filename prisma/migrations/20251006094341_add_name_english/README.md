# Migration: Add nameEnglish Field

**Date**: 2024-10-06
**Purpose**: Store English translations of names from MOH CSV files

## Changes

This migration adds the `nameEnglish` field (nullable TEXT) to both:
- `Person` table
- `PersonVersion` table

## Reason

The Ministry of Health (MOH) CSV files from 2025 onwards include an English translation of names in the `name_en` column. To preserve this valuable data, we've added a `nameEnglish` field to store these translations.

## Impact

- Existing records remain unchanged (NULL for nameEnglish)
- New records can include English name translations
- Application code has been updated to import `name_en` → `nameEnglish`

## Coverage

Based on testing of MOH files:
- **Early files (2024)**: 0% have English names
- **Later files (2025+)**: 100% have English names  
- **Overall**: 64.8% of all 345,532 records have English names

## Related Changes

This migration is part of the MOH CSV import enhancement:
- CSV parser maps `name_en` → `name_english`
- Bulk upload service handles nullable English names
- Falls back to NULL when not provided (backward compatible)

## Usage

The `nameEnglish` field can be used for:
- Bilingual display (show both Arabic and English)
- English-language searches
- International reporting

## Testing

All 9 MOH CSV files have been tested:
- Files without `name_en`: Parse successfully, nameEnglish = NULL
- Files with `name_en`: Parse successfully, nameEnglish populated

## Deployment Note

If you encounter database connection issues when running `prisma migrate deploy`, the migration SQL file is simple and can be manually executed:

```sql
-- AlterTable: Add nameEnglish column to Person table
ALTER TABLE "Person" ADD COLUMN "nameEnglish" TEXT;

-- AlterTable: Add nameEnglish column to PersonVersion table
ALTER TABLE "PersonVersion" ADD COLUMN "nameEnglish" TEXT;
```

