# Engineering Specification

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
- is_deleted (boolean, default false)
- created_at

### change_source
- id (UUID, PK)
- type (enum: BULK_UPLOAD, COMMUNITY_SUBMISSION, MANUAL_EDIT)
- change_type (enum: INSERT, UPDATE, DELETE)
- description (text)
- created_at

### bulk_upload
- id (UUID, PK)
- change_source_id (FK, UNIQUE)
- filename, raw_file, uploaded_at

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

---

## Core Workflows

### Bulk Upload
1. Admin uploads CSV → must contain header row with only:
   - `external_id`, `name`, `gender`, `date_of_birth`.
   - Any extra columns (including death fields) → reject.
2. Compare by `external_id`:
   - New IDs → INSERT.
   - Existing IDs with differences → UPDATE.
   - Missing IDs → DELETE (soft delete).
3. On apply → create `change_source`, `bulk_upload`, `person_version`, update `person` snapshot.

### Community Submission
- **FLAG** → mark record as problematic.
- **EDIT** → propose changes, but only for death-related fields (`date_of_death`, `location_of_death`, `obituary`).
- Moderator decides:
  - Approve → create `change_source`, new `person_version`, update snapshot.
  - Reject → mark submission rejected.
  - Supersede → mark if base version stale.

---

## CSV Example (Bulk Upload)

```csv
external_id,name,gender,date_of_birth
P001,John Smith,MALE,1965-04-12
P002,Jane Doe,FEMALE,1972-11-05
P003,Alex Johnson,OTHER,1990-02-28
```
