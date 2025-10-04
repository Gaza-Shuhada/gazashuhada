# Engineering - Gaza Death Toll Admin Tools

> Scope: Admin tools only. Public-facing webapp is a separate repo.

---

## System Architecture (Consolidated)

### Two-Application Architecture

- Admin Tools (this repo): internal data management and moderation
- Public App (separate): public data consumption, search, analytics

Both connect to the same PostgreSQL database.

### Why Separation
- Security: strict RBAC for admin; open/public performance for public
- Scalability: write-heavy (admin) vs read-heavy (public)
- Deployment: independent release cycles and monitoring

### Data Flow
```
External Sources (CSV) → Admin Tools → PostgreSQL → Public App → Community Submissions → Moderation (Admin)
```

---

## Database Schema (Key Tables)

Source of truth: `prisma/schema.prisma`

### person
- id (UUID, PK)
- external_id (string, unique, not null)
- name, gender, date_of_birth
- date_of_death (date, nullable)
- location_of_death_lat (float, nullable) — Latitude (-90..90)
- location_of_death_lng (float, nullable) — Longitude (-180..180)
- obituary (text, nullable)
- photo_url (string, nullable) — Vercel Blob URL (max 2048x2048px)
- confirmed_by_moh (boolean, default false)
- is_deleted (boolean, default false)
- created_at, updated_at

### person_version
- id (UUID, PK), person_id (FK)
- external_id, name, gender, date_of_birth
- date_of_death (date, nullable)
- location_of_death_lat (float, nullable)
- location_of_death_lng (float, nullable)
- obituary (text, nullable)
- photo_url (string, nullable)
- confirmed_by_moh (boolean, default false)
- version_number (int)
- source_id (FK → change_source.id)
- change_type (enum: INSERT, UPDATE, DELETE)
- is_deleted (boolean, default false)
- created_at
- Unique: (person_id, version_number)
- Indexes: person_id, source_id, (source_id, change_type), created_at

### change_source
- id (UUID, PK)
- type (enum: BULK_UPLOAD, COMMUNITY_SUBMISSION, MANUAL_EDIT)
- description (text)
- created_at

Note: change_type is per version record, not at source.

### bulk_upload
- id (UUID, PK)
- change_source_id (FK, UNIQUE)
- filename (string)
- label (string, max 200)
- date_released (timestamp)
- raw_file (bytes)
- uploaded_at (timestamp)

### community_submission
- id (UUID, PK)
- type (enum: NEW_RECORD, EDIT)
- base_version_id (FK → person_version.id, nullable)
- person_id (FK → person.id, nullable)
- proposed_payload (JSONB)
- reason (text, nullable)
- submitted_by (string, Clerk user ID)
- status (enum: PENDING, APPROVED, REJECTED, SUPERSEDED)
- created_at
- approved_by, approved_at, decision_action, decision_note
- approved_change_source_id (FK → change_source.id, nullable)
- applied_version_id (FK → person_version.id, nullable)

### audit_log
- id (UUID, PK)
- user_id, user_email (nullable)
- action, resource_type, resource_id (nullable)
- description, metadata (JSONB, nullable)
- ip_address (nullable)
- created_at
- Indexes: (user_id, created_at), (resource_type, resource_id), created_at, action

---

## Core Workflows

### Bulk Upload
1. Admin uploads CSV with label (<=200 chars) and date_released
2. System compares by external_id: INSERT/UPDATE/DELETE
3. Simulation shows all deletions, all updates (diff), sample inserts
4. Apply creates change_source, bulk_upload, person_version rows; updates person snapshot

Safety:
- CSV is the full state; missing IDs are soft-deleted
- Add an operator confirmation when deletions exceed a threshold (e.g., require typing the label)

Rollback:
- LIFO constraint when later versions exist
- Re-verify conflicts at execution time and run in a single DB transaction

### Community Submissions
- NEW_RECORD: full payload of required fields (+ optional death/photo), `confirmed_by_moh=false`
- EDIT: only `date_of_death`, `location_of_death_lat`, `location_of_death_lng`, `obituary`, `photo_url` (and when photos are updated, both `photo_url_original` and `photo_url_thumb` are derived from the upload API response)
- Moderation: approve (create version), reject, or supersede

---

## Application Architecture

### Page Routes
| Page | Route | Protection | Access |
|------|-------|------------|--------|
| Dashboard | `/` | Server check | All logged-in |
| Bulk Uploads | `/bulk-uploads` | Client layout guard | Admin only |
| Audit Logs | `/audit-logs` | Client layout guard | Staff (admin+moderator) |
| Records | `/records` | Server check | Staff |
| Moderation | `/moderation` | Client layout guard | Staff |

### Access Control Implementation
1. Client layout guards (`useUser()`)
2. Server page checks (`currentUser()`)
3. API guards: `requireAdmin()`, `requireModerator()`

Role hierarchy:
- Admin: all features (stored in Clerk `publicMetadata.role` = `admin`)
- Moderator: moderator features, no bulk uploads (stored as `moderator`)
- Community: any authenticated user; not a stored role

---

## CSV Example
```csv
external_id,name,gender,date_of_birth
P001,John Smith,MALE,1965-04-12
P002,Jane Doe,FEMALE,1972-11-05
P003,Alex Johnson,OTHER,1990-02-28
```

---

## Notes & Practices
- Schema source of truth is `prisma/schema.prisma` — do not duplicate field definitions here
- Prefer server components; use `'use client'` only when necessary
- Use shadcn/ui components and tokens; avoid raw Tailwind colors
- Log all admin actions via `audit_log`
- Bulk upload raw CSV: consider storing in object storage and persisting only a reference; document retention policy
- Photo lifecycle: retain all historical photos; do not delete on replacement; preserve version history; monitor storage usage


