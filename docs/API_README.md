# API Documentation

**Version**: 2.0.0  
**Last Updated**: 2025-10-06

---

## 📚 Documentation Files

We have **two separate API documentation files** based on your role:

### For External Developers (Public Apps)

📘 **[PUBLIC_AND_COMMUNITY_API.md](./PUBLIC_AND_COMMUNITY_API.md)**

**Target Audience**: Developers building public-facing applications

**What's Inside:**
- ✅ Public endpoints (no auth required)
- ✅ Community submission workflows
- ✅ Complete React/TypeScript code examples
- ✅ Photo upload guides
- ✅ Error handling best practices
- ✅ Authentication setup with Clerk

**Endpoints Covered:**
- `GET /api/public/persons` - List records
- `GET /api/public/person/{id}` - Get single record
- `GET /api/public/stats` - Public statistics
- `POST /api/community/submit` - Submit records/edits
- `POST /api/community/upload-photo` - Upload photos
- `GET /api/community/my-submissions` - View submissions

---

### For Internal Staff (Admins & Moderators)

🔐 **[ADMIN_AND_MODERATOR_API.md](./ADMIN_AND_MODERATOR_API.md)**

**Target Audience**: Internal admin and moderator staff

**What's Inside:**
- ✅ Admin-only endpoints (bulk uploads, system management)
- ✅ Moderator endpoints (content review, approval workflows)
- ✅ Complete data models (Person, PersonVersion, etc.)
- ✅ Audit logging reference
- ✅ Role hierarchy and permissions
- ✅ Advanced filtering and statistics

**Endpoints Covered:**
- **Admin** (`/api/admin/*`):
  - Bulk CSV uploads (simulate/apply/rollback)
  - Clear database
  - User role management
- **Moderator** (`/api/moderator/*`):
  - Review submissions (approve/reject)
  - View all persons with filters
  - Full statistics
  - Audit logs

---

## Quick Start

### I'm building a public website
👉 Start with **[PUBLIC_AND_COMMUNITY_API.md](./PUBLIC_AND_COMMUNITY_API.md)**

### I'm an admin/moderator
👉 Start with **[ADMIN_AND_MODERATOR_API.md](./ADMIN_AND_MODERATOR_API.md)**

---

## API Hierarchy

```
/api
  ├── /admin/*           → Admin only (requireAdmin)
  │   └── System management, bulk uploads, user roles
  │
  ├── /moderator/*       → Moderator + Admin (requireModerator)
  │   └── Content moderation, data review, audit logs
  │
  ├── /community/*       → Authenticated users (requireAuth)
  │   └── Submit records, upload photos, view own submissions
  │
  └── /public/*          → No authentication required
      └── View records, search, public statistics
```

---

## Other Documentation

- **[PROJECT.md](./PROJECT.md)** - Project overview and features
- **[ENGINEERING.md](./ENGINEERING.md)** - Technical architecture
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[TODO.md](./TODO.md)** - Task tracking

---

## Support

- **External Developers**: Review PUBLIC_AND_COMMUNITY_API.md first
- **Internal Staff**: Review ADMIN_AND_MODERATOR_API.md first
- **Technical Issues**: Contact development team

---

**Status**: Production Ready ✅  
**Base URL**: https://gazadeathtoll-admin.vercel.app

