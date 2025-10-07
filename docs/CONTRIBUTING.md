# Contributing

Thank you for your interest in contributing!

## 🚀 Quick Start

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy `.env.example` to `.env` and add your keys
4. **Run database migrations**: `npx prisma generate && npx prisma db push`
5. **Start dev server**: `npm run dev`

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
