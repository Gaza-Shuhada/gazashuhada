# shadcn/ui Migration Strategy

## 🎯 Goals
1. Replace all custom-styled components with shadcn components
2. Establish a "shadcn-first" workflow for all future development
3. Improve consistency, accessibility, and maintainability

---

## 📊 Current State Analysis

### Components Currently Using Custom Styles

| Component | Current Implementation | shadcn Replacement | Priority |
|-----------|----------------------|-------------------|----------|
| **Tables** | Custom table with Tailwind | `table` component | 🔴 High |
| **Cards** | `bg-white rounded-lg shadow` | `card` component | 🔴 High |
| **Buttons** | Custom Tailwind classes | `button` component | 🔴 High |
| **Badges** | Custom `px-2 py-1 rounded-full` | `badge` component | 🟡 Medium |
| **Alerts** | Custom `bg-red-50 border` | `alert` component | 🟡 Medium |
| **Loading Spinners** | Custom animate-spin div | `spinner` component | 🟡 Medium |
| **Pagination** | Custom button group | `pagination` component | 🟡 Medium |
| **Forms** | Custom styled inputs | `form` + `input` + `label` + `field` | 🔴 High |
| **Dialogs/Modals** | Not yet implemented | `dialog` component | 🟢 Low |
| **Tabs** | Custom tab switching | `tabs` component | 🟡 Medium |
| **Navigation** | Custom navbar | Keep as-is (good UX) | 🟢 Low |

---

## 🚀 Migration Plan

### Phase 1: Install Core Components (Week 1)

```bash
# Install all essential components at once
npx shadcn@latest add button card badge alert table input label textarea select checkbox radio-group switch dialog tabs separator skeleton toast form field
```

### Phase 2: Create Component Library (Week 1)

Create wrapper components for consistency:

**File: `src/components/ui/index.ts`**
```typescript
// Re-export all shadcn components from a single place
export { Button } from './button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
export { Badge } from './badge';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
// ... etc
```

### Phase 3: Migrate by Component Type (Weeks 2-3)

#### 3.1 High Priority: Tables (PersonsTable.tsx)

**Before:**
```tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
```

**After:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>External ID</TableHead>
```

#### 3.2 High Priority: Cards

**Before:**
```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold mb-4">Database Records</h3>
```

**After:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Database Records</CardTitle>
  </CardHeader>
  <CardContent>
```

#### 3.3 High Priority: Buttons

**Before:**
```tsx
<button className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50">
  Previous
</button>
```

**After:**
```tsx
<Button variant="outline" size="sm">
  Previous
</Button>
```

#### 3.4 Medium Priority: Badges

**Before:**
```tsx
<span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
  {person.gender}
</span>
```

**After:**
```tsx
<Badge variant="secondary">{person.gender}</Badge>
```

#### 3.5 Medium Priority: Loading States

**Before:**
```tsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
```

**After:**
```tsx
<Spinner />
// or use skeleton for content placeholders
<Skeleton className="h-8 w-8" />
```

#### 3.6 Medium Priority: Alerts/Errors

**Before:**
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
  {error}
</div>
```

**After:**
```tsx
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

### Phase 4: Refactor Complex Components (Week 4)

Focus on pages with the most custom styling:
1. `/bulk-uploads/page.tsx` - Complex forms and tables
2. `/community/submit/page.tsx` - Large forms with tabs
3. `/moderation/pending/page.tsx` - Cards and decision UI

---

## 🔄 Workflow: Always Use shadcn First

### The Golden Rule
**Before writing ANY new component or UI element, check shadcn registry first.**

### New Feature Workflow

```
1. 🎨 Design/Plan Feature
   ↓
2. 🔍 Check shadcn Registry
   ↓
3. ✅ Component Exists?
   ├─ YES → Install & Use It
   │         npx shadcn@latest add [component-name]
   │         
   └─ NO → Check if combinable?
             ├─ YES → Combine multiple shadcn components
             └─ NO → Build custom (rare case)
```

### Pre-Development Checklist

Before starting ANY UI work:

```bash
# 1. Search shadcn registry
npx shadcn@latest search [feature-name]

# Examples:
npx shadcn@latest search table
npx shadcn@latest search form
npx shadcn@latest search modal
```

```markdown
[ ] Searched shadcn registry for component
[ ] Checked shadcn examples for similar patterns
[ ] Reviewed shadcn blocks for complete page sections
[ ] Installed required component(s)
[ ] Read component documentation
[ ] Used component API correctly
```

### Quick Reference Commands

```bash
# Search for components
npx shadcn@latest search [keyword]

# View component details
npx shadcn@latest view @shadcn/[component-name]

# Add single component
npx shadcn@latest add [component-name]

# Add multiple components
npx shadcn@latest add button card dialog form

# View component examples
npx shadcn@latest view @shadcn/button-demo
```

---

## 📚 Common Patterns & Solutions

### Pattern 1: Data Tables

**✅ Use: `table` component**

```bash
npx shadcn@latest add table
```

### Pattern 2: Forms

**✅ Use: `form` + `field` + inputs**

```bash
npx shadcn@latest add form field input textarea select checkbox radio-group
```

### Pattern 3: Confirmation Dialogs

**✅ Use: `alert-dialog`**

```bash
npx shadcn@latest add alert-dialog
```

### Pattern 4: Page Sections

**✅ Use: `card`**

```bash
npx shadcn@latest add card
```

### Pattern 5: Status Indicators

**✅ Use: `badge`**

```bash
npx shadcn@latest add badge
```

### Pattern 6: Interactive Lists

**✅ Use: `item` component**

```bash
npx shadcn@latest add item
```

### Pattern 7: Loading States

**✅ Use: `skeleton` or `spinner`**

```bash
npx shadcn@latest add skeleton spinner
```

### Pattern 8: Notifications

**✅ Use: `sonner` (toast notifications)**

```bash
npx shadcn@latest add sonner
```

---

## 🎨 Theme Customization

Your app uses a custom color scheme. Update `components.json`:

```json
{
  "theme": {
    "primary": "blue",
    "secondary": "gray",
    "destructive": "red"
  }
}
```

Then regenerate theme:
```bash
npx shadcn@latest theme
```

---

## 📖 Resources

### Official Documentation
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Examples](https://ui.shadcn.com/examples)
- [shadcn/ui Blocks](https://ui.shadcn.com/blocks)

### Internal Resources
- Component examples: `/examples` (create this folder)
- Storybook (optional): Set up for component preview

---

## ✅ Success Metrics

Track migration progress:

- [ ] **Week 1**: Core components installed ✅
- [ ] **Week 2**: 3 high-priority components migrated
- [ ] **Week 3**: All tables and forms using shadcn
- [ ] **Week 4**: All pages refactored
- [ ] **Ongoing**: No new custom-styled components added

---

## 🚫 Anti-Patterns to Avoid

### ❌ DON'T DO THIS:
```tsx
// Custom button when shadcn button exists
<div className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer">
  Click me
</div>
```

### ✅ DO THIS INSTEAD:
```tsx
<Button>Click me</Button>
```

### ❌ DON'T DO THIS:
```tsx
// Mixing custom styles with shadcn
<Button className="custom-weird-styles">
  Inconsistent button
</Button>
```

### ✅ DO THIS INSTEAD:
```tsx
// Use shadcn variants
<Button variant="outline" size="lg">
  Consistent button
</Button>
```

---

## 🔧 Development Environment Setup

### VSCode Extensions (Recommended)

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### Snippets for shadcn Components

Create `.vscode/shadcn.code-snippets`:

```json
{
  "shadcn Button": {
    "prefix": "sbutton",
    "body": [
      "<Button variant=\"${1|default,destructive,outline,secondary,ghost,link|}\" size=\"${2|default,sm,lg,icon|}\">",
      "  ${3:Button text}",
      "</Button>"
    ]
  },
  "shadcn Card": {
    "prefix": "scard",
    "body": [
      "<Card>",
      "  <CardHeader>",
      "    <CardTitle>${1:Title}</CardTitle>",
      "    <CardDescription>${2:Description}</CardDescription>",
      "  </CardHeader>",
      "  <CardContent>",
      "    ${3:Content}",
      "  </CardContent>",
      "</Card>"
    ]
  }
}
```

---

## 📝 Migration Tracking

Use this checklist to track component migrations:

### Components
- [ ] PersonsTable.tsx
- [ ] StatsCards.tsx  
- [ ] Navbar.tsx (partial - keep custom logic)
- [ ] page.tsx (landing)
- [ ] dashboard/page.tsx
- [ ] bulk-uploads/page.tsx
- [ ] community/submit/page.tsx
- [ ] moderation/pending/page.tsx
- [ ] audit-logs/page.tsx
- [ ] records/page.tsx

### Pages to Refactor
- [ ] Home/Landing page
- [ ] Dashboard
- [ ] Bulk Uploads
- [ ] Community Submissions  
- [ ] Moderation Queue
- [ ] Audit Logs
- [ ] Records Browser

---

## 🎯 Next Actions

1. **Install core components**
   ```bash
   npx shadcn@latest add button card badge alert table input label textarea select form field spinner skeleton toast
   ```

2. **Start with easiest wins** - Replace all buttons first (find/replace pattern)

3. **Refactor PersonsTable.tsx** - Most repetitive custom styling

4. **Document patterns** - Create example components in `/examples`

5. **Train team** - Share this document with all developers

