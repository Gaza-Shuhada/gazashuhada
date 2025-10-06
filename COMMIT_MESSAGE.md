# fix: Add nameEnglish field and External ID validation (GitHub Issue #2)

## Problem
Community submission form was failing with "Internal server error" when users tried to propose new records. Two root causes were identified:

### 1. Missing nameEnglish Field
Mismatch between the database schema and the form data:

**Database Schema:**
- `name` (required) - Main name, typically Arabic
- `nameEnglish` (optional) - English translation of name

**Old Form:**
- Only ONE "Full Name" field - mapped to `name` only
- `nameEnglish` was never provided, likely causing database constraint violations

**Bulk Uploads for Comparison:**
- Populate both `name` (from `name_ar_raw`) and `nameEnglish` (from `name_en`)
- This is the expected data structure throughout the system

### 2. No External ID Validation
The External ID field had minimal validation:
- Only checked "not empty"
- Accepted ANY string, including special characters
- No length limits
- Could cause database issues or conflicts

**Examples of problematic IDs:**
- `P@12345!` (special characters)
- `"DROP TABLE persons"` (SQL injection attempt)
- Very long strings (database performance issues)

## Solution

### Part 1: Add nameEnglish Field
Updated community submission form to collect both name fields:

### Frontend (`src/app/community/page.tsx`)
1. **Added `nameEnglish` to form state**
   ```typescript
   const [newRecordForm, setNewRecordForm] = useState({
     // ...
     name: '',
     nameEnglish: '',  // NEW
     // ...
   });
   ```

2. **Updated payload construction**
   ```typescript
   const payload = {
     name: newRecordForm.name,
     nameEnglish: newRecordForm.nameEnglish || null,  // NEW: null if empty
     // ...
   };
   ```

3. **Added second name input field in UI**
   - **"Full Name (Arabic)"** - Required
   - **"Full Name (English)"** - Optional
   - Clear labels to guide users

### Backend (`src/app/api/community/submit/route.ts`)
1. **Enhanced validation**
   - Validates `name` is required (already existed)
   - Validates `nameEnglish` is string or null if provided (new)
   
2. **Added detailed logging**
   - Logs full request body for debugging
   - Logs validation failures with field names
   - Logs payload before database write
   - Logs success with submission ID
   - Logs full error stack traces

### Part 2: Add External ID Validation

Added comprehensive validation for External ID format:

#### Validation Rules
```regex
^[A-Za-z0-9_-]+$
```

**Allowed:**
- ✅ Letters (A-Z, a-z)
- ✅ Numbers (0-9)
- ✅ Hyphens (-)
- ✅ Underscores (_)
- ✅ Max length: 50 characters

**Not Allowed:**
- ❌ Special characters (@, !, #, $, %, etc.)
- ❌ Spaces
- ❌ Empty strings
- ❌ Strings over 50 characters

**Valid Examples:**
- `P12345` ✅
- `MoH-2024-001` ✅
- `record_123` ✅
- `Gaza2024` ✅

**Invalid Examples:**
- `P@12345!` ❌ (special characters)
- `MoH 2024 001` ❌ (spaces)
- `record#123` ❌ (special character)
- Empty string ❌

#### Implementation
1. **Frontend (`src/app/community/page.tsx`)**
   - Added `pattern` attribute for HTML5 validation
   - Added `maxLength={50}` attribute
   - Added helper text explaining format
   - Added `title` attribute for browser tooltip

2. **Backend (`src/app/api/community/submit/route.ts`)**
   - Server-side regex validation
   - Length validation (1-50 characters)
   - Clear error messages

3. **Bulk Upload CSV (`src/lib/csv-utils.ts`)**
   - Same validation rules for consistency
   - Row-specific error messages with line numbers
   - Prevents invalid IDs in bulk uploads

## Changes Made

### `src/app/community/page.tsx`
**nameEnglish field:**
- Added `nameEnglish: ''` to `newRecordForm` state
- Updated `handleNewRecordSubmit` to include `nameEnglish` in payload
- Updated form reset to clear `nameEnglish`
- Added new input field for "Full Name (English)" in UI
- Changed "Full Name" label to "Full Name (Arabic)" for clarity

**External ID validation:**
- Added `pattern="[A-Za-z0-9_-]+"` for client-side validation
- Added `maxLength={50}` attribute
- Added helper text: "Letters, numbers, hyphens, and underscores only"
- Added `title` tooltip for validation guidance

### `src/app/api/community/submit/route.ts`
**nameEnglish validation:**
- Added `nameEnglish` type validation (string or null)
- Validates it's optional but must be correct type if provided

**External ID validation:**
- Regex validation: `/^[A-Za-z0-9_-]+$/`
- Length validation: 1-50 characters
- Clear error messages for each validation failure

**Logging:**
- Added comprehensive logging at each step:
  - User authentication
  - Request body
  - Validation failures
  - Database operations
  - Errors with stack traces

### `src/lib/csv-utils.ts`
**External ID validation for bulk uploads:**
- Regex validation: `/^[A-Za-z0-9_-]+$/`
- Length validation: 1-50 characters
- Row-specific error messages with line numbers
- Consistent with community submission validation

## Data Model Alignment

Now community submissions match the bulk upload structure:

| Field | Source | Required | Type |
|-------|--------|----------|------|
| `name` | User input (Arabic) | ✅ Yes | String |
| `nameEnglish` | User input (English) | ❌ No | String \| null |
| `externalId` | User input | ✅ Yes | String |
| `gender` | User input | ✅ Yes | Enum |
| `dateOfBirth` | User input | ✅ Yes | Date |

This matches the bulk upload CSV structure:
- `name_ar_raw` → `name`
- `name_en` → `nameEnglish`

## User Experience

### Before
- Single "Full Name" field
- Unclear if Arabic or English
- Server errors on submission
- No visibility into what went wrong

### After
- Two clear fields: "Full Name (Arabic)" and "Full Name (English)"
- Arabic required, English optional
- Detailed server logs for debugging
- Better error messages

## Testing
- ✅ Build passes
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Form UI includes both fields
- ✅ Backend validates both fields correctly
- ✅ Enhanced logging for debugging production issues

## Next Steps for User
1. **Restart dev server** to see changes
2. **Test submission** with both fields
3. **Check server logs** - should see detailed `[Community Submit]` logs
4. **Verify submission** in moderation queue

## Related Issues
- Fixes GitHub Issue #2: "Propose new record - Internal server error"
- Related to GitHub Issue #1 (bulk upload size limits - separate fix)

## Files Modified
- `src/app/community/page.tsx` - Added nameEnglish field + External ID validation
- `src/app/api/community/submit/route.ts` - Added nameEnglish validation + External ID validation + logging
- `src/lib/csv-utils.ts` - Added External ID validation for bulk uploads

## Security & Data Quality Benefits

1. **Prevents SQL Injection** - No special characters in IDs
2. **Consistent Format** - Same validation across community + bulk uploads
3. **Better UX** - Clear feedback on what's allowed
4. **Database Safety** - Length limits prevent performance issues
5. **Complete Data** - nameEnglish field ensures proper data structure
