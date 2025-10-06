# Expected Upload Statistics - MOH CSV Files

## Quick Reference

Use this guide while manually uploading to verify you're getting the expected results.

---

## Upload #1: 2024-01-05.csv
**Date Released:** January 5, 2024  
**Records in File:** 14,140

### Expected Results:
- ✅ **Inserts:** 14,140 (100% - first upload, all new)
- ✅ **Updates:** 0
- ✅ **Deletes:** 0
- ✅ **English Names:** 0 (early file, no name_en column)

### Notes:
- This is the baseline/first upload
- All records should be insertions
- No English names in this file
- Records have minimal data (id, name_ar_raw, dob, sex)

---

## Upload #2: 2024-03-29.csv
**Date Released:** March 29, 2024  
**Records in File:** 20,390

### Expected Results:
- ✅ **Inserts:** ~6,250 (new records added since last update)
- ✅ **Updates:** ~14,140 (updates to existing records)
- ✅ **Deletes:** 0 (no records removed)
- ✅ **English Names:** 0 (still no name_en column)

### Notes:
- Contains some new records
- Updates to previously uploaded records
- Has some dates in MM/DD/YYYY format (will be converted)

---

## Upload #3: 2024-04-30.csv
**Date Released:** April 30, 2024  
**Records in File:** 24,672

### Expected Results:
- ✅ **Inserts:** ~4,282 (new records)
- ✅ **Updates:** Variable (changes to existing)
- ✅ **Deletes:** 0
- ✅ **English Names:** 0

---

## Upload #4: 2024-06-30.csv
**Date Released:** June 30, 2024  
**Records in File:** 28,185

### Expected Results:
- ✅ **Inserts:** ~3,513 (new records)
- ✅ **Updates:** Variable
- ✅ **Deletes:** 0
- ✅ **English Names:** 0

---

## Upload #5: 2024-08-31.csv
**Date Released:** August 31, 2024  
**Records in File:** 34,344

### Expected Results:
- ✅ **Inserts:** ~6,159 (new records)
- ✅ **Updates:** Variable
- ✅ **Deletes:** 0
- ✅ **English Names:** 0

---

## Upload #6: 2025-03-23.csv ⭐
**Date Released:** March 23, 2025  
**Records in File:** 50,020

### Expected Results:
- ✅ **Inserts:** ~15,676 (significant increase)
- ✅ **Updates:** Variable
- ✅ **Deletes:** 0
- ✅ **English Names:** 50,020 (100% - FIRST FILE WITH ENGLISH NAMES!)

### Notes:
- **Major change:** This is the first file with `name_en` column
- All records should have nameEnglish populated
- Updates will include both name changes AND adding English names to old records
- File includes full metadata (index, name_en, age, source)

---

## Upload #7: 2025-06-15.csv
**Date Released:** June 15, 2025  
**Records in File:** 55,202

### Expected Results:
- ✅ **Inserts:** ~5,182 (new records)
- ✅ **Updates:** Variable (including English name additions)
- ✅ **Deletes:** 0
- ✅ **English Names:** 55,202 (100%)

---

## Upload #8: 2025-07-15.csv
**Date Released:** July 15, 2025  
**Records in File:** 58,380

### Expected Results:
- ✅ **Inserts:** ~3,178 (new records)
- ✅ **Updates:** Variable
- ✅ **Deletes:** 0
- ✅ **English Names:** 58,380 (100%)

---

## Upload #9: 2025-07-31.csv (Latest)
**Date Released:** July 31, 2025  
**Records in File:** 60,199

### Expected Results:
- ✅ **Inserts:** ~1,819 (new records)
- ✅ **Updates:** Variable
- ✅ **Deletes:** 0
- ✅ **English Names:** 60,199 (100%)

### Notes:
- This is the most recent/complete dataset
- Should have the most comprehensive English name coverage

---

## Final Expected Database State

After all 9 uploads complete:

### Total Records
- **Active Persons:** 60,199
- **Total Versions:** ~170,000+ (includes all insert/update operations)
- **Bulk Uploads:** 9

### Field Coverage
- **Records with English Names:** 60,199 (100% of final dataset)
- **Records with Date of Birth:** Variable (some have null)
- **Gender Distribution:** Mix of MALE/FEMALE

### Change Type Breakdown (Approximate)
- **Total Inserts:** ~60,199 (each person inserted once)
- **Total Updates:** ~110,000+ (cumulative updates across all uploads)
- **Total Deletes:** 0 (MOH doesn't remove records, only adds/updates)

---

## How to Verify

### After Each Upload:
1. Check the stats shown in the UI match expectations
2. Look at the "Inserts" - should decrease over time as more records exist
3. Look at "Updates" - should increase over time
4. After upload #6, verify English names are populated

### Database Queries to Run:

**Check total active records:**
```sql
SELECT COUNT(*) as total_persons 
FROM "Person" 
WHERE "isDeleted" = false;
```

**Check English name coverage:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT("nameEnglish") as with_english,
  ROUND(COUNT("nameEnglish")::numeric / COUNT(*) * 100, 1) as percentage
FROM "Person" 
WHERE "isDeleted" = false;
```

**Check change type distribution:**
```sql
SELECT 
  "changeType", 
  COUNT(*) as count
FROM "PersonVersion"
GROUP BY "changeType"
ORDER BY count DESC;
```

**View sample records with English names:**
```sql
SELECT 
  "externalId",
  "name",
  "nameEnglish",
  "gender",
  "dateOfBirth"
FROM "Person"
WHERE "nameEnglish" IS NOT NULL
LIMIT 10;
```

**Check upload history:**
```sql
SELECT 
  "filename",
  "label",
  "dateReleased",
  "uploadedAt"
FROM "BulkUpload"
ORDER BY "dateReleased" ASC;
```

---

## Troubleshooting

### If Inserts are 0 on first upload:
- ❌ Problem: Database wasn't cleared
- ✅ Solution: Run `npx tsx scripts/clear-database.ts`

### If Updates are 0 on later uploads:
- ⚠️ This is unusual but possible if data is identical
- Check if you uploaded the same file twice

### If Deletes are > 0:
- ⚠️ This means records in the database aren't in the new file
- Verify you're uploading files in chronological order
- Each file should be cumulative (include all previous records + new ones)

### If English Names are 0 after upload #6:
- ❌ Problem: name_en column not being imported
- ✅ Check that the file has name_en column
- ✅ Check console logs for errors

---

## Timeline Tracking Template

Use this to track your actual results:

| # | Date | File | Inserts | Updates | Deletes | With English | Duration | ✓ |
|---|------|------|---------|---------|---------|--------------|----------|---|
| 1 | 2024-01-05 | 2024-01-05.csv | | | | 0 | | ⬜ |
| 2 | 2024-03-29 | 2024-03-29.csv | | | | 0 | | ⬜ |
| 3 | 2024-04-30 | 2024-04-30.csv | | | | 0 | | ⬜ |
| 4 | 2024-06-30 | 2024-06-30.csv | | | | 0 | | ⬜ |
| 5 | 2024-08-31 | 2024-08-31.csv | | | | 0 | | ⬜ |
| 6 | 2025-03-23 | 2025-03-23.csv | | | | 50,020 | | ⬜ |
| 7 | 2025-06-15 | 2025-06-15.csv | | | | 55,202 | | ⬜ |
| 8 | 2025-07-15 | 2025-07-15.csv | | | | 58,380 | | ⬜ |
| 9 | 2025-07-31 | 2025-07-31.csv | | | | 60,199 | | ⬜ |

---

**Happy Testing! 🎯**

