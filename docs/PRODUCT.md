# Gaza Death Toll - Admin Tools (Product Overview)

> Last Updated: 2025-10-03  
> Status: ✅ Production Ready

---

## 🎯 What This Is

Internal admin control panel for managing the Gaza Death Toll database.

**Purpose**: Data management, bulk uploads, community moderation  
**NOT**: Public-facing application (that's separate)

---

## ✅ Completed Features

### Core Features
- ✅ Bulk Uploads — CSV upload with simulation, apply, rollback
- ✅ Community Submissions — New record proposals and edit suggestions
- ✅ Photo Upload — Vercel Blob storage, auto-resize to 2048x2048
- ✅ Location Coordinates — Lat/lng fields (replaced string location)
- ✅ Moderation Queue — Review, approve/reject community submissions
- ✅ Records Browser — View all records with version tracking
- ✅ Audit Logs — Complete audit trail of all admin actions
- ✅ Role-Based Access — Admin, Moderator; any authenticated user can submit

### UI Components
- ✅ Migrated to shadcn/ui — All core components use shadcn
  - Tables, Cards, Buttons, Badges, Alerts
  - Forms, Inputs, Dialogs
  - Skeletons, Spinners

---

## 🏗️ Tech Stack

- Framework: Next.js 15.5.4 (App Router)
- Database: PostgreSQL + Prisma ORM
- Auth: Clerk (role-based access control)
- UI: shadcn/ui (mandatory for all UI)
- Storage: Vercel Blob (photos)
- Styling: Tailwind CSS 4

---

## 📁 Project Structure (High-level)

```
/
├── .cursorrules          # AI standards (shadcn mandatory)
├── docs/CONTRIBUTING.md  # Developer guidelines
├── src/
│   ├── app/              # Next.js pages (App Router)
│   ├── components/       # React components
│   │   └── ui/           # shadcn components
│   └── lib/              # Utilities
├── prisma/
│   └── schema.prisma     # Database schema (source of truth)
└── docs/
    ├── PRODUCT.md        # ⭐ Product overview (this file)
    ├── ENGINEERING.md    # Architecture, schema, workflows
    └── API_DOCUMENTATION.md
```

---

## 🎨 Development Standards

### UI Components
Rule: ALWAYS use shadcn/ui.

Before writing any UI:
```bash
npx shadcn@latest search [keyword]
npx shadcn@latest add [component]
```

See `.cursorrules` for complete details.

### Database Changes
```bash
# Edit schema
vim prisma/schema.prisma

# Create migration
npx prisma migrate dev --name description

# Apply migration
npx prisma migrate deploy
```

### Code Style
- TypeScript for all files
- Use async/await (not .then())
- Server components by default ('use client' only when needed)
- Use shadcn color tokens (e.g., `text-foreground`)

---

## 🔐 Access Control

| Role | Access |
|------|--------|
| Admin | Everything (bulk uploads, moderation, records, audit logs) |
| Moderator | Moderation, records, audit logs (no bulk uploads) |
| Community (any authenticated user) | Community submissions |

Notes:
- Roles stored in Clerk `publicMetadata.role`: `admin`, `moderator`.
- "Community" is not a stored role. Any authenticated user can submit community proposals.

---

## 🚀 Development

### Setup
```bash
npm install
cp .env.example .env  # Add your keys
npx prisma generate
npx prisma migrate dev
```

### Run
```bash
npm run dev
# Open http://localhost:3000
```

### Environment Variables Required
```bash
DATABASE_URL=                    # PostgreSQL connection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
BLOB_READ_WRITE_TOKEN=          # Vercel Blob
```

---

## 📚 Canonical Documentation

- `.cursorrules` — UI standards and development rules
- `docs/ENGINEERING.md` — Technical architecture, schema, workflows
- `docs/API_DOCUMENTATION.md` — API reference
- `docs/CONTRIBUTING.md` — Contributing guidelines
- `docs/TODO.md` — Follow-up tasks

---

## 🔄 Recent Changes

### October 2025
- ✅ Migrated all UI to shadcn/ui
- ✅ Added photo upload with Vercel Blob
- ✅ Changed location from string to lat/lng coordinates
- ✅ Fixed form input text visibility
- ✅ Added photo thumbnails in moderation and records

See `CHANGELOG.md` for complete history.

---

## 🎯 For AI Agents

1. This is an admin tool for data management
2. ALWAYS use shadcn/ui for UI components (see `.cursorrules`)
3. Schema source of truth is `prisma/schema.prisma` (see `docs/ENGINEERING.md`)
4. All features are complete; maintain and extend


