# Gaza Death Toll - Admin Tools

> **Last Updated**: 2025-10-03  
> **Status**: ✅ Production Ready  
> **Version**: 0.2.0

---

## 🎯 What This Is

Internal admin control panel for managing the Gaza Death Toll database.

**Purpose**: Data management, bulk uploads, community moderation  
**NOT**: Public-facing application (that's separate)

---

## ✅ Completed Features

### Core Features
- ✅ **Bulk Uploads** - CSV upload with simulation, apply, rollback
- ✅ **Community Submissions** - New record proposals and edit suggestions
- ✅ **Photo Upload** - Vercel Blob storage, auto-resize to 2048x2048
- ✅ **Location Coordinates** - Lat/lng fields (replaced string location)
- ✅ **Moderation Queue** - Review, approve/reject community submissions
- ✅ **Records Browser** - View all records with version tracking
- ✅ **Audit Logs** - Complete audit trail of all admin actions
- ✅ **Role-Based Access** - Admin, Moderator, Community roles

### UI Components
- ✅ **Migrated to shadcn/ui** - All core components use shadcn
  - Tables, Cards, Buttons, Badges, Alerts
  - Forms, Inputs, Dialogs
  - Skeletons, Spinners

---

## 🚧 Current Focus

**Nothing!** All planned features are complete.

### Future Enhancements (Not Urgent)
- [ ] Incremental migration of large forms to shadcn Form components
- [ ] Toast notifications for user actions (sonner already installed)
- [ ] Dark mode support (shadcn makes this easy)

---

## 🏗️ Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk (role-based access control)
- **UI**: shadcn/ui ⭐ **MANDATORY for all UI**
- **Storage**: Vercel Blob (photos)
- **Styling**: Tailwind CSS 4

---

## 📁 Project Structure

```
/
├── .cursorrules          # AI standards (shadcn mandatory)
├── CONTRIBUTING.md       # Developer guidelines
├── src/
│   ├── app/              # Next.js pages (App Router)
│   ├── components/       # React components
│   │   └── ui/          # shadcn components ⭐
│   └── lib/             # Utilities
├── prisma/
│   └── schema.prisma    # Database schema
└── docs/
    ├── PROJECT.md       # ⭐ This file
    ├── API_DOCUMENTATION.md
    ├── engineering_spec.md
    └── ...
```

---

## 🎨 Development Standards

### UI Components
**Rule #1: ALWAYS use shadcn/ui**

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
- shadcn color tokens (`text-foreground`, not `text-gray-900`)

---

## 📊 Database Schema

### Core Tables
- **Person** - Main person records
- **PersonVersion** - Complete version history
- **ChangeSource** - Track where changes came from
- **BulkUpload** - Bulk upload metadata
- **CommunitySubmission** - Pending submissions
- **AuditLog** - Audit trail

See `docs/engineering_spec.md` for complete schema.

---

## 🔐 Access Control

| Role | Access |
|------|--------|
| **Admin** | Everything (bulk uploads, moderation, records, audit logs) |
| **Moderator** | Moderation, records, audit logs (no bulk uploads) |
| **Community** | Submit proposals only |

---

## 🚀 Development

### Setup
```bash
npm install
cp .env.example .env  # Add your keys
npx prisma generate
npx prisma db push
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

## 📚 Key Documentation

**For Development:**
- `.cursorrules` - UI standards ⭐
- `CONTRIBUTING.md` - Development guidelines
- `docs/engineering_spec.md` - Technical details
- `docs/API_DOCUMENTATION.md` - API reference

**For Features:**
- `docs/bulk_upload_guide.md` - Bulk upload guide
- `docs/csv_test_examples.md` - CSV format examples

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

**TL;DR for AI:**
1. This is an admin tool for data management
2. **ALWAYS use shadcn/ui** for UI components (see `.cursorrules`)
3. Database schema in `docs/engineering_spec.md`
4. All features are complete, just maintain and extend

**Quick Commands:**
```bash
# Add UI component
npx shadcn@latest add [component-name]

# Database changes
npx prisma migrate dev --name description

# Run dev server
npm run dev
```

---

**Questions?** Check `docs/README.md` for documentation index.

