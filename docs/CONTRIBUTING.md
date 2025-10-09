# Contributing

Thank you for your interest in contributing!

## 🚀 Quick Start

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (see below)
4. **Run database migrations**: `npx prisma generate && npx prisma db push`
5. **Start dev server**: `npm run dev`

---

## 🔐 Environment Variables Setup

### For Contributors (Vercel Project Access)

If you have access to the Vercel project, pull the environment variables automatically:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Link to the Vercel project
vercel link

# Pull environment variables to .env.local
vercel env pull

# Copy to .env for Prisma (required for migrations)
cp .env.local .env
```

### For External Contributors

If you don't have Vercel access, create `.env` manually with:

```env
# Database (PostgreSQL)
DATABASE_URL="your_postgresql_connection_string"

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_key"
CLERK_SECRET_KEY="your_clerk_secret"

# Vercel Blob (File Storage)
BLOB_READ_WRITE_TOKEN="your_blob_token"
```

See `.env.example` if available for a complete template.

---

## 📋 Development Standards

**All development standards are in `.cursorrules`** (read it!)

### Key Rules

1. **ALWAYS use shadcn/ui for UI components** - Never build custom buttons, forms, tables, etc.
2. **Use shadcn color tokens** - `text-foreground` not `text-gray-900`
3. **Follow TypeScript best practices** - Strict type checking enabled
4. **Server components by default** - Only use `'use client'` when necessary
5. **Access control**: Only 2 roles exist (Admin, Moderator). "Community" = any logged-in user.

See `.cursorrules` for complete details.

---

## 🔄 Workflow

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Make changes** following `.cursorrules`
3. **Test locally**: `npm run dev`
4. **Check for errors**: `npm run lint`
5. **Commit changes**: Use clear commit messages
6. **Push and create PR`

---

## 🎨 UI Components

**Before building any UI:**

```bash
# Search for component
npx shadcn@latest search [keyword]

# Install it
npx shadcn@latest add [component-name]

# Use it in your code
import { Button } from '@/components/ui/button';
```

See `.cursorrules` for anti-patterns and examples.

---

## 📚 Documentation

- **Development standards**: `.cursorrules` ⭐ (read this first!)
- **Database schema**: `./DATABASE.md`
- **Technical architecture**: `./ENGINEERING.md`
- **Product overview**: `./PRODUCT.md`
- **API reference**: `./ADMIN_AND_MODERATOR_API.md` + `./PUBLIC_AND_COMMUNITY_API.md`

---

## ✅ Pull Request Checklist

- [ ] Follows standards in `.cursorrules`
- [ ] Uses shadcn components (no custom UI)
- [ ] Tested locally
- [ ] No linter errors
- [ ] Documentation updated if needed

---

**Questions?** Read `.cursorrules` first, then check `./PRODUCT.md`
