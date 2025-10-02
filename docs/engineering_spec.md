# Engineering Specification - Control Panel

> ⚠️ **SYSTEM SCOPE**: This specification covers the **control panel only**. A separate public-facing web application will be built to provide end-user features (advanced search, filtering, sorting, analytics, data visualization, API access, etc.). This control panel handles:
> - Bulk data uploads and versioning
> - Staff moderation workflows
> - Audit logging and access control
> - Basic record browsing for verification purposes

## Database Schema (key tables)

### person
- id (UUID, PK)
- external_id (string, unique, not null)
- name, gender, date_of_birth
- date_of_death (date, nullable)
- location_of_death (string, nullable)
- obituary (text, nullable)
- is_deleted (boolean, default false)
- created_at, updated_at

### person_version
- id (UUID, PK), person_id (FK)
- external_id (string, not null)
- name, gender, date_of_birth
- date_of_death (date, nullable)
- location_of_death (string, nullable)
- obituary (text, nullable)
- version_number (int)
- source_id (FK -> change_source.id)
- change_type (enum: INSERT, UPDATE, DELETE) ⭐ **Tracks operation type per version**
- is_deleted (boolean, default false)
- created_at
- **Unique constraint**: (person_id, version_number)
- **Indexes**: person_id, source_id, (source_id, change_type), created_at

### change_source
- id (UUID, PK)
- type (enum: BULK_UPLOAD, COMMUNITY_SUBMISSION, MANUAL_EDIT)
- description (text)
- created_at

**Note**: `change_type` is tracked per version in `person_version.change_type`, not at the source level. This allows a single bulk upload to contain INSERT, UPDATE, and DELETE operations simultaneously.

### bulk_upload
- id (UUID, PK)
- change_source_id (FK, UNIQUE)
- filename (string, not null)
- label (string, not null, max 200) ⭐ **Required, helps identify uploads**
- date_released (timestamp, not null) ⭐ **Required, when source data was published**
- raw_file (bytes, not null)
- uploaded_at (timestamp)

### community_submission
- id (UUID, PK)
- type (enum: FLAG, EDIT)
- base_version_id (FK -> person_version.id, not null)
- person_id (FK -> person.id, not null)
- proposed_payload (JSONB, nullable)
  - ⚠️ Allowed fields: `date_of_death`, `location_of_death`, `obituary` only
- reason (text, nullable)
- submitted_by (FK -> user.id)
- status (enum: PENDING, APPROVED, REJECTED, SUPERSEDED)
- created_at

**Moderation fields**
- approved_by, approved_at
- decision_action (enum: UPDATE, DELETE)
- decision_note
- approved_change_source_id (FK -> change_source.id, nullable)
- applied_version_id (FK -> person_version.id, nullable)

### user (via Clerk Authentication)
- User management handled by Clerk
- Roles stored in Clerk's publicMetadata.role field
- Supported roles: admin, moderator, community member
- User IDs referenced as strings in community_submission.submitted_by

### audit_log
- id (UUID, PK)
- user_id (string, Clerk user ID)
- user_email (string, nullable - cached from Clerk)
- action (string - e.g., BULK_UPLOAD_APPLIED, COMMUNITY_SUBMISSION_APPROVED)
- resource_type (string - BULK_UPLOAD, COMMUNITY_SUBMISSION, PERSON, USER, SYSTEM)
- resource_id (string, nullable - ID of affected resource)
- description (string - human-readable description)
- metadata (JSONB, nullable - additional context)
- ip_address (string, nullable)
- created_at (timestamp)
- **Indexes**: (user_id, created_at), (resource_type, resource_id), created_at, action

---

## Core Workflows

### Bulk Upload
1. Admin uploads CSV and provides mandatory label (max 200 chars) and date released
   - **Label** helps identify the upload (e.g., "Q4 2024 Update", "Hospital Records Import")
   - **Date Released** captures when the source data was published/released (tracks data provenance)
   - CSV must contain header row with only: `external_id`, `name`, `gender`, `date_of_birth`
   - Any extra columns (including death fields) → reject
2. Compare by `external_id` (the unique identifier):
   - **New `external_id`** (not in database) → INSERT
   - **Existing `external_id`** with data differences → UPDATE  
   - **Missing `external_id`** (in DB but not in CSV) → DELETE (soft delete)
   
   ⚠️ **Important**: A single bulk upload can perform all three operation types simultaneously. The CSV represents the complete current state.
   
3. **Simulation** shows:
   - ALL deletions (critical review before applying)
   - ALL updates with before/after comparison
   - Sample of inserts (first 10)
   - Color-coded for easy review
   
4. On apply → create `change_source`, `bulk_upload` (with label), and multiple `person_version` records (each with its own `change_type`), then update `person` snapshots.

### Bulk Upload Rollback
1. Admin clicks "Rollback" button on a past upload
2. **SAFETY CHECK**: System checks if any affected persons have subsequent versions from other sources
   - If conflicts detected → Block rollback with error message
   - Must rollback recent uploads first (LIFO - Last In, First Out)
   - Prevents data loss from overwriting subsequent changes
3. System finds all `PersonVersion` records linked to that upload's `ChangeSource`
4. For each version, reverts the operation:
   - **INSERT** → Soft delete the person (create DELETE version)
   - **UPDATE** → Restore to previous version (create UPDATE version with previous data)
   - **DELETE** → Restore the person (create UPDATE version, set `isDeleted=false`)
5. All changes wrapped in transaction (atomic operation)
6. Creates new `ChangeSource` for the rollback operation
7. Logs rollback action in `AuditLog` with stats
8. Full history preserved - original versions not deleted

**Example Conflict Scenario:**
- Upload A (Jan 1): Inserts Person #123
- Upload B (Jan 2): Updates Person #123
- ❌ Cannot rollback Upload A (would delete person modified by Upload B)
- ✅ Must rollback Upload B first, then can rollback Upload A

### Community Submission
- **FLAG** → mark record as problematic.
- **EDIT** → propose changes, but only for death-related fields (`date_of_death`, `location_of_death`, `obituary`).
- Moderator decides:
  - Approve → create `change_source`, new `person_version`, update snapshot.
  - Reject → mark submission rejected.
  - Supersede → mark if base version stale.

---

## Application Architecture

### Page Routes

| Page | Route | Protection | Access Level |
|------|-------|------------|--------------|
| Dashboard | `/dashboard` | Server-side check | Staff only (admin + moderator) |
| Bulk Uploads | `/bulk-uploads` | Client layout guard | Admin only |
| Audit Logs | `/audit-logs` | Client layout guard | Staff only (admin + moderator) |
| Records Browser | `/records` | Server-side check | Staff only (admin + moderator) |
| Moderation | `/moderation/pending` | Client layout guard | Staff only (admin + moderator) |

### API Endpoints

**Bulk Upload:**
- `POST /api/admin/bulk-upload/simulate` - Preview changes (admin only)
- `POST /api/admin/bulk-upload/apply` - Apply bulk upload (admin only)
- `GET /api/admin/bulk-upload/list` - List past uploads with rollback eligibility (admin only)
- `POST /api/admin/bulk-upload/[id]/rollback` - Rollback upload (admin only)

**Records:**
- `GET /api/persons` - Fetch paginated records with version info (staff only)

**Audit:**
- `GET /api/admin/audit-logs` - Fetch recent audit logs (staff only)

**Stats:**
- `GET /api/stats` - Get database statistics (staff only)

### Access Control Implementation

**Three-Layer Protection:**

1. **Client-Side Layout Guards** (`layout.tsx`):
   - Checks user role via Clerk `useUser()` hook
   - Blocks UI rendering if unauthorized
   - Shows access denied page with clear messaging
   - Used for: `/bulk-uploads`, `/audit-logs`, `/moderation/*`

2. **Server-Side Page Checks** (page components):
   - Verifies role via `currentUser()` before rendering
   - Redirects or shows access denied page
   - Used for: `/dashboard`, `/records`

3. **API Endpoint Guards** (helper functions):
   - `requireAdmin()` - Admin only endpoints
   - `requireStaff()` - Admin or moderator endpoints (alias for `requireModerator()`)
   - Returns 403 Forbidden if unauthorized
   - Throws descriptive error messages

**Role Hierarchy:**
- **Admin**: Full access to all features
- **Moderator**: Staff features (no bulk uploads)
- **Community**: No access (blocked at dashboard)

---

## CSV Example (Bulk Upload)

```csv
external_id,name,gender,date_of_birth
P001,John Smith,MALE,1965-04-12
P002,Jane Doe,FEMALE,1972-11-05
P003,Alex Johnson,OTHER,1990-02-28
```
