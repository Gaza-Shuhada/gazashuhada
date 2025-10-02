# Bulk Upload Feature - Implementation Complete

## What's Been Built

The bulk upload functionality is now complete with the following components:

### 1. Database Schema (`prisma/schema.prisma`)
- ✅ `Person` - Main person records with snapshot data
- ✅ `PersonVersion` - Version history for all changes
- ✅ `ChangeSource` - Tracks origin of all changes
- ✅ `BulkUpload` - Stores bulk upload metadata and raw files
- ✅ `CommunitySubmission` - For future community submissions
- ✅ `User` - User management with roles

### 2. Backend Services
- ✅ `src/lib/csv-utils.ts` - CSV parsing and validation
  - Enforces required columns: `external_id`, `name`, `gender`, `date_of_birth`
  - Rejects forbidden columns: `date_of_death`, `location_of_death`, `obituary`
  - Validates data formats (dates, gender enums)

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
- ❌ No extra columns allowed
- ❌ Death-related fields (`date_of_death`, `location_of_death`, `obituary`) are forbidden
- ✅ All rows must have valid data
- ✅ Dates must be in YYYY-MM-DD format
- ✅ Gender must be MALE, FEMALE, or OTHER

## How It Works

### Upload Flow
1. **Upload CSV** - Admin selects a CSV file
2. **Simulate** - System compares CSV with current database
   - New `external_id` → INSERT
   - Existing `external_id` with changes → UPDATE
   - Missing `external_id` → DELETE (soft delete)
3. **Preview** - Shows summary stats and sample diffs
4. **Apply** - Creates versions and updates person records
5. **History** - Upload appears in past uploads table

### Versioning System
- Every change creates a new `PersonVersion` record
- `Person` table holds current snapshot
- `ChangeSource` links versions to their origin
- Full audit trail maintained

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
