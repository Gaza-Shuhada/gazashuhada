# Task Breakdown

## Phase 1: Setup ✅ COMPLETED
- [x] Next.js app skeleton
- [x] PostgreSQL + Prisma schema
- [x] Clerk auth integration

## Phase 2: Database ✅ COMPLETED
- [x] Create tables: `person`, `person_version`, `change_source`, `bulk_upload`, `community_submission`
- [x] User management via Clerk (no separate user table needed)
- [x] Migrations + seed script

## Phase 3: Bulk Uploads ✅ COMPLETED
- [x] Build `/admin/bulk-uploads` page (list past uploads)
- [x] Implement CSV validation + simulation API (`POST /simulate`)
- [x] Enforce CSV schema: only `external_id`, `name`, `gender`, `date_of_birth`
- [x] Reject CSVs with unexpected columns (e.g. death fields)
- [x] UI preview summary + sample diffs
- [x] Apply flow: `POST /apply` → writes change_source, person_version, updates snapshot
- [x] Cancel flow: discard simulation
- [x] Role-based access control (admin only)
- [x] Multi-layer security protection
- [x] **Schema optimization**: Moved `changeType` from `ChangeSource` to `PersonVersion` for accurate per-version tracking
- [x] **Data integrity**: Added unique constraint on `(personId, versionNumber)`
- [x] **Performance**: Added optimized indexes for querying by changeType and time
- [x] **CSV Parser**: Replaced naive split with `csv-parse` library, handles quotes and commas
- [x] **Performance Optimization**: Only fetch needed records, not entire database
- [x] **Simulation UI**: Show ALL deletions and updates, sample inserts
- [x] **Audit Log System**: Track all admin actions with user, timestamp, metadata

## Phase 3.5: Audit & Compliance ✅ COMPLETED
- [x] Create `AuditLog` table in database schema
- [x] Build audit logging utility (`createAuditLog` function)
- [x] Integrate audit logging into bulk upload apply
- [x] Create API endpoint `GET /api/admin/audit-logs`
- [x] Build admin page `/admin/audit-logs` showing last 50 actions
- [x] Add "Audit Logs" link to navbar for admins
- [x] Document audit log system in specs

## Phase 3.6: Bulk Upload Rollback ✅ COMPLETED
- [x] Create `rollbackBulkUpload` function in bulk-upload-service
- [x] Handle INSERT rollback (delete records)
- [x] Handle UPDATE rollback (restore previous version)
- [x] Handle DELETE rollback (restore records)
- [x] **LIFO Safety Check**: Detect conflicts with subsequent uploads
- [x] Block rollback if affected records have later versions from other sources
- [x] Create API endpoint `POST /api/admin/bulk-upload/[id]/rollback`
- [x] Add rollback button to bulk uploads page
- [x] Add confirmation dialog for rollback
- [x] Integrate rollback logging into audit system
- [x] Document rollback functionality and LIFO limitation

## Phase 3.7: UX & Access Control Refinements ✅ COMPLETED
- [x] **Bulk Upload Labels**:
  - [x] Add `label` field to `BulkUpload` schema (nullable String, max 200)
  - [x] Make label mandatory in upload form with validation
  - [x] Improve text input visibility (darker text color)
  - [x] Display labels as colored badges in past uploads table
  - [x] Backend validation for label presence
- [x] **Records Page Enhancements**:
  - [x] Add version number column with badge display (v1, v2, v3...)
  - [x] Add deletion status column with color-coded badges (Green/Red)
  - [x] Update API to fetch version numbers via relation query
  - [x] Remove `isDeleted: false` filter to show ALL records
- [x] **UI/UX Improvements**:
  - [x] Remove navigation cards from dashboard (navbar-only navigation)
  - [x] Standardize page padding/margins (`pt-8 pb-8 px-8`, `max-w-7xl mx-auto`)
  - [x] Fix audit logs page layout to match other pages
- [x] **Page Route Restructuring**:
  - [x] Move `/admin/bulk-uploads` → `/bulk-uploads`
  - [x] Move `/admin/audit-logs` → `/audit-logs`
  - [x] Update all navbar links to new routes
  - [x] Keep API endpoints at `/api/admin/*`
- [x] **Comprehensive RBAC Implementation**:
  - [x] Create layout guards for bulk-uploads (admin only)
  - [x] Create layout guards for audit-logs (staff only)
  - [x] Add server-side checks to dashboard (staff only)
  - [x] Add server-side checks to records page (staff only)
  - [x] Add `requireStaff()` helper function in auth-utils
  - [x] Update API endpoints to use `requireStaff()` where appropriate
  - [x] Update navbar to conditionally show links based on role
  - [x] Block community members from ALL features
  - [x] Create clear access denied pages with role display
- [x] **Smart Rollback UI**:
  - [x] Backend conflict detection in list endpoint
  - [x] Add `canRollback` boolean to upload responses
  - [x] Disable rollback button for uploads with conflicts
  - [x] Add tooltip explaining why rollback is disabled
- [x] **Documentation Updates**:
  - [x] Update CHANGELOG with all today's changes
  - [x] Update product_spec.md with current features and access matrix
  - [x] Update engineering_spec.md with routes, APIs, and architecture
  - [x] Update README.md with comprehensive feature list and access control
  - [x] Update bulk_upload_guide.md with label and rollback info
  - [x] Update tasks_breakdown.md with completion status

## Phase 4: Community Submissions
- [ ] Endpoints `/community/flag` and `/community/edit`
- [ ] Store proposals with base_version_id + proposed_payload or reason
- [ ] Backend validation: EDIT proposals may only contain `date_of_death`, `location_of_death`, `obituary`
- [ ] UI submission form restricted to these three fields

## Phase 5: Moderation
- [ ] Build `/moderation/pending` page with table of proposals
- [ ] Detail view: show diffs (restricted to death fields for EDIT)
- [ ] Actions: approve (→ person_version + update snapshot), reject, supersede
- [ ] Persist moderator notes + audit trail
- [ ] **Integrate with audit log**: Log all moderation decisions (approve/reject) with metadata

## Phase 6: Testing
- [ ] Jest + Supertest setup
- [ ] Bulk upload simulate/apply tests
- [ ] CSV validation test: reject invalid headers/columns
- [ ] Community submission validation: reject EDIT proposals on non-death fields
- [ ] Moderation approve/reject/supersede tests
- [ ] End-to-end DB integration tests
