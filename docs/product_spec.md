# Product Specification - Admin Tools

## Overview
**Staff-Only Internal Administration Tool** for managing versioned records of people. 

> ⚠️ **CRITICAL DISTINCTION**: This is the **admin tools only**. A separate public-facing web application will be built for end-users to consume the data with advanced search, filtering, sorting, analytics, and visualization features. These admin tools are focused exclusively on:
> - Data management (bulk uploads, versioning)
> - Moderation (reviewing community submissions)
> - Internal operations (audit logs, access control)
> - NOT designed for general public data browsing

The admin system supports:
- **Bulk file uploads** (admin-only) with preview, apply, and rollback capabilities
- **Complete versioning system** tracking all changes (INSERT, UPDATE, DELETE)
- **Audit logging** of all administrative actions
- **Role-based access control** (Admin and Moderator roles)
- **Basic database browsing** for staff verification purposes
- **Traceability** from versions back to their origin (`ChangeSource`)

**Note**: This is a staff-only application. Community members have no access to any admin features.

## Key Features

### ✅ Implemented Features

1. **Bulk Upload System (Admin Only)** - COMPLETED
   - **Location**: `/bulk-uploads`
   - **Features**:
     - View past bulk uploads with stats, labels, and release dates
     - Upload CSV files with mandatory descriptive label and date released
     - Simulate differences with comprehensive preview:
       - ALL deletions shown (critical review)
       - ALL updates with before/after comparison
       - Sample of inserts (first 10)
     - Apply or cancel simulation
     - Rollback functionality with LIFO safety
     - Smart UI showing which uploads can be rolled back
   - **Restrictions**: Only accepts `external_id`, `name`, `gender`, `date_of_birth` fields
   - **Security**: Layout guard + API protection (`requireAdmin()`)

2. **Bulk Upload Metadata** - COMPLETED
   - **Label** (mandatory text field, max 200 characters):
     - Helps organize and identify uploads
     - Examples: "Q4 2024 Update", "January Corrections", "Hospital Data Import"
     - Displayed as colored badges in uploads history
   - **Date Released** (mandatory date field):
     - Captures when source data was published/released
     - Helps track data provenance and timeline
     - Displayed in dedicated column in uploads history
   - Both fields validated on frontend and backend

3. **Rollback System** - COMPLETED
   - One-click rollback for any eligible bulk upload
   - **LIFO Safety**: Only allows rolling back most recent changes
   - Smart conflict detection blocks rollbacks with subsequent modifications
   - Visual indicators: Active (red) vs disabled (gray) buttons with tooltips
   - Transaction-safe atomic operations
   - Maintains full audit trail with new versions
   - Confirmation dialog prevents accidents

4. **Records Browser (Staff Only)** - COMPLETED
   - **Location**: `/records`
   - **Purpose**: Basic verification and spot-checking for staff (NOT for public data consumption)
   - **Features**:
     - Browse all database records with basic pagination (10 per page)
     - Shows ALL records including deleted ones
     - Columns: External ID, Name, Gender, DOB, DOD, Location, **Version**, **Deleted Status**, Last Updated
     - Version numbers displayed as badges (v1, v2, v3...)
     - Deletion status with color-coded badges (Green "No", Red "Yes")
   - **Security**: Staff only (admin + moderator)
   - **Note**: Advanced search, filtering, and analytics will be in the separate public-facing application

5. **Dashboard (Staff Only)** - COMPLETED
   - **Location**: `/dashboard`
   - **Features**:
     - Welcome message with user greeting
     - Statistics overview cards (total records, active, deleted, recent uploads)
     - Role badge display
     - Error message display for access denials
   - **Security**: Staff only (admin + moderator), community members blocked
   - Clean design with navbar-only navigation

6. **Audit Log System (Staff Only)** - COMPLETED
   - **Location**: `/audit-logs`
   - **Features**:
     - Last 50 admin actions displayed in table
     - Tracks: bulk uploads, rollbacks, user role changes, system operations
     - Displays: timestamp, user email, action type, resource, description, IP address
     - Color-coded badges for actions and resources
     - Expandable metadata JSON for detailed context
     - Refresh button for real-time updates
   - **Security**: Staff only (admin + moderator)

7. **Authentication & Authorization** - COMPLETED
   - **Platform**: Clerk with role-based access control
   - **Roles**:
     - **Admin**: Full access (bulk uploads, all staff features)
     - **Moderator**: Staff features only (no bulk uploads)
     - **Community**: NO ACCESS to application
   - **Protection Layers**:
     - Client-side layout guards with access denied UI
     - Server-side page checks with redirects
     - API endpoint guards (`requireAdmin()`, `requireStaff()`)
     - Navbar conditionally shows/hides links
   - **Access Denied Pages**: Clear messaging with role display and contact info

## Access Control Matrix

| Feature | Admin | Moderator | Community |
|---------|-------|-----------|-----------|
| Dashboard | ✅ | ✅ | ❌ |
| Bulk Uploads | ✅ | ❌ | ❌ |
| Records Browser | ✅ | ✅ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ |
| Moderation Queue | ✅ | ✅ | ❌ |
| Rollback Uploads | ✅ | ❌ | ❌ |

## Page Routes

| Page | Route | Protection | Access |
|------|-------|------------|--------|
| Dashboard | `/dashboard` | Layout check | Staff only |
| Bulk Uploads | `/bulk-uploads` | Layout guard | Admin only |
| Audit Logs | `/audit-logs` | Layout guard | Staff only |
| Records | `/records` | Server check | Staff only |
| Moderation | `/moderation/pending` | Layout guard | Staff only |

### 🚧 Planned Features

8. **Moderation Queue (Moderator)** - PLANNED
   - List all pending submissions
   - Approve/reject with notes
   - Handle stale proposals (mark as superseded or approve anyway)
   - Apply approved changes into main system as new versions
   - ⚠️ Community submissions can propose edits **only to `date_of_death`, `location_of_death`, `obituary`**
   - Automatically logged in audit system

9. **Community Submissions** - PLANNED (Future Phase)
   - FLAG problematic records
   - EDIT death-related fields only
   - Submission forms with field restrictions
   - **Note**: Currently not implemented; application is staff-only
