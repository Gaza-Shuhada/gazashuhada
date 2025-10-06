# TODO

> **Workflow**: This file tracks active tasks. When committing:
> 1. Include all completed TODOs in the commit message
> 2. Remove completed items from this file
> 3. Keep only open/pending tasks
>
> See git history for completed work.

---

## 📋 Ready for Testing

### Manual Testing - MOH CSV Uploads
- [ ] Update Prisma Accelerate settings in dashboard (see PRISMA_ACCELERATE_SETTINGS.md)
- [ ] Start dev server: `npm run dev`
- [ ] Test upload through web UI at http://localhost:3000/bulk-uploads
- [ ] Upload 9 MOH CSV files sequentially (oldest to newest)
- [ ] Verify statistics match expected results
- [ ] Verify English names are imported correctly
- [ ] Verify Blob storage download links work
- [ ] Document actual upload times and statistics

### Files Ready for Upload
All files in `moh-updates/` directory (validated):
- [ ] 2024-01-05.csv (14,140 records)
- [ ] 2024-03-29.csv (20,390 records)
- [ ] 2024-04-30.csv (24,672 records)
- [ ] 2024-06-30.csv (28,185 records)
- [ ] 2024-08-31.csv (34,344 records)
- [ ] 2025-03-23.csv (50,020 records - first with English names)
- [ ] 2025-06-15.csv (55,202 records)
- [ ] 2025-07-15.csv (58,380 records)
- [ ] 2025-07-31.csv (60,199 records - latest)

---

## Testing

### Unit Tests
- [ ] Unit tests for CSV validation (`src/lib/csv-utils.ts`)
  - Test column mapping (MOH format → internal format)
  - Test gender normalization (M/F/O → MALE/FEMALE/OTHER)
  - Test date format handling (YYYY-MM-DD and MM/DD/YYYY)
  - Test nullable date handling
  - Test error handling for invalid CSV

### Integration Tests
- [ ] Integration tests for bulk upload simulate/apply/rollback
  - Test simulation with inserts/updates/deletes
  - Test apply with Blob storage upload
  - Test rollback with LIFO enforcement
  - Test rollback conflict detection

### E2E Tests
- [ ] E2E tests for moderation flow (approve/reject/supersede)
  - Test community submission creation
  - Test admin moderation actions
  - Test email notifications

### Test Infrastructure
- [ ] (Optional) Fixtures: move CSV examples into `tests/fixtures/`
- [ ] (Optional) Test database seeding script
- [ ] (Optional) E2E testing framework (Playwright/Cypress)

---

## Future Enhancements

### Performance
- [ ] Consider implementing pagination for bulk uploads list
- [ ] Add search/filter functionality for audit logs
- [ ] Optimize PersonVersion queries for large datasets

### Features
- [ ] Export functionality for Person records (CSV/JSON)
- [ ] Bulk delete functionality for Person records
- [ ] Advanced search filters for Person records
- [ ] Bulk moderation actions (approve/reject multiple submissions)

### Monitoring
- [ ] Add error tracking (Sentry/similar)
- [ ] Add performance monitoring
- [ ] Add usage analytics

---

**Last Updated**: 2025-10-06  
**Philosophy**: Move fast, no cruft. When tasks are done, they go in the commit message and get removed from here.
