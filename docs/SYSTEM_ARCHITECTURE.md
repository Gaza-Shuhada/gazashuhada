# System Architecture

## Project Overview

This repository contains the **Control Panel** for the Gaza Deaths database system.

### Two-Application Architecture

The complete system consists of two separate web applications:

#### 1. **Control Panel** (This Repository)
**Purpose**: Internal staff tool for data management and moderation

**Users**: Admins and moderators only

**Key Features**:
- Bulk data uploads with CSV validation
- Version history management and rollback
- Community submission moderation
- Audit logging of all admin actions
- Basic record browsing for verification
- Role-based access control

**Tech Stack**: Next.js 15, PostgreSQL, Prisma, Clerk Auth, TypeScript, Tailwind CSS

#### 2. **Public-Facing Application** (Separate Repository - To Be Built)
**Purpose**: Public data consumption and visualization

**Users**: General public, researchers, journalists, community members

**Key Features**:
- Advanced search and filtering (by name, date, location, etc.)
- Sort and pagination with large result sets
- Data analytics and statistics
- Interactive visualizations and maps
- Export capabilities (CSV, JSON, API)
- Community submission interface (flag errors, propose edits)
- Public API for data access

**Tech Stack**: TBD (likely Next.js or similar modern framework)

---

## Why Two Separate Applications?

### Security & Access Control
- Control panel requires strict authentication and role-based access
- Public app needs to be open and performant for all users
- Separation prevents accidental exposure of admin features

### Performance & Scalability
- Public app can be optimized for read-heavy operations
- Control panel handles write-heavy operations (uploads, moderation)
- Can scale independently based on usage patterns

### Development & Deployment
- Control panel has different release cycles than public app
- Can deploy updates to control panel features without affecting public users
- Separate error tracking and monitoring for each system

### User Experience
- Control panel is a power user tool with complex workflows
- Public app is designed for intuitive public data consumption
- Different design systems and UX patterns

---

## Shared Database

Both applications connect to the **same PostgreSQL database**:

- Control panel **writes** data (bulk uploads, moderation decisions)
- Public app primarily **reads** data (with community submissions writing to moderation queue)
- Version history and audit trails maintained by control panel
- Public app queries the current state from `Person` table
- Community submissions flow through moderation workflow

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    External Data Sources                 │
│              (CSV files, official records)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ (Admin uploads)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     Control Panel                        │
│  - Validate & simulate CSV uploads                       │
│  - Apply bulk updates (INSERT/UPDATE/DELETE)             │
│  - Manage version history                                │
│  - Moderate community submissions                        │
│  - Audit all actions                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ (Writes to database)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL Database                       │
│  - Person (current state)                                │
│  - PersonVersion (full history)                          │
│  - ChangeSource (provenance)                             │
│  - CommunitySubmission (moderation queue)                │
│  - AuditLog (admin actions)                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ (Reads from database)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                Public-Facing Application                 │
│  - Search & filter records                               │
│  - Display analytics & visualizations                    │
│  - Export data                                           │
│  - Community submission interface                        │
│  - Public API                                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ (Community flagging/editing)
                       ▼
                   (Back to moderation queue in database)
```

---

## Current Status

- ✅ **Control Panel**: Phase 3 complete (bulk uploads, versioning, audit logs, RBAC)
- 🚧 **Control Panel**: Phase 4 in progress (community moderation workflows)
- ⏳ **Public Application**: Not yet started (future development)

---

## Developer Notes

### For Future AI Agents / Developers:

1. **This repository is the control panel only** - do not add public-facing features here
2. **Records browser is basic by design** - advanced search/filter belongs in the public app
3. **Performance considerations differ** - control panel handles 40k records but is for staff use only
4. **Public app requirements** should not influence control panel design decisions
5. **Database schema is shared** - changes here affect both applications

### When Building the Public App:

1. Connect to the same PostgreSQL database
2. Read primarily from `Person` table (current state)
3. For history, query `PersonVersion` table
4. Community submissions write to `CommunitySubmission` table
5. Use read replicas if needed for performance
6. Implement proper caching strategy
7. Consider API rate limiting and abuse prevention

---

## Questions or Clarifications?

If implementing features, always ask: "Is this for admins or for the public?" The answer determines which repository it belongs in.

