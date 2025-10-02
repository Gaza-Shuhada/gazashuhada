# Gaza Deaths API

A comprehensive system for managing versioned records of people with role-based access control, bulk upload functionality, and community moderation features.

## 🚀 Features

### ✅ Implemented
- **Bulk Upload System** (Admin only) - CSV upload with validation, simulation, and apply workflow
- **Role-Based Access Control** - Admin, moderator, and community member roles via Clerk
- **Database Versioning** - Full audit trail with PersonVersion and ChangeSource tracking
- **Dashboard & Statistics** - Overview of records with pagination and search
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

## 🔐 Role System

- **Admin**: Full access to bulk uploads, user management, and all features
- **Moderator**: Access to moderation queue and community submissions
- **Community Member**: Basic access to view data and submit corrections

## 📚 Documentation

See the `/docs` directory for detailed specifications:
- `product_spec.md` - Product requirements and features
- `engineering_spec.md` - Database schema and technical details
- `tasks_breakdown.md` - Development phases and completion status

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Role Based Access Control (RBAC)

https://clerk.com/docs/guides/secure/basic-rbac