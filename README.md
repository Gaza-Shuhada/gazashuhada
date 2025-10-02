# Gaza Deaths Control Panel

**Staff-Only Internal Administration Tool** for managing versioned person records with comprehensive audit trails.

> ⚠️ **IMPORTANT**: This is the **control panel only**. A separate public-facing web application will be built for end-users, which will provide advanced search, filtering, sorting, analytics, and public data consumption features. This control panel is focused exclusively on data management, moderation, and internal operations.

## 🚀 Features

### ✅ Implemented
- **Bulk Upload System** (Admin only) - CSV upload with validation, simulation, apply, and rollback
- **Bulk Upload Metadata** - Mandatory label and date released fields for organization and provenance tracking
- **Bulk Upload Rollback** - LIFO-safe rollback with conflict detection and smart UI indicators
- **Records Browser** (Staff only) - Browse all records with version numbers and deletion status
- **Audit Log System** - Comprehensive activity tracking for all admin actions
- **Dashboard** (Staff only) - Statistics overview with role-based access
- **Role-Based Access Control** - Admin, moderator, and community roles via Clerk
- **Database Versioning** - Full audit trail with PersonVersion and ChangeSource tracking
- **Multi-layer Security** - Middleware, layout, and API route protection
- **Modern UI** - Next.js 15 with TypeScript and Tailwind CSS

### 🚧 Planned
- **Community Submissions** - FLAG/EDIT functionality for death-related fields only
- **Moderation Queue** - Approve/reject community submissions with notes
- **Advanced Analytics** - Detailed statistics and reporting

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk with role-based access control
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 📋 Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
# Add your database URL and Clerk keys
```

3. **Run database migrations**:
```bash
npx prisma migrate dev
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🔐 Access Control

### Role System

| Role | Access Level | Features |
|------|--------------|----------|
| **Admin** | Full Access | Dashboard, Bulk Uploads, Records, Audit Logs, Moderation |
| **Moderator** | Staff Access | Dashboard, Records, Audit Logs, Moderation |
| **Community** | No Access | Blocked with clear access denied message |

**Note**: This is a staff-only application. Community members cannot access any features.

### Page Routes

- `/dashboard` - Staff dashboard with statistics (staff only)
- `/bulk-uploads` - Upload, simulate, apply, and rollback CSV files (admin only)
- `/records` - Browse database with version info and deletion status (staff only)
- `/audit-logs` - View recent admin actions (staff only)
- `/moderation/pending` - Review community submissions (staff only, planned)

### Protection Layers

1. **Client-Side Layout Guards** - Blocks UI rendering for unauthorized users
2. **Server-Side Page Checks** - Redirects or shows access denied pages
3. **API Endpoint Guards** - Returns 403 for unauthorized API requests
4. **Navbar Visibility** - Only shows links user can access

## 📚 Documentation

### Core Documentation
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and breaking changes with today's updates
- **[docs/](./docs/)** - Detailed specifications:
  - `SYSTEM_ARCHITECTURE.md` - ⭐ **Critical overview of two-app architecture**
  - `product_spec.md` - Product requirements, features, and access control matrix
  - `engineering_spec.md` - Database schema, API routes, and technical architecture
  - `bulk_upload_guide.md` - Complete bulk upload workflow and rollback guide
  - `csv_test_examples.md` - CSV validation test cases and examples
  - `tasks_breakdown.md` - Development phases and completion status

### Key Features Documentation

**Bulk Upload System**:
- Mandatory metadata fields:
  - **Label**: Descriptive text for organization (max 200 characters)
  - **Date Released**: When source data was published/released (tracks provenance)
- CSV validation with comprehensive error messages
- Simulation preview showing ALL deletions, ALL updates, sample inserts
- LIFO-safe rollback with conflict detection
- Smart UI indicators showing rollback eligibility
- Full audit trail maintained

**Records Browser**:
- Pagination (10 records per page)
- Version number column (v1, v2, v3...)
- Deletion status column (color-coded badges)
- Shows ALL records including deleted ones
- Search and filter capabilities

**Audit Log System**:
- Last 50 admin actions
- User, timestamp, action type, resource details
- IP address tracking
- Expandable JSON metadata
- Color-coded action and resource badges

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🔧 Development

### Database Schema Updates

The application uses Prisma with PostgreSQL. Recent schema changes:
- Added `BulkUpload.label` field (nullable String)
- Moved `changeType` from `ChangeSource` to `PersonVersion`
- Added `AuditLog` table for comprehensive activity tracking
- Multiple performance indexes on `PersonVersion`

Run migrations:
```bash
npx prisma migrate dev
# or for production:
npx prisma migrate deploy
```

### Testing

To test bulk upload functionality:
1. Navigate to `/bulk-uploads` (admin account required)
2. Upload test CSV from `docs/seed.csv`
3. Provide a descriptive label (e.g., "Test Upload")
4. Review simulation showing all changes
5. Apply or cancel as needed
6. Test rollback on past uploads

## 📖 Additional Resources

- [Clerk RBAC Documentation](https://clerk.com/docs/guides/secure/basic-rbac)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)