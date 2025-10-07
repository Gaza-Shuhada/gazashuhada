# Major refactor: UI improvements, database optimization, and comprehensive documentation

## 🎨 Favicon Generation & Fixes
- Generate favicons from `public/favicon.avif` at correct sizes (`icon.png`, `apple-icon.png`, `favicon.ico`)
- Fix `favicon.ico` format issue (was AVIF, now proper PNG/ICO)
- Update `layout.tsx` metadata with correct icon references
- **Files:** `src/app/layout.tsx`, `public/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png`

---

## 🔒 Git Workflow Rules
- Add explicit rule to `.cursorrules`: **NEVER commit without explicit user permission**
- Document AI agent workflow: make changes, prepare messages, but let user control commits
- **Files:** `.cursorrules`

---

## 🚀 File Upload & Performance Optimization

### Increased Body Size Limits
- Raise Next.js body size limit to **10MB** for large CSV uploads
- Configure `experimental.serverActions.bodySizeLimit: '10mb'` in `next.config.js`
- Add custom header for `/api/*` routes indicating 10MB limit
- **Files:** `next.config.js`

### PostgreSQL Bind Variable Batching
- **Problem:** PostgreSQL has 32,767 bind variable limit; large bulk uploads (30K+ records) were failing
- **Solution:** Implement comprehensive batching across all database operations

**Batch sizes configured:**
- `MAX_BATCH_SIZE: 10,000` - for `findMany` queries with `IN` clauses
- `INSERT_BATCH_SIZE: 5,000` - for `createMany` operations
- `UPDATE_BATCH_SIZE: 100` - for update operations
- `DELETE_BATCH_SIZE: 100` - for delete operations

**Batching applied to:**
- `prisma.person.findMany()` - split large ID arrays into chunks
- `prisma.person.createManyAndReturn()` - batch inserts
- `prisma.personVersion.createMany()` - batch version history
- `prisma.personVersion.groupBy()` - batch groupBy queries for latest versions
- `prisma.person.updateMany()` - batch updates (in migration script)
- `prisma.personVersion.updateMany()` - batch updates (in migration script)

**Files:** 
- `src/lib/bulk-upload-service-ultra-optimized.ts`
- `src/app/api/admin/bulk-upload/simulate/route.ts`
- `src/app/api/admin/bulk-upload/apply/route.ts`
- `src/app/api/admin/bulk-upload/list/route.ts`

### API Route Configuration
- Add `runtime = 'nodejs'` to bulk upload routes (required for large file processing)
- Add `maxDuration = 60s` for simulate, `300s` (5min) for apply
- Add `dynamic = 'force-dynamic'` to prevent caching
- Document all non-vanilla Next.js configs with reasons
- **Files:** All `/api/admin/bulk-upload/*` routes

---

## 📚 Comprehensive Documentation

### New DATABASE.md
- **Complete database schema documentation** with entity relationships
- Document design patterns:
  - **Event sourcing** with `PersonVersion` for full audit trail
  - **Two-phase moderation** via `CommunitySubmission`
  - **Conflict detection** using `baseVersionId`
- Explain lifecycle of community submissions (NEW_RECORD vs EDIT)
- Clarify when `Person` and `PersonVersion` records are created
- **Files:** `docs/DATABASE.md` (new)

### Enhanced ENGINEERING.md
- Add "⚙️ Configuration Limits & Performance Settings" section
- Document Next.js config, PostgreSQL constraints, Prisma transaction settings
- Document batch size variables with explanations
- Document `runtime`, `maxDuration`, `dynamic` route exports with reasons
- Link to `DATABASE.md` for detailed schema documentation
- **Files:** `docs/ENGINEERING.md`

---

## 🎯 Toast Notifications (Sonner)

### Replace Inline Alerts
- Replace all inline error/success messages and `alert()` calls with toast notifications
- Use `sonner` library (already installed via shadcn/ui)
- Configure toasts with `duration: Infinity` (persist until manually dismissed)
- Preserve inline error code in comments for easy revert if needed

**Implemented in:**
- **Bulk Uploads:** Simulate/Apply/Rollback feedback
- **Submissions:** Photo upload validation, form submission success/error
- **All admin actions:** Consistent toast-based feedback

**Files:**
- `src/app/tools/bulk-uploads/BulkUploadsClient.tsx`
- `src/app/submission/page.tsx`
- `src/app/layout.tsx` (added `<Toaster />` component)

## 🗂️ Route Renaming & Navigation Updates

### Route Changes
- `/tools/settings` → `/tools/admin`
- `/community` → `/submission`
- `/records` → `/database`

### Navigation Updates
- Update `ToolsNavbar.tsx`: "Admin" link moved right of "Audit Logs"
- Update `PublicNavbar.tsx`: Update all route references
- Update `middleware.ts`: Update admin route matcher
- Update `src/app/tools/page.tsx`: Update dashboard card links and labels
- **Files:** 
  - Renamed directories: `src/app/tools/admin/`, `src/app/submission/`, `src/app/database/`
  - `src/components/ToolsNavbar.tsx`
  - `src/components/PublicNavbar.tsx`
  - `src/middleware.ts`
  - `src/app/tools/page.tsx`

---

## 🔍 Search Functionality

### Database Search
- Add search-as-you-type to `/database` page
- Implement debounced search (300ms delay)
- Search across: `name`, `nameEnglish`, `externalId` (case-insensitive)
- Show live result count during search
- Update API to accept `?search=` query parameter

**Files:**
- `src/components/PersonsTable.tsx` (UI + debounce logic)
- `src/app/api/moderator/persons/route.ts` (search query logic)

---

## 📊 Dashboard Stats Fixes

### Stats Accuracy
- Fix `/tools` dashboard to correctly display record counts
- Add "Data Source" stats: **MoH Updates** (confirmed by MoH) vs **Community** (user contributions)
- Fix API to exclude soft-deleted records (`isDeleted: false`) from default queries
- Change dashboard title from "Admin Dashboard" to "Dashboard"
- Remove redundant "Administrative Actions" card

### confirmedByMoh Field
- **Problem:** Bulk uploads weren't setting `confirmedByMoh: true`, causing incorrect stats
- **Solution:** Update `bulk-upload-service-ultra-optimized.ts` to set `confirmedByMoh: true` for all INSERT/UPDATE/DELETE operations from bulk uploads
- Create and run migration script to fix existing records: `scripts/fix-confirmed-by-moh.ts`
- Apply batching to migration script to avoid bind variable limits

**Files:**
- `src/app/api/moderator/stats/route.ts`
- `src/app/api/moderator/persons/route.ts`
- `src/app/tools/page.tsx`
- `src/lib/bulk-upload-service-ultra-optimized.ts`

---

## 🗄️ Database Schema Updates

### SubmissionType Enum
- Add `NEW_RECORD` to `SubmissionType` enum (was only `EDIT` and deprecated `FLAG`)
- Remove deprecated `FLAG` enum value completely (clean deletion, no backwards compatibility)
- Create manual migration: `prisma/migrations/20251007_update_submission_type_enum/migration.sql`
- Create manual migration: `prisma/migrations/20251007_remove_flag_enum_value/migration.sql`

### CommunitySubmission Nullable Fields
- Make `baseVersionId` and `personId` nullable in `CommunitySubmission` table
- **Reason:** `NEW_RECORD` submissions don't have a person or version yet (created on approval)
- Create manual migration: `prisma/migrations/20251007_make_baseversion_nullable/migration.sql`

**Files:**
- `prisma/schema.prisma`
- `prisma/migrations/20251007_update_submission_type_enum/migration.sql`
- `prisma/migrations/20251007_remove_flag_enum_value/migration.sql`
- `prisma/migrations/20251007_make_baseversion_nullable/migration.sql`

---

## 💅 UI/UX Improvements

### Bulk Upload Form
- Make input fields responsive: `w-full md:w-1/2` (full width on mobile, half width on desktop)
- Apply to: CSV file input, Label input, Date Released input
- **Files:** `src/app/tools/bulk-uploads/BulkUploadsClient.tsx`

### Submission Form Layout
- Refactor "Suggest Edit" form to two-column layout (matching "Propose New Record")
- Group location coordinates under single label for better UX
- **Files:** `src/app/submission/page.tsx`

---

## 🧹 Code Quality

### Philosophy Adherence
- ✅ Zero backwards compatibility (clean enum removal, no legacy code)
- ✅ Always use shadcn/ui components (Button, Input, Card, Toast)
- ✅ Use shadcn color tokens (`text-foreground`, `text-muted-foreground`, etc.)
- ✅ TypeScript strict mode, proper error handling
- ✅ Server Components by default, `'use client'` only when needed

---

## 🔧 Technical Debt Cleanup
- Remove duplicate `next.config.ts` (consolidated into `next.config.js`)
- Clean up temporary scripts after execution
- Document all non-standard configurations with clear reasoning

---

## Testing Checklist

- [ ] Bulk upload with 30K+ records (test batching)
- [ ] Upload CSV file >5MB (test body size limit)
- [ ] Create NEW_RECORD submission (test nullable fields)
- [ ] Search database by name (test search-as-you-type)
- [ ] Check dashboard stats (MoH Updates vs Community should add up to total)
- [ ] Test all toast notifications (persist until dismissed)
- [ ] Navigate renamed routes (/admin, /submission, /database)
- [ ] Test on mobile (responsive input fields, full-width on mobile)
- [ ] Verify favicons display correctly in browser

---

## Package Dependencies
- `sharp` - Image processing (resize, convert AVIF/WebP to PNG)
- `sonner` - Toast notification library (via shadcn/ui)

---

**Philosophy:** Move fast, no cruft, zero backwards compatibility. This commit removes deprecated features cleanly (FLAG enum), optimizes for scale (batching), and documents everything comprehensively (DATABASE.md, ENGINEERING.md).
