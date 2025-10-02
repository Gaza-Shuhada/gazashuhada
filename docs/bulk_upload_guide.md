# Bulk Upload Implementation Guide

> **Note**: For version history and recent changes, see [CHANGELOG.md](../CHANGELOG.md)

## What's Been Built

The bulk upload functionality is now complete with the following components:

### 1. Database Schema (`prisma/schema.prisma`)
- ✅ `Person` - Main person records with snapshot data
- ✅ `PersonVersion` - Version history for all changes (includes `changeType` per version)
- ✅ `ChangeSource` - Tracks origin of all changes (by type: BULK_UPLOAD, etc.)
- ✅ `BulkUpload` - Stores bulk upload metadata and raw files
- ✅ `CommunitySubmission` - For future community submissions

**Schema Design**: Each `PersonVersion` has its own `changeType` (INSERT/UPDATE/DELETE), allowing a single bulk upload to contain all three operation types. The `external_id` field determines which operation is performed.

### 2. Backend Services
- ✅ `src/lib/csv-utils.ts` - Robust CSV parsing and validation
  - Uses industry-standard `csv-parse` library (handles quotes, commas in fields, etc.)
  - Enforces required columns: `external_id`, `name`, `gender`, `date_of_birth`
  - Rejects forbidden columns: `date_of_death`, `location_of_death`, `obituary`
  - Validates all fields are non-empty (no blank/whitespace-only values)
  - Validates data formats (dates, gender enums)
  - Provides helpful, actionable error messages with row numbers

- ✅ `src/lib/bulk-upload-service.ts` - Core business logic
  - `simulateBulkUpload()` - Previews changes without applying
  - `applyBulkUpload()` - Applies changes with full versioning

### 3. API Routes
- ✅ `POST /api/admin/bulk-upload/simulate` - Preview upload changes
- ✅ `POST /api/admin/bulk-upload/apply` - Apply upload to database
- ✅ `GET /api/admin/bulk-upload/list` - List past uploads with stats

### 4. Admin UI
- ✅ `src/app/admin/bulk-uploads/page.tsx` - Full-featured admin interface
  - File upload with CSV validation
  - Simulation preview with summary stats
  - Apply/Cancel workflow
  - Historical uploads table

## Setup Instructions

### Access Control with Clerk Public Metadata

This implementation uses **Clerk's Public Metadata** to store user roles instead of Clerk's built-in RBAC or a separate database solution.

### **How It Works**

- **Frontend Protection**: Custom components check `user.publicMetadata.role`
- **Backend Protection**: `requireAdmin()` function checks `publicMetadata.role` in API routes
- **Layout Protection**: Admin layout component validates roles before rendering
- **Middleware Protection**: Server-level protection for API routes only
- **No Database Users**: User roles are managed entirely in Clerk's metadata

### **Role Permissions**

- **`admin`**: Can access bulk uploads (simulate, apply, list) and all admin features
- **`moderator`**: Can access moderation features and general features
- **No role or other**: Basic community member access only

### **Setting Up Roles**

1. **In Clerk Dashboard**:
   - Go to Users → Select a user → Metadata tab
   - In **Public metadata** section, add:
     ```json
     {
       "role": "admin"
     }
     ```
   - Click Save

2. **Alternative: Via API** (for programmatic role assignment):
   - Use the `/api/admin/set-role` endpoint
   - Send: `{"userId": "user_id_here", "role": "admin"}`

## CSV Format Example

```csv
external_id,name,gender,date_of_birth
P001,John Smith,MALE,1965-04-12
P002,Jane Doe,FEMALE,1972-11-05
P003,Alex Johnson,OTHER,1990-02-28
```

### Validation Rules

**Column Validation:**
- ✅ Must have exactly 4 columns: `external_id`, `name`, `gender`, `date_of_birth`
- ❌ No extra columns allowed
- ❌ No missing required columns
- ❌ No duplicate column headers
- ❌ Death-related fields (`date_of_death`, `location_of_death`, `obituary`) are forbidden

**Data Validation:**
- ✅ All fields are required (cannot be empty or whitespace-only)
- ✅ `external_id`: Must be non-empty string
- ✅ `name`: Must be non-empty string (can contain commas if properly quoted)
- ✅ `gender`: Must be MALE, FEMALE, or OTHER (case-insensitive)
- ✅ `date_of_birth`: Must be in YYYY-MM-DD format (e.g., 1990-12-25)

**CSV Format:**
- ✅ Properly handles quoted fields with commas (e.g., `"Smith, John"`)
- ✅ Properly handles escaped quotes (e.g., `"Jane ""Janey"" Doe"`)
- ✅ Trims whitespace from field values
- ✅ Case-insensitive headers and gender values

**Error Messages:**
- All errors include specific row numbers (starting from row 2)
- Clear, actionable feedback on what's wrong and how to fix it
- See [csv_test_examples.md](./csv_test_examples.md) for comprehensive test cases

## How It Works

### Upload Flow
1. **Upload CSV & Metadata** - Admin provides:
   - CSV file
   - **Label** (mandatory): Descriptive text to identify the upload (e.g., "Q4 2024 Update")
   - **Date Released** (mandatory): When the source data was published/released
2. **Simulate** - System compares CSV with current database using `external_id` as the unique key
   - **New `external_id`** (not in DB) → INSERT
   - **Existing `external_id`** with data differences → UPDATE
   - **Missing `external_id`** (in DB but not in CSV) → DELETE (soft delete)
   
   ⚠️ A single upload can contain all three operation types simultaneously!
   
4. **Preview** - Shows comprehensive review interface:
   - **Summary stats**: Total counts of inserts/updates/deletes
   - **All Deletions**: Complete table of records that will be deleted (critical for review!)
   - **All Updates**: Complete table showing before/after changes with visual highlighting
   - **Sample Inserts**: First 10 new records (since they're new data)
   - Color-coded: red for deletions, yellow for updates, green for inserts
   
5. **Apply** - Creates one `ChangeSource`, one `BulkUpload` (with label and date_released), and multiple `PersonVersion` records (each tagged with its specific `changeType`)
6. **History** - Upload appears in past uploads table with:
   - Filename and label (displayed as blue badge)
   - Date released (dedicated column)
   - Upload timestamp
   - Accurate stats per operation type (inserts, updates, deletes)
   - Rollback button (if eligible)

### Performance Optimization
- **Efficient queries**: Only fetches persons matching incoming IDs (not the entire database)
- **Fast simulation**: Works quickly even with 40,000+ records
- **Low memory usage**: Selective fetching reduces memory footprint

### Rollback Functionality
If you need to undo a bulk upload:

1. Navigate to the bulk uploads page
2. Find the upload in the "Past Uploads" table
3. Click the "Rollback" button in the Actions column
4. Confirm the rollback in the dialog
5. All changes are automatically reverted:
   - **INSERTs** → Records are deleted (soft delete)
   - **UPDATEs** → Records restored to previous version
   - **DELETEs** → Records are restored
6. The rollback is logged in the audit system
7. A success message shows how many changes were reverted

⚠️ **Important Limitations**:
- **LIFO Only (Last In, First Out)**: You can only rollback the most recent upload affecting a set of records
- If Upload A modified records, then Upload B modified some of the same records, you must rollback Upload B first before rolling back Upload A
- This prevents data loss from overwriting subsequent changes
- **UI Indicators**:
  - Uploads that CAN be rolled back show an active red "Rollback" button
  - Uploads that CANNOT be rolled back (due to conflicts) show a grayed-out button with a tooltip explaining why
  - Hover over disabled buttons to see the conflict explanation
- Rollback creates new versions; it doesn't delete history. The full audit trail is maintained.

### Versioning System
- Every change creates a new `PersonVersion` record with its own `changeType` (INSERT/UPDATE/DELETE)
- `Person` table holds current snapshot
- `ChangeSource` links versions to their origin (tracks bulk upload, community submission, etc.)
- `PersonVersion.versionNumber` increments per person (with unique constraint)
- Full audit trail maintained with optimized indexes for querying

## Querying Changes

With `changeType` tracked per version, you can now query changes accurately:

```typescript
// Get all deletions from a specific bulk upload
const deletions = await prisma.personVersion.findMany({
  where: {
    source: { bulkUpload: { id: uploadId } },
    changeType: 'DELETE'
  },
  include: { person: true }
});

// Get all updates from a specific bulk upload
const updates = await prisma.personVersion.findMany({
  where: {
    source: { bulkUpload: { id: uploadId } },
    changeType: 'UPDATE'
  },
  include: { person: true }
});

// Get stats for a bulk upload
const stats = await prisma.personVersion.groupBy({
  by: ['changeType'],
  where: { sourceId: changeSourceId },
  _count: { id: true }
});
// Result: [
//   { changeType: 'INSERT', _count: { id: 15 } },
//   { changeType: 'UPDATE', _count: { id: 234 } },
//   { changeType: 'DELETE', _count: { id: 3 } }
// ]
```

## Next Steps (Not Yet Implemented)

### Phase 4: Community Submissions
- `/api/community/flag` - Flag incorrect records
- `/api/community/edit` - Propose death field edits
- Validation: Only `date_of_death`, `location_of_death`, `obituary` allowed

### Phase 5: Moderation
- `/admin/moderation` page
- Approve/reject community submissions
- Create versions from approved submissions

### Phase 6: Testing
- Unit tests for CSV validation
- Integration tests for bulk upload flow
- E2E tests for UI workflows

## File Structure
```
src/
├── app/
│   ├── admin/
│   │   └── bulk-uploads/
│   │       └── page.tsx          # Admin UI
│   └── api/
│       └── admin/
│           └── bulk-upload/
│               ├── simulate/
│               │   └── route.ts  # Simulation endpoint
│               ├── apply/
│               │   └── route.ts  # Apply endpoint
│               └── list/
│                   └── route.ts  # List uploads
├── lib/
│   ├── csv-utils.ts              # CSV parsing & validation
│   ├── bulk-upload-service.ts    # Business logic
│   └── prisma.ts                 # Prisma client
└── prisma/
    └── schema.prisma              # Database schema
```

## Testing the Feature

### Manual Test
1. Create a test CSV file with the required format
2. Go to `/admin/bulk-uploads`
3. Upload the CSV and click "Simulate"
4. Review the preview
5. Click "Apply" to execute
6. Check the past uploads table

### Expected Behavior
- Invalid CSVs are rejected with clear error messages
- Simulation shows accurate INSERT/UPDATE/DELETE counts
- Apply creates proper versions and updates snapshots
- Past uploads show correct statistics
