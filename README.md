# Gaza Death Toll - Admin Tools

Admin control panel for managing the Gaza Death Toll database. Handles bulk uploads, community submissions, and moderation workflows.

> **Note**: This is the **admin tools** repository. A separate public-facing web application provides end-user features (search, filtering, analytics).

---

## Features

### ✅ Core Features (Completed)

#### 1. Bulk Upload System
- Upload CSV files with person records (name, gender, date of birth)
- **Client-side CSV validation** before upload (instant feedback)
- Simulation preview showing INSERT/UPDATE/DELETE operations
- **Trust simulation** optimization (applies simulation results directly without re-fetching)
- Transaction-safe apply with rollback capability
- LIFO rollback protection (prevents conflicts)
- Audit logging for all operations
- Comment and date tracking for uploads
- **Performance**: Handles 60K+ records with PostgreSQL batching and optimized workflows

#### 2. Community Submissions
- **Edit Suggestions**: Propose changes to death-related information for existing records
- **Photo Upload**: Integrated Vercel Blob storage with automatic resizing
  - Automatic resize to 2048x2048px max
  - Converts to optimized WebP/JPEG
  - 10MB file size limit
- **Location Coordinates**: Lat/lng coordinates for death locations
  - Validation: -90 to 90 (latitude), -180 to 180 (longitude)
- **Submission History**: Track your own submissions and their status
- **Toast Notifications**: Real-time feedback via persistent toast messages
- **Note**: Only edits to existing records are allowed (identity fields from MoH cannot be changed)

#### 3. Moderation Queue
- Review pending community submissions (FIFO queue)
- Approve or reject with optional notes
- Photo preview with click-to-enlarge
- Before/after comparison for edits
- Transaction-safe operations
- Audit logging

#### 4. Database Browser
- Browse all person records with pagination
- **Search as you type**: Find records by name or external ID
- Version tracking for each record
- Deletion status indicators
- Photo thumbnails with click-to-enlarge
- Location coordinates display

#### 5. Audit System
- Complete audit trail of all admin actions
- User, timestamp, and metadata tracking
- Filterable by action type and resource

#### 6. Dashboard
- Real-time statistics (total records, photos, pending submissions)
- Quick access to all admin tools

---

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: Clerk (session-based, role-based access control)
- **UI Components**: shadcn/ui ⭐ **Required for all UI development**
- **Notifications**: Sonner (toast notifications via shadcn/ui)
- **Storage**: Vercel Blob (photo uploads)
- **Image Processing**: Sharp (AVIF/PNG conversion, WebP optimization, resizing)
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel

> **🎨 UI Development Rule**: This project uses [shadcn/ui](https://ui.shadcn.com) for ALL UI components. Never build custom buttons, forms, tables, etc. Always check shadcn first! See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Clerk account (for authentication)
- Vercel account (for Blob storage)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd gazadeathtoll-admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file:

```bash
# Database
npm install -g vercel
vercel link
vercel env pull
copy .env.local to .env for prisma
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   │   ├── admin/          # Admin-only endpoints
│   │   │   ├── moderator/      # Moderator + Admin endpoints
│   │   │   ├── community/      # Community + Staff endpoints
│   │   │   └── public/         # Public read-only endpoints
│   │   ├── tools/              # Admin tool pages
│   │   │   ├── bulk-uploads/   # Bulk upload page
│   │   │   ├── moderation/     # Moderation queue
│   │   │   ├── audit-logs/     # Audit log page
│   │   │   └── admin/          # Admin settings
│   │   ├── database/           # Database browser (formerly /records)
│   │   ├── submission/         # Community submission form (formerly /community)
│   │   └── page.tsx            # Public landing page
│   ├── components/             # React components (shadcn/ui + custom)
│   ├── lib/                    # Utilities and services
│   └── middleware.ts           # Auth middleware (role-based access)
└── docs/                       # Documentation
    ├── DATABASE.md             # Database schema and design
    ├── ENGINEERING.md          # Technical architecture
    ├── PRODUCT.md              # Product overview
    ├── CONTRIBUTING.md         # Contribution guidelines
    └── API docs/               # API endpoint documentation
```

---

## Role-Based Access Control

### Roles (2 roles stored in Clerk)

1. **Admin**: Full system access
2. **Moderator**: Can moderate submissions and view records

**Note**: "Community" is NOT a role - it refers to any logged-in user who can submit proposals.

### Access Matrix

| Feature | Admin | Moderator | Any Logged-In User |
|---------|-------|-----------|-------------------|
| Bulk Uploads | ✅ | ❌ | ❌ |
| Community Submissions | ✅ | ✅ | ✅ |
| Moderation Queue | ✅ | ✅ | ❌ |
| Records Browser | ✅ | ✅ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ❌ |

---

## Key Concepts

### Person Record
- **Identity Fields**: Cannot be edited (name, gender, date of birth) - sourced from Ministry of Health
- **Death Information**: Can be updated via community submissions (date of death, location, photos)
- **Version Tracking**: Every change creates a new version with full audit trail
- **Data Source**: All identity data originates from Ministry of Health CSV releases

### Versioning
- Each person has multiple versions tracked in `PersonVersion`
- Version 1 = initial creation (INSERT)
- Subsequent versions = updates (UPDATE) or soft-deletes (DELETE)
- All versions linked to a `ChangeSource` (bulk upload or community submission)

### Bulk Upload Workflow
1. Upload CSV file
2. Simulation shows what will change
3. Review INSERTs, UPDATEs, DELETEs
4. Apply to database (transaction-safe)
5. Can rollback if needed (LIFO protection)

### Community Submission Workflow
1. Community member submits EDIT for existing person
2. Submission enters moderation queue (PENDING)
3. Moderator reviews and approves/rejects
4. If approved, changes applied to database as new version
5. All identity fields remain unchanged (sourced from MoH)

---

## Documentation

### Essential Reading
- 🗄️ **[DATABASE.md](docs/DATABASE.md)** - Database schema, design patterns, event sourcing
- 🏗️ **[ENGINEERING.md](docs/ENGINEERING.md)** - Technical architecture, configuration, performance
- 📦 **[PRODUCT.md](docs/PRODUCT.md)** - Product overview, features, workflows
- 🤝 **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Development standards (read .cursorrules!)

### API Documentation
- 📘 **[Public & Community API](docs/PUBLIC_AND_COMMUNITY_API.md)** - For external developers
- 🔐 **[Admin & Moderator API](docs/ADMIN_AND_MODERATOR_API.md)** - For internal staff
- 📚 **[API Overview](docs/API_README.md)** - Quick start guide

### Additional
- [TODOs](docs/TODO.md) - Follow-up tasks and planned features

---

## Development

### Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database commands
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Create and apply migration
npx prisma db push             # Push schema changes
npx prisma generate            # Regenerate Prisma client
```

### Database Migrations

When changing the schema:

1. Edit `prisma/schema.prisma`
2. Dev: run `npx prisma migrate dev --name description`
3. CI/Prod: run `npx prisma migrate deploy`
3. Commit both schema and migration files

---

## Environment Setup

### Clerk Authentication

1. Create account at [clerk.com](https://clerk.com)
2. Create application
3. Get API keys from dashboard
4. Add to `.env`

### Vercel Blob Storage

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Storage → Create Blob store
3. Copy `BLOB_READ_WRITE_TOKEN`
4. Add to `.env`

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

---

## Contributing

1. Follow existing code style
2. Test changes locally
3. Update documentation
4. Create pull request

---

## License

[To be determined]

---

## Contact

[To be determined]
