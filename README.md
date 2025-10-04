# Gaza Death Toll - Admin Tools

Admin control panel for managing the Gaza Death Toll database. Handles bulk uploads, community submissions, and moderation workflows.

> **Note**: This is the **admin tools** repository. A separate public-facing web application provides end-user features (search, filtering, analytics).

---

## Features

### ✅ Core Features (Completed)

#### 1. Bulk Upload System
- Upload CSV files with person records (name, gender, date of birth)
- Simulation preview showing INSERT/UPDATE/DELETE operations
- Transaction-safe apply with rollback capability
- LIFO rollback protection (prevents conflicts)
- Audit logging for all operations
- Label and date tracking for uploads

#### 2. Community Submissions
- **New Record Proposals**: Community members can propose new person records
- **Edit Suggestions**: Propose changes to death-related information
- **Photo Upload**: Integrated Vercel Blob storage with automatic resizing
  - Automatic resize to 2048x2048px max
  - Converts to optimized JPEG
  - 10MB file size limit
- **Location Coordinates**: Lat/lng coordinates for death locations
  - Validation: -90 to 90 (latitude), -180 to 180 (longitude)
- **Submission History**: Track your own submissions and their status

#### 3. Moderation Queue
- Review pending community submissions (FIFO queue)
- Approve or reject with optional notes
- Photo preview with click-to-enlarge
- Before/after comparison for edits
- Transaction-safe operations
- Audit logging

#### 4. Records Management
- Browse all person records with pagination
- Version tracking for each record
- Deletion status indicators
- Photo thumbnails with click-to-enlarge
- Location coordinates display

#### 5. Audit System
- Complete audit trail of all admin actions
- User, timestamp, and metadata tracking
- Filterable by action type and resource

---

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: Clerk
- **UI Components**: shadcn/ui ⭐ **Required for all UI development**
- **Storage**: Vercel Blob (photo uploads)
- **Image Processing**: Sharp
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel

> **🎨 UI Development Rule**: This project uses [shadcn/ui](https://ui.shadcn.com) for ALL UI components. Never build custom buttons, forms, tables, etc. Always check shadcn first! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

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
DATABASE_URL="prisma+postgres://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
CLERK_WEBHOOK_SECRET="whsec_..."

# Vercel Blob Storage (for photo uploads)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

4. **Set up the database** (development)
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Run the development server**
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
│   │   │   ├── admin/          # Admin endpoints
│   │   │   └── community/      # Community endpoints
│   │   ├── audit-logs/         # Audit log page
│   │   ├── bulk-uploads/       # Bulk upload page
│   │   ├── community/submit/   # Community submission form
│   │   ├── dashboard/          # Main dashboard
│   │   ├── moderation/         # Moderation queue
│   │   └── records/            # Records browser
│   ├── components/             # React components
│   ├── lib/                    # Utilities and services
│   └── middleware.ts           # Auth middleware
└── docs/                       # Documentation
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
- **Identity Fields**: Cannot be edited (name, gender, date of birth)
- **Death Information**: Can be updated via community submissions
- **Version Tracking**: Every change creates a new version
- **Confirmation Status**: MoH-confirmed (bulk) vs community-submitted

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
1. Community member submits NEW_RECORD or EDIT
2. Submission enters moderation queue (PENDING)
3. Moderator reviews and approves/rejects
4. If approved, changes applied to database
5. Community records marked as `confirmedByMoh=false`

---

## Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Engineering](docs/ENGINEERING.md) - Technical architecture and workflows
- [Product Overview](docs/PRODUCT.md) - Product context and features
- [Contributing](docs/CONTRIBUTING.md) - How to contribute
- [TODOs](docs/TODO.md) - Follow-up tasks
- [Changelog](CHANGELOG.md) - Version history

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
