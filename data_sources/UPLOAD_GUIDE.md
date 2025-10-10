# MOH CSV Upload Quick Guide

## Supported File Format

Your CSV files should have these **required columns** (case-insensitive):
- `id` - External identifier (unique ID)
- `name_ar_raw` - Arabic name
- `sex` - Gender (M, F, or O)
- `dob` - Date of birth (YYYY-MM-DD or MM/DD/YYYY, can be empty)

**Optional columns**:
- `name_en` - English translation of name (will be imported as `nameEnglish`)
- `index`, `age`, `source` - These will be ignored

## Examples

### Minimal CSV (without English names)
```csv
id,name_ar_raw,sex,dob
123456,أحمد محمد علي,M,1990-12-25
123457,فاطمة حسن,F,
```

### Full CSV with English names
```csv
index,name_en,name_ar_raw,age,dob,sex,id,source
1,Ahmad Mohammed Ali,أحمد محمد علي,34,1990-12-25,M,123456,h
2,Fatima Hassan,فاطمة حسن,28,,F,123457,h
```

**Note**: When `name_en` is provided, it will be stored in the database as `nameEnglish` and can be used for searches and display.

## Gender Values

Accept both short and long forms:
- **Male**: `M`, `m`, `MALE`, `male`
- **Female**: `F`, `f`, `FEMALE`, `female`
- **Other**: `O`, `o`, `OTHER`, `other`

## Date Formats

Both formats are accepted and will be normalized:
- ISO format: `1990-12-25` (YYYY-MM-DD)
- US format: `12/25/1990` (MM/DD/YYYY)
- Empty: Just leave blank (some MOH records don't have DOB)

## Upload Process

1. Go to **Bulk Uploads** page
2. Click **Upload New Bulk File**
3. Select your CSV file from `data_sources/` folder
4. Enter a **Label** (e.g., "MOH Update - March 2024")
5. Enter **Date Released** (when MOH published the data)
6. Click **Simulate Upload** to preview changes
7. Review the simulation results:
   - How many inserts (new records)
   - How many updates (changed records)
   - How many deletes (records not in new file)
8. If satisfied, click **Apply Upload**

## Important Notes

✅ **All files have been tested and will work**

⚠️ **Upload in chronological order** to maintain data integrity:
1. Start with 2024-01-05.csv
2. Then 2024-03-29.csv
3. Continue in date order
4. End with 2025-07-31.csv

🔄 **Rollback capability**: If something goes wrong, you can rollback any upload (LIFO - Last In, First Out)

📊 **Simulation first**: Always simulate before applying to see what changes will be made

## Common Error Messages

### "Missing required column(s)"
- Check your CSV has: `id`, `name_ar_raw`, `sex`, `dob`
- Column names are case-insensitive
- `name_en` is optional (recommended)

### "Invalid gender"
- Must be M/F/O (or MALE/FEMALE/OTHER)
- Check for typos

### "Invalid date_of_birth"
- Must be YYYY-MM-DD or MM/DD/YYYY
- Or empty (no value)

### "external_id cannot be empty"
- The `id` column cannot have empty values
- Each row must have a unique ID

## Questions?

See the full documentation in `MOH_CSV_UPDATE_SUMMARY.md` in the project root.

