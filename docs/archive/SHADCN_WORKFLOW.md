# shadcn/ui Development Workflow

## 🎯 Daily Workflow: Always Check shadcn First

### Quick Start Checklist

Every time you need to build UI, follow these steps:

```
1. Define what you need (e.g., "I need a data table with sorting")
   ↓
2. Search shadcn registry
   ↓
3. Install component
   ↓
4. Copy example code
   ↓
5. Customize for your needs
   ↓
6. Done! ✅
```

---

## 🔍 Step-by-Step: Finding Components

### Method 1: Search by Keyword

```bash
# In your terminal
npx shadcn@latest search table
npx shadcn@latest search form
npx shadcn@latest search button
```

### Method 2: Browse Online Registry

Visit: https://ui.shadcn.com/docs/components

### Method 3: Check Examples

```bash
# View component examples
npx shadcn@latest view @shadcn/button-demo
npx shadcn@latest view @shadcn/card-demo
```

### Method 4: Check Blocks (Pre-built Page Sections)

```bash
# View available blocks
npx shadcn@latest blocks

# Examples:
npx shadcn@latest add sidebar-01
npx shadcn@latest add login-01
npx shadcn@latest add dashboard-01
```

---

## 📝 Common Development Scenarios

### Scenario 1: "I need to show a list of items"

#### Think: What UI pattern do I need?
- Simple list? → Use `item` component
- Data table? → Use `table` component  
- Cards? → Use `card` component

#### Search:
```bash
npx shadcn@latest search table
npx shadcn@latest search card
npx shadcn@latest search item
```

#### Install:
```bash
npx shadcn@latest add table
```

#### Use:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Scenario 2: "I need a form with validation"

#### Think: 
- Multiple inputs? → Use `form` + `field` components
- Single input? → Use `input` + `label`

#### Search:
```bash
npx shadcn@latest search form
npx shadcn@latest view @shadcn/form-demo
```

#### Install:
```bash
npx shadcn@latest add form field input label button
```

#### Use:
```tsx
import { Form, Field } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

<Form onSubmit={handleSubmit}>
  <Field label="Name" description="Enter your full name">
    <Input name="name" required />
  </Field>
  
  <Field label="Email">
    <Input type="email" name="email" required />
  </Field>
  
  <Button type="submit">Submit</Button>
</Form>
```

---

### Scenario 3: "I need a confirmation dialog"

#### Think:
- Important action? → Use `alert-dialog`
- General modal? → Use `dialog`

#### Search:
```bash
npx shadcn@latest search dialog
npx shadcn@latest view @shadcn/alert-dialog-demo
```

#### Install:
```bash
npx shadcn@latest add alert-dialog
```

#### Use:
```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Scenario 4: "I need to show status/tags"

#### Think:
- Status indicator? → Use `badge`
- Multiple selection? → Use `badge` with remove button

#### Search:
```bash
npx shadcn@latest search badge
npx shadcn@latest view @shadcn/badge-demo
```

#### Install:
```bash
npx shadcn@latest add badge
```

#### Use:
```tsx
import { Badge } from '@/components/ui/badge';

<Badge>New</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
<Badge variant="outline">Draft</Badge>
```

---

### Scenario 5: "I need tabs for navigation"

#### Search:
```bash
npx shadcn@latest search tabs
npx shadcn@latest view @shadcn/tabs-demo
```

#### Install:
```bash
npx shadcn@latest add tabs
```

#### Use:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account settings content
  </TabsContent>
  <TabsContent value="password">
    Password settings content
  </TabsContent>
</Tabs>
```

---

### Scenario 6: "I need a loading state"

#### Think:
- Loading entire section? → Use `skeleton`
- Loading button? → Use `spinner` in `button`
- Loading inline? → Use `spinner`

#### Search:
```bash
npx shadcn@latest search skeleton
npx shadcn@latest search spinner
```

#### Install:
```bash
npx shadcn@latest add skeleton spinner
```

#### Use:
```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

// Skeleton for content
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
</div>

// Spinner in button
<Button disabled>
  <Spinner className="mr-2" />
  Loading...
</Button>
```

---

### Scenario 7: "I need toast notifications"

#### Search:
```bash
npx shadcn@latest search toast
npx shadcn@latest search sonner
```

#### Install:
```bash
npx shadcn@latest add sonner
```

#### Use:
```tsx
import { toast } from 'sonner';

// Success
toast.success('Successfully saved!');

// Error
toast.error('Something went wrong');

// Loading
toast.loading('Uploading...');

// Promise
toast.promise(uploadFile(), {
  loading: 'Uploading...',
  success: 'File uploaded!',
  error: 'Upload failed'
});
```

---

## 🎨 Customization Guide

### When to Customize

shadcn components are **designed to be customized**. You can:

1. ✅ Add custom variants
2. ✅ Modify colors/styles
3. ✅ Extend with additional props
4. ✅ Wrap in your own components

### How to Customize

```tsx
// src/components/ui/button.tsx
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Button({ className, ...props }) {
  return (
    <ShadcnButton 
      className={cn("my-custom-styles", className)} 
      {...props} 
    />
  );
}
```

---

## 🚫 When NOT to Use shadcn

Rare cases where custom components make sense:

1. **Highly specialized business logic** - Complex domain-specific UI
2. **Third-party integration** - Using a specific library's components
3. **Performance critical** - Need ultra-optimized rendering
4. **Brand-specific complex animations** - Very custom motion design

**In 95% of cases, shadcn has what you need!**

---

## 🔄 Integration with Existing Code

### Gradual Migration Strategy

```tsx
// OLD CODE (keep for now)
<div className="custom-card">
  <h3 className="custom-title">Title</h3>
  <p className="custom-text">Text</p>
</div>

// NEW CODE (side by side)
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Text</p>
  </CardContent>
</Card>

// Once tested, remove old code ✅
```

---

## 📚 Quick Reference

### Most Used Components

```bash
# Install all commonly used components at once
npx shadcn@latest add \
  button \
  card \
  input \
  label \
  form \
  field \
  table \
  badge \
  alert \
  dialog \
  select \
  checkbox \
  radio-group \
  tabs \
  separator \
  skeleton \
  spinner \
  toast
```

### Component Variants Quick Reference

**Button:**
- `variant`: default | destructive | outline | secondary | ghost | link
- `size`: default | sm | lg | icon

**Badge:**
- `variant`: default | secondary | destructive | outline

**Alert:**
- `variant`: default | destructive

**Card:**
- Always use: CardHeader + CardTitle + CardContent + CardFooter

---

## ✅ Daily Checklist

Before writing ANY UI code:

```
[ ] Searched shadcn registry
[ ] Checked shadcn examples  
[ ] Installed required components
[ ] Read component API docs
[ ] Copied example code
[ ] Customized for my use case
[ ] Tested in browser
[ ] Committed code
```

---

## 🎯 Team Standards

### Code Review Checklist

When reviewing PRs:

- [ ] Are shadcn components used where possible?
- [ ] Are custom styles justified with a comment?
- [ ] Are component variants used correctly?
- [ ] Is the component accessible?
- [ ] Does it match the design system?

### Naming Conventions

```tsx
// ✅ Good: Import from ui folder
import { Button } from '@/components/ui/button';

// ✅ Good: Use semantic naming
<Button variant="destructive">Delete</Button>

// ❌ Bad: Custom styling when shadcn exists
<div className="custom-button-styles">Click me</div>
```

---

## 📞 Getting Help

1. **shadcn documentation**: https://ui.shadcn.com/docs
2. **Search examples**: `npx shadcn@latest view @shadcn/[component]-demo`
3. **GitHub discussions**: https://github.com/shadcn-ui/ui/discussions
4. **Team chat**: Ask in #frontend channel

---

## 🚀 Getting Started Today

Run this now:

```bash
# Install most common components
npx shadcn@latest add button card input label form field table badge alert dialog tabs skeleton spinner toast

# Start refactoring your first component
# Pick the easiest: replace all <button> elements with <Button>
```

**Remember: If you're about to write custom UI, pause and check shadcn first!**

