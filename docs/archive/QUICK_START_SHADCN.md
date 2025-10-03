# 🚀 Quick Start: Switch to shadcn

## Install Core Components RIGHT NOW

```bash
# Run this command in your terminal:
npx shadcn@latest add button card input label form field table badge alert dialog tabs skeleton spinner toast separator
```

This will install the most commonly used components.

---

## 🎯 Your First Refactor: Replace All Buttons

### Step 1: Find all custom buttons

Search your codebase for:
- `className=".*px-.*py-.*rounded.*button.*"`
- `<button className=`
- Custom button styles

### Step 2: Replace with shadcn Button

**Before:**
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Submit
</button>
```

**After:**
```tsx
import { Button } from '@/components/ui/button';

<Button>Submit</Button>
```

**With variants:**
```tsx
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Skip</Button>
<Button size="sm">Small</Button>
```

---

## 🏃 Today's Action Plan

### Hour 1: Setup (30 min)

1. ✅ Install components (5 min)
   ```bash
   npx shadcn@latest add button card table badge alert input label form field
   ```

2. ✅ Read this guide (10 min)
   - `SHADCN_WORKFLOW.md` - How to use shadcn daily
   - `SHADCN_MIGRATION_STRATEGY.md` - Full migration plan

3. ✅ Configure VSCode snippets (already done!)
   - Type `sbutton` + Tab = Button component
   - Type `scard` + Tab = Card component
   - Type `stable` + Tab = Table component

### Hour 2: First Component (30 min)

Pick ONE simple component to refactor:

**Easiest:** `PersonsTable.tsx` loading state
```tsx
// BEFORE:
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

// AFTER:
import { Spinner } from '@/components/ui/spinner';
<Spinner />
```

**Easy:** Replace all alert/error boxes
```tsx
// BEFORE:
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
  {error}
</div>

// AFTER:
import { Alert, AlertDescription } from '@/components/ui/alert';
<Alert variant="destructive">
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

---

## 📋 Weekly Migration Plan

### Week 1: Low-Hanging Fruit
- [ ] Replace all `<button>` with `<Button>`
- [ ] Replace all loading spinners with `<Spinner>`
- [ ] Replace all alerts with `<Alert>`
- [ ] Replace all badges with `<Badge>`

### Week 2: Medium Effort
- [ ] Refactor `PersonsTable.tsx` to use `<Table>`
- [ ] Refactor all cards to use `<Card>`
- [ ] Add `<Dialog>` for confirmations

### Week 3: Complex Components
- [ ] Refactor form in `/community/submit/page.tsx`
- [ ] Refactor `/bulk-uploads/page.tsx`
- [ ] Refactor `/moderation/pending/page.tsx`

### Week 4: Polish
- [ ] Add toast notifications with `sonner`
- [ ] Add skeleton loading states
- [ ] Audit for remaining custom components

---

## 🎨 Component Mapping Cheat Sheet

| Current | Replace With | Command |
|---------|-------------|---------|
| Custom `<button>` | `<Button>` | `npx shadcn@latest add button` |
| Custom table | `<Table>` | `npx shadcn@latest add table` |
| Custom card div | `<Card>` | `npx shadcn@latest add card` |
| Custom badge span | `<Badge>` | `npx shadcn@latest add badge` |
| Custom alert div | `<Alert>` | `npx shadcn@latest add alert` |
| Loading spinner | `<Spinner>` | `npx shadcn@latest add spinner` |
| Custom modal | `<Dialog>` | `npx shadcn@latest add dialog` |
| Custom tabs | `<Tabs>` | `npx shadcn@latest add tabs` |
| Custom input | `<Input>` | `npx shadcn@latest add input` |
| Custom form | `<Form>` + `<Field>` | `npx shadcn@latest add form field` |

---

## 💡 Pro Tips

### Tip 1: Use the Examples

When unsure how to use a component:
```bash
npx shadcn@latest view @shadcn/button-demo
npx shadcn@latest view @shadcn/table-demo
npx shadcn@latest view @shadcn/form-demo
```

### Tip 2: Install Multiple at Once

```bash
npx shadcn@latest add button card table form input label
```

### Tip 3: Use VSCode Snippets

- Type `sbutton` + Tab → Button component
- Type `scard` + Tab → Card component  
- Type `stable` + Tab → Table component

### Tip 4: Check Before Building

Before writing ANY new UI:
1. Search: `npx shadcn@latest search [keyword]`
2. If exists → Install it
3. If not → Check if you can combine existing components

---

## 🚫 Common Mistakes to Avoid

### Mistake 1: Not Reading the Docs

❌ Don't guess how components work
✅ Always check examples first

### Mistake 2: Mixing Custom Styles

❌ Don't mix custom classes with shadcn components
✅ Use component variants instead

### Mistake 3: Rebuilding Existing Components

❌ Don't rebuild what exists
✅ Search shadcn registry first

---

## 📞 Need Help?

1. **Check workflow doc**: `SHADCN_WORKFLOW.md`
2. **Check migration plan**: `SHADCN_MIGRATION_STRATEGY.md`
3. **View examples**: `npx shadcn@latest view @shadcn/[component]-demo`
4. **Official docs**: https://ui.shadcn.com/docs

---

## ✅ Success Criteria

You'll know you're doing it right when:

- ✅ No new custom-styled buttons
- ✅ All forms use shadcn components
- ✅ All tables use `<Table>`
- ✅ All cards use `<Card>`
- ✅ New features check shadcn first

---

## 🎯 Start NOW!

Run this command right now:

```bash
npx shadcn@latest add button card input label form field table badge alert dialog tabs skeleton spinner toast
```

Then pick ONE component from your codebase and refactor it. Start small, build momentum!

**Remember: The goal is to NEVER write custom UI again if shadcn has it!**

