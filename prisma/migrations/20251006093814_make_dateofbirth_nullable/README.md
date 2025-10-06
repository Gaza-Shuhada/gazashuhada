# Migration: Make dateOfBirth Nullable

**Date**: 2024-10-06
**Purpose**: Support MOH CSV files that don't include date of birth for some records

## Changes

This migration makes the `dateOfBirth` field nullable in both:
- `Person` table
- `PersonVersion` table

## Reason

The Ministry of Health (MOH) CSV files contain records where the date of birth (`dob` column) is empty for some individuals. To accommodate this real-world data, we need to allow `NULL` values for `dateOfBirth`.

## Impact

- Existing records with `dateOfBirth` values remain unchanged
- New records can be inserted without a `dateOfBirth`
- Application code has been updated to handle nullable dates throughout the bulk upload flow

## Related Changes

This migration is part of a larger update to support MOH CSV file format:
- Updated CSV parser to accept MOH column names: `id`, `name_ar_raw`, `sex`, `dob`
- Added support for multiple date formats (YYYY-MM-DD and MM/DD/YYYY)
- Made gender parsing more flexible (M/F → MALE/FEMALE)
- Allowed optional columns: `index`, `name_en`, `age`, `source`

## Testing

All 9 MOH CSV files from `moh-updates/` directory have been tested and parse successfully:
- 2024-01-05.csv: 14,140 rows
- 2024-03-29.csv: 20,390 rows
- 2024-04-30.csv: 24,672 rows
- 2024-06-30.csv: 28,185 rows
- 2024-08-31.csv: 34,344 rows
- 2025-03-23.csv: 50,020 rows
- 2025-06-15.csv: 55,202 rows
- 2025-07-15.csv: 58,380 rows
- 2025-07-31.csv: 60,199 rows

## Deployment Note

If you encounter database connection issues when running `prisma migrate deploy`, the migration SQL file is simple and can be manually executed:

```sql
-- AlterTable: Make dateOfBirth nullable in Person table
ALTER TABLE "Person" ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- AlterTable: Make dateOfBirth nullable in PersonVersion table
ALTER TABLE "PersonVersion" ALTER COLUMN "dateOfBirth" DROP NOT NULL;
```

