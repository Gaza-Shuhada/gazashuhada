# Manual Testing Guide - MOH CSV Uploads

## Prerequisites

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the app**
   - Open browser: `http://localhost:3000`
   - Sign in as Admin user

3. **Verify admin access**
   - You should see "Bulk Uploads" in the navigation

## Step-by-Step Upload Process

### Phase 1: Clear Existing Data (Optional)

If you want to start fresh, you can:
1. Go to Bulk Uploads page
2. Rollback all existing uploads (in reverse order, newest first)
3. Or use the database clearing script provided below

### Phase 2: Upload CSV Files Sequentially

Upload each file in chronological order:

#### 1. Upload: 2024-01-05.csv
- File: `moh-updates/2024-01-05.csv`
- Label: `MOH Update - January 5, 2024`
- Date Released: `2024-01-05`
- Expected: ~14,140 **inserts** (new records)

#### 2. Upload: 2024-03-29.csv
- File: `moh-updates/2024-03-29.csv`
- Label: `MOH Update - March 29, 2024`
- Date Released: `2024-03-29`
- Expected: ~6,250 inserts, ~14,140 updates

#### 3. Upload: 2024-04-30.csv
- File: `moh-updates/2024-04-30.csv`
- Label: `MOH Update - April 30, 2024`
- Date Released: `2024-04-30`
- Expected: ~4,282 inserts, some updates

#### 4. Upload: 2024-06-30.csv
- File: `moh-updates/2024-06-30.csv`
- Label: `MOH Update - June 30, 2024`
- Date Released: `2024-06-30`
- Expected: ~3,513 inserts, some updates

#### 5. Upload: 2024-08-31.csv
- File: `moh-updates/2024-08-31.csv`
- Label: `MOH Update - August 31, 2024`
- Date Released: `2024-08-31`
- Expected: ~6,159 inserts, some updates

#### 6. Upload: 2025-03-23.csv
- File: `moh-updates/2025-03-23.csv`
- Label: `MOH Update - March 23, 2025`
- Date Released: `2025-03-23`
- Expected: ~15,676 inserts, some updates (first with English names!)

#### 7. Upload: 2025-06-15.csv
- File: `moh-updates/2025-06-15.csv`
- Label: `MOH Update - June 15, 2025`
- Date Released: `2025-06-15`
- Expected: ~5,182 inserts, some updates

#### 8. Upload: 2025-07-15.csv
- File: `moh-updates/2025-07-15.csv`
- Label: `MOH Update - July 15, 2025`
- Date Released: `2025-07-15`
- Expected: ~3,178 inserts, some updates

#### 9. Upload: 2025-07-31.csv
- File: `moh-updates/2025-07-31.csv`
- Label: `MOH Update - July 31, 2025`
- Date Released: `2025-07-31`
- Expected: ~1,819 inserts, some updates

## Upload Process for Each File

1. **Navigate to Bulk Uploads**
   - Click "Bulk Uploads" in the sidebar

2. **Click "Upload New Bulk File"**

3. **Fill in the form:**
   - Select CSV file from `moh-updates/` folder
   - Enter Label (e.g., "MOH Update - January 5, 2024")
   - Enter Date Released (e.g., "2024-01-05")

4. **Click "Simulate Upload"**
   - Review the simulation results
   - Check inserts, updates, deletes counts
   - Review sample changes

5. **Click "Apply Upload"**
   - Wait for confirmation
   - Check the success message

6. **Verify in Bulk Uploads List**
   - Should see the new upload at the top
   - Check the stats (inserts/updates/deletes)

7. **Repeat for next file**

## What to Watch For

### ✅ Success Indicators
- No error messages
- Simulation shows expected changes
- Upload completes successfully
- Stats look reasonable

### 🔍 Things to Verify

**For early files (2024-01-05):**
- All records should be INSERTs (first upload)
- No English names (nameEnglish = null)

**For later files (2025-03-23 onwards):**
- Should have some INSERTs and UPDATEs
- All records should have English names
- Check a few records in the database to verify nameEnglish field

**For all files:**
- Gender should be normalized (M/F → MALE/FEMALE)
- Dates should be in YYYY-MM-DD format
- Empty DOB should be handled gracefully

### ❌ Potential Issues

**"Missing required column(s)"**
- CSV headers not matching expected format
- Should not happen with MOH files

**"Invalid gender"**
- Gender value not M/F/O
- Should not happen with MOH files

**"Failed to apply"**
- Check console logs
- May need to rollback previous upload

## Tracking Your Results

Create a simple spreadsheet or note to track:

| Upload # | Date Released | File | Inserts | Updates | Deletes | Total Records | Notes |
|----------|--------------|------|---------|---------|---------|---------------|-------|
| 1 | 2024-01-05 | 2024-01-05.csv | | | | 14,140 | First upload |
| 2 | 2024-03-29 | 2024-03-29.csv | | | | 20,390 | |
| ... | | | | | | | |

## After All Uploads

### Final Verification

1. **Check total records:**
   ```sql
   SELECT COUNT(*) FROM "Person" WHERE "isDeleted" = false;
   ```
   Expected: ~60,199 active records

2. **Check English names:**
   ```sql
   SELECT COUNT(*) FROM "Person" WHERE "nameEnglish" IS NOT NULL;
   ```
   Expected: ~223,801 records with English names

3. **Check versions:**
   ```sql
   SELECT "changeType", COUNT(*) FROM "PersonVersion" GROUP BY "changeType";
   ```

4. **View sample record:**
   ```sql
   SELECT "name", "nameEnglish", "gender", "dateOfBirth" 
   FROM "Person" 
   WHERE "nameEnglish" IS NOT NULL 
   LIMIT 5;
   ```

### Rollback Testing (Optional)

If you want to test rollback:
1. Go to Bulk Uploads list
2. Click "Rollback" on the most recent upload
3. Verify the stats (should reverse the changes)
4. Check database counts
5. Re-upload the file to restore

## Tips

- **Take your time**: Each upload may take 10-30 seconds
- **Use simulation first**: Always simulate before applying
- **Keep notes**: Track the stats for each upload
- **Watch the console**: Check browser console for any errors
- **Database checks**: Periodically check the database between uploads

## Need to Start Over?

If something goes wrong and you want to start fresh, use the clear data script:

```bash
npx tsx scripts/clear-database.ts
```

Then start from upload #1 again.

---

**Good luck with your testing!** 🚀

If you encounter any issues, check:
1. Console logs (browser and server)
2. Database state
3. Migration status
4. File permissions

