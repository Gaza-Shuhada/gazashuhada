# TODO

## Documentation alignment
- [x] Align `docs/API_DOCUMENTATION.md` with current schema
  - [x] Replace `locationOfDeath` (string) with `locationOfDeathLat`/`locationOfDeathLng` everywhere
  - [x] Update filters/query params to use lat/lng (or document derived location if kept)
  - [x] Ensure responses and model examples match Prisma schema naming
- [x] Decide and document photo processing format and types
  - [x] Choose target format (JPEG vs WebP) and reflect consistently
  - [x] Align allowed file types across docs and validation
  - [x] Confirm and document the upload endpoint path actually implemented

## Access control and roles
- [x] Normalize role taxonomy across docs
  - [x] Only two roles in Clerk `publicMetadata.role`: `admin`, `moderator`
  - [x] “Community” = any authenticated user (not a role)
  - [x] Ensure examples and tables reflect this consistently

## UI and theming
- [x] Audit for raw Tailwind colors (e.g., `text-gray-900`) and replace with shadcn tokens
  - [x] Verify input contrast in light/dark themes after token use

## Images lifecycle
- [x] Decide on policy for old photos (keep for version history)
- [x] (Optional) Plan thumbnail generation and lazy loading
- [x] are we using Netxjs <Image>?

## Photos: original + thumbnail support
- [x] Add original and thumbnail photo URLs to schema (prisma)
- [x] Update upload endpoint to save original and 512x512 WebP and return both URLs
- [x] Update docs (API and Engineering) to document both photo URLs
- [x] Adjust any UI/API usage to accept thumbnail/original if applicable
- [x] Apply Prisma migration in dev (may reset DB due to drift)

### Done today (session summary)
- [x] Consolidated docs to `PRODUCT.md`, `ENGINEERING.md`, `API_DOCUMENTATION.md`; deprecated old docs
- [x] Moved `CONTRIBUTING.md` and `TODO.md` into `docs/`; updated links
- [x] Normalized roles wording across docs
- [x] Standardized Prisma commands (dev: migrate dev; CI/prod: migrate deploy)
- [x] Aligned API docs to lat/lng and clarified public vs admin scope
- [x] Standardized on shadcn tokens; removed raw Tailwind colors in layouts and auth pages
- [x] Implemented photo pipeline: original upload + thumbnail; switched to WebP; kept originals
- [x] Thumbnail size set to 512x512; center-cropped
- [x] Community submit now sends `photoUrlThumb` and `photoUrlOriginal`
- [x] Moderation approval stores `photoUrlThumb` and `photoUrlOriginal` in `Person` and `PersonVersion`
- [x] Made moderation image links clickable (thumb preview, link to original)
- [x] Fixed bulk upload simulation for empty DB and removed invalid selects
- [x] Removed unused empty API folders (`posts/`, `sync-user/`, `webhook/`)
 - [x] Split `/modERATION/page.tsx` into server wrapper + `ModerationClient` to fix client hooks error
 - [x] Removed legacy `photoUrl` (back-compat) from schema and API docs; reset dev DB
 - [x] Updated community submit docs to use `photoUrlOriginal` and `photoUrlThumb` everywhere
 - [x] Created Prisma migrations to align DB with schema:
   - [x] Add `photoUrlOriginal`/`photoUrlThumb` to `Person`/`PersonVersion`
   - [x] Add `BulkUpload.label` and `BulkUpload.dateReleased`
   - [x] Add `confirmedByMoh` to `Person`/`PersonVersion`
   - [x] Drop legacy `User` FKs (`submittedBy`/`approvedBy`) and remove `User` table
 - [x] Applied migrations with `migrate deploy` after reset

## Commands guidance
- [x] Standardize migration guidance
  - [x] Development: `npx prisma migrate dev`
  - [x] CI/prod: `npx prisma migrate deploy`
  - [x] Explain when (and when not) to use `db push`

## Endpoint and page path verification
- [x] Ensure documented page routes match current code (`/bulk-uploads`, `/moderation`, `/records`)
- [x] Ensure all documented admin endpoints exist and match method/paths
- [x] Resolve `upload-photo` path discrepancy (`/api/upload-photo` vs `/api/public/community/upload-photo`)

## Bulk upload storage
- [ ] Move `BulkUpload.rawFile` to Blob storage; keep only reference in DB
  - [ ] Store: `fileUrl`, `fileSize`, `sha256`, `contentType`, `uploadedAt`
  - [ ] Update apply endpoint to stream upload to Blob and persist metadata
  - [ ] Update list/simulate/apply UI to download from Blob (no raw bytes in DB)
  - [ ] (Optional) Keep a small gzip’d preview of first ~20 lines in DB for quick UI (<10KB)
  - [ ] Migration/backfill: upload existing `rawFile` rows to Blob and replace with references
  
## Testing
- [ ] Unit tests for CSV validation (`src/lib/csv-utils.ts`)
- [ ] Integration tests for bulk upload simulate/apply/rollback
- [ ] E2E tests for moderation flow (approve/reject/supersede)
- [ ] (Optional) Fixtures: move CSV examples into `tests/fixtures/`

## Security & performance (future)
- [ ] Add CORS, rate limiting, and caching notes where applicable
- [ ] Confirm staff endpoints are protected server-side (not just client guards)

