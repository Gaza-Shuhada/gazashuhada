# Product Specification

## Overview
The system manages versioned records of people. It supports:
- **Bulk file uploads** (admin-only) with preview before applying.
- **Versioning** (new, update, delete) via `person_version`.
- **Community submissions** (FLAG/EDIT only for death fields).
- **Moderation workflow** (approve/reject proposals).
- **Traceability** from versions back to their origin (`change_source`).

## Key Features

### ✅ Implemented Features

1. **Bulk Upload Page (Admin)** - COMPLETED
   - See list of past bulk uploads with stats.
   - Upload new CSV file.
   - Simulate differences before applying (counts + sample diffs).
   - Apply or cancel simulation.
   - ⚠️ Bulk uploads only contain: `external_id`, `name`, `gender`, `date_of_birth`. Never death-related fields.
   - Multi-layer security protection (middleware, layout, API routes)
   - Role-based access control via Clerk publicMetadata

2. **Dashboard & Statistics** - COMPLETED
   - Overview of total records and recent uploads
   - Browse all database records with pagination
   - Role-based navigation and access controls

3. **Authentication & Authorization** - COMPLETED
   - Clerk integration with role-based access control
   - Admin, moderator, and community member roles
   - Protected routes and API endpoints

### 🚧 Planned Features

4. **Moderation Queue (Moderator)** - PLANNED
   - List all pending submissions.
   - Approve/reject (with notes).
   - Handle stale proposals (mark as superseded or approve anyway).
   - Apply approved changes into main system as new versions.
   - ⚠️ Community submissions can propose edits **only to `date_of_death`, `location_of_death`, `obituary`**.

5. **Community Submissions** - PLANNED
   - FLAG problematic records
   - EDIT death-related fields only
   - Submission forms with field restrictions
