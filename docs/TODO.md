# TODO

## Open TODOs


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
