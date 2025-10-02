# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

> ⚠️ **PROJECT SCOPE**: This is the **admin tools only**. A separate public-facing web application will provide end-user features (search, filtering, analytics, data visualization, etc.). These admin tools focus on data management, moderation, and internal operations.

---

## [Unreleased]

### Added
- No unreleased changes yet

---

## [0.2.0] - 2025-10-02

### Changed
- **Bulk Upload Rollback Behavior** (BREAKING):
  - Rollback now **permanently deletes** the PersonVersion records created by the upload
  - Deletes the BulkUpload and ChangeSource records completely
  - No longer creates new versions for rollback operations
  - Records are silently restored to their previous state
  - Upload disappears from history after rollback (cleaner, no version number inflation)
  - LIFO safety check still enforced (cannot rollback if subsequent uploads modified same records)

- **Schema Consistency** (BREAKING):
  - `BulkUpload.label` is now required (not nullable) - consistent with UI requirements
  - `BulkUpload.dateReleased` is now required (not nullable) - consistent with UI requirements
  - Old bulk uploads without these fields were deleted during migration
  - Added `onDelete: Cascade` to ChangeSource relation for cleaner cleanup

### Added
- **Bulk Upload Labels** (Required):
  - Mandatory text label field when uploading bulk files (max 200 characters)
  - Labels displayed as colored badges in past uploads table
  - Helps identify and organize uploads (e.g., "Q4 2024 Update", "January Corrections")
  - Improved text visibility with darker input text color (`text-gray-900`)
  - Validated on both frontend and backend
  - Stored in database (`BulkUpload.label` field)

- **Bulk Upload Date Released** (Required):
  - Mandatory date field capturing when the source data was published/released
  - Date picker input in upload form
  - Displayed in past uploads table as a dedicated "Date Released" column
  - Validated on both frontend and backend (ensures valid date format)
  - Stored in database (`BulkUpload.dateReleased` field)
  - Helps track data provenance and source timeline

- **Records Page Enhancements**:
  - Added **Version Number** column showing current version (e.g., v1, v2, v3) in gray badge
  - Added **Deleted Status** column with color-coded badges:
    - Green "No" badge for active records
    - Red "Yes" badge for soft-deleted records
  - Records page now shows ALL records including deleted ones for full visibility
  - API optimized to fetch version numbers efficiently via relation query

- **UI/UX Improvements**:
  - Removed navigation cards from dashboard (cleaner, navbar-only navigation)
  - Consistent page padding/margins across all admin pages (`pt-8 pb-8 px-8`, `max-w-7xl mx-auto`)
  - Audit logs page now has same layout structure as other pages
  - Better visual hierarchy and consistency

- **Page Route Restructuring**:
  - Simplified URL structure by removing `/admin` prefix:
    - `/admin/bulk-uploads` → `/bulk-uploads`
    - `/admin/audit-logs` → `/audit-logs`
  - API endpoints remain at `/api/admin/*` for proper organization
  - Protection maintained via page layouts and middleware

- **Comprehensive Role-Based Access Control**:
  - **Admin Only** pages:
    - Bulk Uploads (with client-side layout guard)
    - Only admins can upload, simulate, apply, and rollback
  - **Staff Only** (Admin + Moderator) pages:
    - Dashboard (staff-only application)
    - Audit Logs (view all admin actions)
    - Records (browse database with version info)
    - Moderation (pending submissions)
  - **Community Members**:
    - NO ACCESS to any application features
    - Clear "Staff Access Required" message
    - No navigation links visible
    - Message to contact administrator
  - New `requireStaff()` helper function in auth utilities
  - API endpoints properly protected with role checks
  - Navbar dynamically hides links based on user role
- **BREAKING**: Moved `changeType` field from `ChangeSource` to `PersonVersion` table
  - Rationale: A single bulk upload can contain INSERT, UPDATE, and DELETE operations simultaneously
  - Impact: Queries that referenced `ChangeSource.changeType` must be updated to use `PersonVersion.changeType`
  - Migration: `20251002222320_move_changetype_to_version`
- **CSV Parsing**: Replaced naive `split(',')` with industry-standard `csv-parse` library
  - Now properly handles commas in names, quoted fields, and escaped quotes
  - More robust parsing for real-world data
- **Sticky Navbar**: Navbar now remains visible at top when scrolling
- **Consistent Terminology**: All references changed from "Admin Panel" to "Admin Tools"
- Unique constraint on `PersonVersion(personId, versionNumber)` to prevent race conditions
- Performance indexes:
  - `PersonVersion(sourceId, changeType)` - for filtering changes by upload and operation type
  - `PersonVersion(createdAt)` - for timeline queries
- Query examples in documentation for filtering by `changeType`
- **CSV Validation Improvements**:
  - All fields now validated as required (no empty or whitespace-only values)
  - Duplicate column header detection
  - Case-insensitive gender values accepted
  - Comprehensive error messages with row numbers and actionable feedback
- **Simulation UI Improvements**:
  - Now displays ALL deletions in a dedicated table (critical for review before applying)
  - Now displays ALL updates with before/after comparison (shows exact changes)
  - Inserts shown as sample (first 10) since they're new data
  - Color-coded sections: red for deletions, yellow for updates, green for inserts
  - Max-height tables with scrolling for large change sets
- **Audit Log System**:
  - New `AuditLog` table tracks all admin actions
  - Automatically logs bulk upload operations with metadata
  - Admin page at `/admin/audit-logs` shows last 50 actions
  - Displays user, timestamp, action type, resource, description, and IP address
  - Color-coded action and resource badges
  - Expandable metadata for detailed context
  - Ready for community submission approvals/rejections (Phase 4/5)
- **Bulk Upload Rollback**:
  - Rollback button on each past upload in the bulk uploads page
  - Completely reverts all changes made by a specific upload
  - INSERTs become DELETEs, UPDATEs restore previous values, DELETEs restore records
  - Transaction-safe - all changes rolled back atomically
  - Automatically logged in audit system with stats
  - Confirmation dialog prevents accidental rollbacks
  - **LIFO Safety**: Only allows rolling back most recent upload (prevents conflicts with subsequent changes)
  - Detects and blocks rollback if affected records have been modified by later uploads
  - **Smart UI**: Rollback button automatically disabled for uploads with conflicts (grayed out with tooltip)
  - Backend conflict detection runs when listing uploads to show real-time rollback eligibility
- Documentation: `docs/csv_test_examples.md` with test cases and validation examples
- Dedicated `/records` page for browsing database (moved out of dashboard)

### Fixed
- Bulk upload stats now accurately reflect INSERT/UPDATE/DELETE counts per upload
- Reduced Prisma query logging in development (removed verbose query logs)
- Middleware error: Fixed Clerk `currentUser()` call in middleware by using `sessionClaims` instead
- CSV parsing now handles edge cases: commas in names, quotes in values, whitespace trimming
- **Performance**: Optimized bulk upload simulation and apply operations
  - Now only fetches persons matching incoming IDs (not all persons)
  - Reduced memory usage and query time for large datasets
  - Simulations are much faster with 40,000+ records

### Technical Details
- Data migration automatically populated `changeType` for existing records:
  - `isDeleted = true` → `DELETE`
  - `versionNumber = 1` → `INSERT`
  - Otherwise → `UPDATE`
- Database schema changes:
  - `BulkUpload.label` is now required (not nullable)
  - `BulkUpload.dateReleased` is now required (not nullable)
  - Old bulk uploads without these fields were deleted during migration
  - Added `onDelete: Cascade` to ChangeSource relation
- Access control architecture:
  - Client-side: Layout components check roles and show access denied UI
  - Server-side: Page components check roles and redirect
  - API: Endpoint guards with `requireAdmin()`, `requireStaff()`, `requireModerator()`
  - Navbar: Conditionally renders links based on user role

## [0.1.0] - 2024-10-02

### Added
- Initial bulk upload feature implementation
- CSV validation and parsing
- Simulation and apply workflow
- Admin dashboard with role-based access control
- Clerk authentication integration
- Prisma schema with Person, PersonVersion, ChangeSource, BulkUpload tables
- Multi-layer security protection (middleware, layout, API routes)

### Security
- Role-based access control via Clerk publicMetadata
- Admin-only bulk upload endpoints
- CSV validation to prevent unauthorized field uploads

---

## Notes

### Migration Strategy
When upgrading to versions with breaking changes:
1. Back up your database
2. Review the migration SQL in `prisma/migrations/`
3. Run `npx prisma migrate deploy` in production
4. Update application code that references changed fields

### Breaking Changes Policy
Breaking changes are clearly marked with **BREAKING** and include:
- Rationale for the change
- Impact assessment
- Migration instructions


