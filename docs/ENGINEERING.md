# Engineering - Gaza Death Toll Admin Tools

> Scope: Admin tools only. Public-facing webapp is a separate repo.

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
│   │   ├── bulk-upload-service-ultra-optimized.ts  # Bulk upload logic
│   │   ├── blob-storage.ts         # Vercel Blob utilities
│   │   ├── csv-utils.ts            # CSV parsing and validation
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


