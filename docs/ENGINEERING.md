# Engineering - Gaza Death Toll Admin Tools

> Scope: Admin tools only. Public-facing webapp is a separate repo.

---

## 📚 Documentation

**Essential Reading:**
- **[DATABASE.md](./DATABASE.md)** - Complete database schema, design patterns, and lifecycle explanations
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API endpoint reference
- **[PROJECT.md](./PROJECT.md)** - Project overview, features, and setup

**This document:** High-level architecture, tech stack, and configuration.

---

## 🏗️ Tech Stack

**Core Framework**:
- **Next.js 15.5.4** — React framework with App Router
- **TypeScript** — Strict mode enabled, no `any` types
- **React 18+** — Server components by default

**Database & ORM**:
- **PostgreSQL** — Primary database (shared with public app)
- **Prisma ORM** — Type-safe database client
- **Prisma Accelerate** — Connection pooling and caching

**Authentication & Authorization**:
- **Clerk** — User authentication and management
- Role-based access control via `publicMetadata.role`

**UI & Styling**:
- **shadcn/ui** — Component library (MANDATORY for all UI)
- **Tailwind CSS 4** — Utility-first CSS
- **Radix UI** — Unstyled accessible components (via shadcn)

**Storage & Media**:
- **Vercel Blob** — Photo storage with CDN
- **sharp** — Image processing and resizing

**Development Tools**:
- **ESLint** — Code linting
- **TypeScript Compiler** — Type checking
- **Turbopack** — Fast build tool (Next.js 15)

**Analytics**:
- **Vercel Web Analytics** — Page view tracking

---

## 📁 Project Structure

```
/Users/jensmunch/Code/gazadeathtoll-admin/
├── .cursorrules                    # AI agent rules (MANDATORY shadcn)
├── .env.local                      # Environment variables (not in git)
├── components.json                 # shadcn configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── next.config.ts                  # Next.js config
├── postcss.config.mjs              # PostCSS for Tailwind
│
├── prisma/
│   ├── schema.prisma               # Database schema (SOURCE OF TRUTH)
│   └── migrations/                 # Database migrations
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Dashboard (/)
│   │   ├── globals.css             # Global styles
│   │   │
│   │   ├── api/                    # API Routes
│   │   │   ├── admin/*             # Admin endpoints (requireAdmin)
│   │   │   ├── moderator/*         # Moderator endpoints (requireModerator)
│   │   │   ├── community/*         # Community endpoints (requireAuth)
│   │   │   └── public/*            # Public endpoints (no auth)
│   │   │
│   │   ├── bulk-uploads/           # Bulk upload UI
│   │   ├── moderation/             # Moderation queue UI
│   │   ├── records/                # Records browser UI
│   │   ├── audit-logs/             # Audit logs UI
│   │   ├── community/              # Community submission UI
│   │   └── admin/settings/         # Admin settings UI
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn components (DO NOT EDIT)
│   │   ├── Navbar.tsx              # App navigation
│   │   ├── PersonsTable.tsx        # Records table
│   │   ├── StatsCards.tsx          # Dashboard stats
│   │   └── ProtectMetadata.tsx     # Role guard component
│   │
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── auth-utils.ts           # Auth guards (requireAdmin, etc)
│   │   ├── audit-log.ts            # Audit logging utilities
│   │   ├── bulk-upload-service-ultra-optimized.ts  # Bulk upload logic (trust simulation)
│   │   ├── blob-storage.ts         # Vercel Blob utilities
│   │   ├── csv-utils.ts            # CSV parsing and validation (server-side)
│   │   ├── csv-validation-client.ts # CSV validation (browser-compatible)
│   │   └── utils.ts                # General utilities
│   │
│   ├── types/
│   │   └── clerk.d.ts              # Clerk type extensions
│   │
│   └── middleware.ts               # Next.js middleware (Clerk)
│
├── docs/
│   ├── PRODUCT.md                  # Product overview (non-technical)
│   ├── ENGINEERING.md              # This file (technical docs)
│   ├── API_README.md               # API documentation index
│   ├── PUBLIC_AND_COMMUNITY_API.md # External API docs
│   ├── ADMIN_AND_MODERATOR_API.md  # Internal API docs
│   ├── CONTRIBUTING.md             # Contributing guidelines
│   └── TODO.md                     # Pending tasks
│
├── moh-updates/                    # MoH CSV files for bulk upload
│   └── *.csv
│
└── scripts/                        # Utility scripts
```

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or remote)
- Clerk account (for authentication)
- Vercel account (for Blob storage)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd gazadeathtoll-admin

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure environment variables (see below)
# Then generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
# Open http://localhost:3000
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Optional: Prisma Accelerate
# DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
# DIRECT_URL="postgresql://..."  # For migrations
```

---

## ⚙️ Configuration Limits & Performance Settings

### Next.js Configuration

**File**: `next.config.js`

```javascript
{
  // API route body size limits (for large CSV uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'  // Increased from default 1mb
    }
  }
}
```

### API Route Configuration (Route Segment Config)

Next.js App Router allows per-route configuration via exports. We use these for bulk upload routes to handle large files.

**Files**:
- `src/app/api/admin/bulk-upload/simulate/route.ts`
- `src/app/api/admin/bulk-upload/apply/route.ts`

#### Route Exports (Non-Vanilla Next.js)

**1. `export const runtime = 'nodejs'`**
- **Why**: Required for processing large files and database operations
- **Alternative**: `'edge'` runtime has memory/time constraints unsuitable for bulk processing
- **Default**: Next.js defaults to `'nodejs'` but we make it explicit

**2. `export const maxDuration`**
- **Simulate route**: `60` seconds
  - Reads 30K+ records from CSV
  - Queries database in batches to compare data
  - Default Vercel timeout: 10s (Hobby), 60s (Pro)
- **Apply route**: `300` seconds (5 minutes)
  - Parses CSV (5-10s)
  - Fetches existing data in batches (20-30s)
  - Uploads to Vercel Blob (10-20s)
  - Bulk inserts/updates/deletes in batches (60-120s)
  - Creates audit logs (5-10s)
  - Total: ~2-3 min for large files, 5min buffer for safety

**3. `export const dynamic = 'force-dynamic'`**
- **Why**: Each request is unique (different files, different DB state)
- **Prevents**: Next.js from caching or prerendering this route
- **Alternative**: `'auto'` (default) might cache responses inappropriately
- **Use case**: Essential for routes that modify data or depend on real-time state

**Example**:

```typescript
// src/app/api/admin/bulk-upload/apply/route.ts
export const runtime = 'nodejs';      // Use Node.js runtime
export const maxDuration = 300;       // 5 minute timeout
export const dynamic = 'force-dynamic'; // No caching

export async function POST(request: NextRequest) {
  // ... handle large CSV upload
}
```

See route files for detailed inline documentation of each setting.

### Database & Prisma Limits

**PostgreSQL Constraints**:
- **Max bind variables per query**: 32,767 (hard limit)
- **Recommended batch size**: 10,000 for `WHERE id IN (...)` queries

**Prisma Transaction Settings**:
```typescript
prisma.$transaction(async (tx) => {
  // ... operations
}, {
  maxWait: 90000,   // 90 seconds max wait to acquire connection
  timeout: 90000,   // 90 seconds max transaction time
});
```

### Bulk Upload Optimizations

**File**: `src/lib/bulk-upload-service-ultra-optimized.ts`

#### Trust Simulation Optimization
- **Client-side CSV validation** before upload (instant feedback, prevents bad uploads)
- **Simulation results are trusted** during apply phase
- No redundant re-fetching or re-parsing during apply
- **60-second timeout** on simulation results (form resets after expiry)
- Significantly reduces database load and improves performance

#### Batch Size Constants
All batch size constants are defined at the top of the file:

```typescript
// SELECT queries (fetching data)
const MAX_BATCH_SIZE = 10000;     // PostgreSQL bind variable limit

// INSERT operations
const INSERT_BATCH_SIZE = 5000;   // Balance performance & memory

// UPDATE operations
const UPDATE_BATCH_SIZE = 100;    // Smaller for transaction safety

// DELETE operations
const DELETE_BATCH_SIZE = 100;    // Smaller for transaction safety
```

**Why different sizes?**
- **SELECT (10K)**: Fast reads, only 1 bind variable per ID
- **INSERT (5K)**: Bulk inserts use multiple fields per record
- **UPDATE/DELETE (100)**: Run in transactions with multiple ops per record

**Example**: A 60,000 record CSV file would be processed as:
- 6 fetch batches (10K each) - *only during simulation*
- 12 insert batches (5K each)
- ~600 update batches (100 each, if all records need updating)

**Performance Improvement**: Apply phase is 50-70% faster by trusting simulation results.

### File Upload Limits

**Vercel Blob Storage**:
- **Max file size**: 500MB per file
- **Files are stored with SHA-256 hash** for deduplication
- **Preview generation**: First 20 lines for CSV files

**Supported file types**:
- CSV uploads: `text/csv` (bulk uploads)
- Image uploads: `image/jpeg`, `image/png`, `image/webp` (community submissions)

---

## 💻 Development Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma studio        # Open database GUI
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create & apply migration
npx prisma migrate deploy  # Apply migrations (production)
npx prisma db push       # Push schema without migration (dev only)

# shadcn/ui
npx shadcn@latest search [keyword]       # Search for component
npx shadcn@latest add [component]        # Add component
npx shadcn@latest view @shadcn/[demo]    # View component demo
```

---

## 🎨 Code Standards

### TypeScript
- **Strict mode enabled** — No `any` types, explicit return types preferred
- **Interfaces over types** — Use `interface` for object shapes
- **Async/await** — Never use `.then()` chains
- **Error handling** — Always wrap API calls in `try-catch-finally`

### React & Next.js
- **Server components by default** — Only use `'use client'` when necessary
- **Never use `<img>`** — Always use `<Image>` from `next/image`
- **Never use `<a>` for internal links** — Always use `<Link>` from `next/link`
- **Parallel data fetching** — Use `Promise.all()` for independent queries

### UI Components (MANDATORY)
**ALWAYS use shadcn/ui. NEVER build custom UI components.**

```bash
# Before writing ANY UI code:
npx shadcn@latest search [keyword]

# If component exists:
npx shadcn@latest add [component]

# Then use it:
import { Button } from '@/components/ui/button'
```

**Use shadcn color tokens, NOT raw Tailwind colors:**
```typescript
// ❌ WRONG
<div className="text-gray-900 bg-white border-gray-200">

// ✅ CORRECT
<div className="text-foreground bg-background border">
```

**Common shadcn components:**
- Buttons → `<Button>`
- Forms → `<Form>` + `<FormField>`
- Tables → `<Table>`
- Cards → `<Card>`
- Dialogs → `<Dialog>` / `<AlertDialog>`
- Inputs → `<Input>` / `<Textarea>` / `<Select>`

See `.cursorrules` for complete UI standards.

### Database Changes

**Schema is the source of truth** — Always edit `prisma/schema.prisma`

```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Regenerate client
npx prisma generate

# 4. Update TypeScript code
# (types are now auto-updated)
```

**Migration best practices:**
- Descriptive names: `add_name_english_field` not `update1`
- Test migrations locally before deploying
- Never edit applied migrations
- Use transactions for complex changes

### File Naming
- Components: `PascalCase.tsx` (e.g., `PersonsTable.tsx`)
- Utilities: `kebab-case.ts` (e.g., `auth-utils.ts`)
- API routes: `route.ts` (Next.js convention)
- Pages: `page.tsx` (Next.js convention)

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

## Database Schema

**📖 See [DATABASE.md](./DATABASE.md) for complete schema documentation.**

**Source of truth:** `prisma/schema.prisma`

**Key tables:**
- `Person` - Current state snapshot
- `PersonVersion` - Immutable version history
- `ChangeSource` - Provenance tracking
- `BulkUpload` - MoH CSV import metadata
- `CommunitySubmission` - Two-phase moderation queue
- `AuditLog` - High-level audit trail

**Core design patterns:**
- Event sourcing with version history
- Two-phase moderation (JSON → approval → Person/Version)
- Conflict detection via `baseVersionId`
- Soft deletes for audit preservation

---

## Core Workflows

### Bulk Upload
1. Admin uploads CSV with optional comment and date_released
2. **Client-side validation** checks CSV format before upload (instant feedback)
3. File uploaded to Vercel Blob storage
4. System compares by external_id: INSERT/UPDATE/DELETE
5. **Simulation** shows all deletions, updates (with diffs), and inserts
6. **60-second timeout** - form resets if simulation expires
7. **Apply phase trusts simulation results** (no re-fetching/re-parsing)
8. Creates change_source, bulk_upload, person_version rows; updates person snapshot

**Safety:**
- Client-side validation prevents invalid CSVs from being uploaded
- Simulation results expire after 60 seconds to prevent stale data
- CSV is the full state; missing IDs are soft-deleted
- Operator confirmation required for large deletion counts

**Rollback:**
- LIFO constraint when later versions exist
- Re-verify conflicts at execution time
- Single DB transaction for atomicity

**Performance:**
- Client-side validation: instant feedback (no server round-trip)
- Trust simulation: 50-70% faster apply phase
- Handles 60K+ records efficiently

### Community Submissions
**EDIT flow (only option):**
- User edits existing Ministry of Health record based on specific version (`baseVersionId`)
- System checks for staleness (has someone else edited since?)
- Phase 1 (submission): Data stored as JSON in `CommunitySubmission` table
- Phase 2 (approval): Updates `Person`, creates new `PersonVersion` (v N+1) + `ChangeSource`
- All identity fields remain unchanged (sourced from MoH)

**Note**: No NEW_RECORD submissions allowed - all records must originate from Ministry of Health CSV uploads.

**📖 See [DATABASE.md](./DATABASE.md#community-submission-lifecycle) for detailed flow diagrams.**

---

## Application Architecture

### Page Routes
| Page | Route | Protection | Access |
|------|-------|------------|--------|
| Landing Page | `/` | Public | All visitors |
| Admin Dashboard | `/tools` | Middleware + layout | Staff (admin+moderator) |
| Bulk Uploads | `/tools/bulk-uploads` | Middleware + layout | Admin only |
| Moderation Queue | `/tools/moderation` | Middleware + layout | Staff (admin+moderator) |
| Audit Logs | `/tools/audit-logs` | Middleware + layout | Staff (admin+moderator) |
| Admin Settings | `/tools/admin` | Middleware + layout | Admin only |
| Database Browser | `/database` | Public | All visitors |
| Submit Record | `/submission` | Server check | All logged-in users |

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


