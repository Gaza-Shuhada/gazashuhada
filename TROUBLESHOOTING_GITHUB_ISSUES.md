# Troubleshooting Guide for GitHub Issues #1 and #2

## 📋 Overview

This guide helps diagnose and fix:
- **Issue #2**: "Propose new record - Internal server error"
- **Issue #1**: "Bulk Upload - Failed to simulate upload"

## 🔧 What We Fixed

### 1. Enhanced Error Logging (Commit `bb6c1b0`)
- Added detailed error messages to API responses
- Added console logging for debugging in Vercel logs
- Error responses now include `details` field with specific error messages

### 2. Database Migration on Build (Commit `b10b2f4`)
- Vercel now runs `prisma migrate deploy` before building
- Ensures database schema is always up-to-date
- Prevents "column doesn't exist" errors

## 🔍 How to Diagnose Issues

### Step 1: Check Error Details in App

Users should now see specific error messages instead of generic "Internal server error":

**Before:**
```json
{
  "error": "Internal server error"
}
```

**Now:**
```json
{
  "error": "Internal server error",
  "details": "Missing required field: externalId"  // ← Specific error!
}
```

Ask users to **share the `details` field** from the error message.

---

### Step 2: Check Vercel Logs

Go to: **Vercel Dashboard → Your Project → Logs**

Look for these log entries:

#### For Issue #2 (Community Submit):
```
[Community Submit] User: user_xyz123 Role: admin
[Community Submit] Error: ...actual error...
[Community Submit] Error stack: ...full trace...
```

#### For Issue #1 (Bulk Upload):
```
[Bulk Upload Simulate] User: user_xyz123 Role: admin
[Bulk Upload Simulate] Error: ...actual error...
[Bulk Upload Simulate] Error stack: ...full trace...
```

---

## 🐛 Common Issues & Solutions

### Issue #2: "Propose new record - Internal server error"

#### Possible Cause 1: Missing Environment Variables

**Check in Vercel Dashboard → Settings → Environment Variables:**

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

**Fix:** Add missing environment variables, then redeploy.

---

#### Possible Cause 2: Database Not Migrated

**Symptoms:**
- Error message mentions "column does not exist"
- Error mentions "table does not exist"

**Fix:**
✅ Already fixed! New deployments automatically run migrations.

**Manual fix (if needed):**
```bash
# In Vercel project terminal or locally with production DATABASE_URL:
npx prisma migrate deploy
```

---

#### Possible Cause 3: Invalid Data Format

**Symptoms:**
- Error mentions "Invalid gender value"
- Error mentions "Invalid date format"
- Error mentions "Missing required field"

**Fix:** Check the data being submitted:

**Required fields for new record:**
- `externalId` (string)
- `name` (string)
- `gender` (must be: "MALE", "FEMALE", or "OTHER")
- `dateOfBirth` (format: "YYYY-MM-DD")

**Optional fields:**
- `dateOfDeath` (format: "YYYY-MM-DD")
- `locationOfDeathLat` (number between -90 and 90)
- `locationOfDeathLng` (number between -180 and 180)
- `obituary` (string)
- `photoUrlThumb` (string)
- `photoUrlOriginal` (string)

---

#### Possible Cause 4: Duplicate External ID

**Symptoms:**
- Error: "A person with this External ID already exists"

**Fix:** Use "Suggest Edit" instead of "Propose New Record" for existing records.

---

### Issue #1: "Bulk Upload - Failed to simulate upload"

#### Possible Cause 1: User Not Admin

**Symptoms:**
- Error: "Unauthorized - requires admin role"
- 403 Forbidden status

**Fix:**
1. Go to **Clerk Dashboard → Users**
2. Find the user (e.g., wilgrace)
3. Click on user → Metadata → Public Metadata
4. Add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save

---

#### Possible Cause 2: Invalid CSV Format

**Symptoms:**
- Error mentions "CSV parsing failed"
- Error mentions "Invalid date format in row X"
- Error mentions "Missing required column"

**Required CSV columns:**
- `external_id` (string)
- `name` (string)
- `name_english` (string, can be empty)
- `gender` (string: "M", "F", or "Male", "Female")
- `date_of_birth` (format: "YYYY-MM-DD" or "DD/MM/YYYY")

**Optional columns:**
- `date_of_death`
- `age`

**CSV example:**
```csv
external_id,name,name_english,gender,date_of_birth
12345,محمد أحمد,Mohammad Ahmad,M,1990-01-15
67890,فاطمة علي,Fatima Ali,F,1985-03-20
```

---

#### Possible Cause 3: File Too Large

**Symptoms:**
- Error: "Transaction timeout"
- Request takes very long then fails

**Fix:**
- Split large CSV files into smaller batches (recommend <5000 rows per file)
- Or upgrade Vercel plan for longer function timeouts

---

#### Possible Cause 4: Database Connection Issues

**Symptoms:**
- Error mentions "database connection"
- Error mentions "connection timeout"

**Fix:**
1. Check `DATABASE_URL` is correct in Vercel environment variables
2. Check PostgreSQL database is running and accessible
3. Check database connection limits haven't been exceeded

---

## ✅ Checklist for wilgrace (Issue Reporter)

Ask the user to verify:

### For Issue #2 (Community Submit):
- [ ] User is logged in (check top-right corner shows user name)
- [ ] All required fields are filled (External ID, Name, Gender, Date of Birth)
- [ ] Dates are in correct format (YYYY-MM-DD)
- [ ] Gender is one of: Male, Female, Other
- [ ] If adding location: Both latitude AND longitude provided
- [ ] Share the `details` field from the error message

### For Issue #1 (Bulk Upload):
- [ ] User has admin role in Clerk (check with admin)
- [ ] CSV file has all required columns (see format above)
- [ ] CSV data is valid (no missing required fields)
- [ ] File is not too large (try smaller file first)
- [ ] Share the `details` field from the error message

---

## 📞 How to Get More Information

### Ask User to:

1. **Take screenshot of error** - Show the full error message including `details`

2. **Share what they're trying to do:**
   - For Issue #2: What data are they submitting? (without sensitive info)
   - For Issue #1: How large is the CSV? How many rows?

3. **Check their role:**
   - Go to user menu (top-right)
   - Look for role badge (Admin, Moderator, or nothing)

### Check Yourself:

1. **Vercel Logs** (last 1 hour):
   ```
   Vercel Dashboard → Project → Logs
   Filter by: Last 1 hour
   Search for: [Community Submit] or [Bulk Upload Simulate]
   ```

2. **Vercel Build Logs** (deployment):
   ```
   Vercel Dashboard → Deployments → Latest
   Check for: "prisma migrate deploy" success
   ```

3. **Database State**:
   ```bash
   # Connect to production database
   npx prisma studio --browser none
   
   # Check migrations applied
   SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;
   ```

---

## 🚀 Quick Fixes to Try

### Fix 1: Redeploy with Migrations
```bash
# Push a small change to trigger redeploy
git commit --allow-empty -m "Trigger redeploy"
git push
```

This will run migrations automatically.

---

### Fix 2: Assign Admin Role

In Clerk Dashboard:
1. Users → Find user → Metadata
2. Add to Public Metadata:
   ```json
   {"role": "admin"}
   ```
3. User needs to log out and back in

---

### Fix 3: Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables

Required:
- `DATABASE_URL` ✓
- `BLOB_READ_WRITE_TOKEN` ✓
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ✓
- `CLERK_SECRET_KEY` ✓

If any missing: Add → Redeploy

---

## 📊 Expected Behavior

### Successful Community Submit:
```json
{
  "success": true,
  "submission": {
    "id": "uuid-here",
    "type": "NEW_RECORD",
    "status": "PENDING",
    "createdAt": "2025-10-06T..."
  }
}
```

### Successful Bulk Upload Simulation:
```json
{
  "success": true,
  "simulation": {
    "summary": {
      "inserts": 100,
      "updates": 50,
      "deletes": 10,
      "unchanged": 200
    },
    "sampleInserts": [...],
    "sampleUpdates": [...],
    "sampleDeletes": [...]
  }
}
```

---

## 📝 Next Steps

1. **Ask user for error details** - Get the `details` field from error message
2. **Check Vercel logs** - Look for [Community Submit] or [Bulk Upload Simulate] entries
3. **Verify environment variables** - Ensure all required vars are set
4. **Check user role** - For bulk upload, user must be admin
5. **Review CSV format** - For bulk upload, verify CSV structure

Once you have the specific error details, you can pinpoint the exact issue and fix it! 🎯

---

## 📚 Related Documentation

- **API Documentation**: `docs/PUBLIC_AND_COMMUNITY_API.md`, `docs/ADMIN_AND_MODERATOR_API.md`
- **Database Schema**: `prisma/schema.prisma`
- **Error Handling**: See source code comments in API routes

---

**Last Updated**: 2025-10-06  
**Related Commits**: `bb6c1b0` (error logging), `b10b2f4` (migration fixes)

