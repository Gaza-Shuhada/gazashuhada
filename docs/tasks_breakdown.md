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

## Phase 6: Testing
- [ ] Jest + Supertest setup
- [ ] Bulk upload simulate/apply tests
- [ ] CSV validation test: reject invalid headers/columns
- [ ] Community submission validation: reject EDIT proposals on non-death fields
- [ ] Moderation approve/reject/supersede tests
- [ ] End-to-end DB integration tests
