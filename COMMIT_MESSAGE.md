docs: comprehensive documentation overhaul and design simplification

## Overview
Major documentation update to align all docs with current codebase implementation.
Removed obsolete references, updated schemas, and simplified design patterns.
Also includes UI theme consistency fixes and About page improvements.

## Documentation Changes

### Updated Files
- **README.md**: Removed confirmedByMoh, NEW_RECORD references; added trust simulation and client-side validation documentation
- **docs/PRODUCT.md**: Simplified to EDIT-only workflow, removed obituary field, updated data source explanation
- **docs/DATABASE.md**: Updated schema definitions to match actual implementation (no confirmedByMoh, no obituary, added currentVersion, updated BulkUpload fields)
- **docs/ENGINEERING.md**: Added trust simulation optimization docs, client-side validation, updated file structure, performance metrics

### Deleted Files
- **docs/DATA_CONFLICTS.md**: Removed as design simplification eliminated most conflict scenarios (no NEW_RECORD submissions = simpler conflict model)

### Key Documentation Updates
- All person records originate from Ministry of Health only
- Community can only EDIT existing records (no NEW_RECORD)
- Identity fields (name, gender, DOB) are read-only for community
- Trust simulation optimization documented (50-70% faster apply)
- Client-side CSV validation documented
- Schema changes: label → comment, added blob metadata, removed confirmedByMoh

## UI/Theme Improvements

### Theme Token Migration
Replaced raw Tailwind colors with Shadcn theme tokens across components:
- `src/components/PublicNavbar.tsx`: text-white → text-foreground/text-muted-foreground
- `src/components/PersonsTable.tsx`: text-white → text-foreground/text-muted-foreground
- `src/app/page.tsx`: text-gray-* → text-foreground/text-muted-foreground
- `src/app/tools/page.tsx`: Removed hardcoded colors, use default variants
- `src/app/tools/moderation/layout.tsx`: text-white → text-secondary-foreground
- `src/app/contribution/edit/[externalId]/page.tsx`: text-white → text-destructive-foreground
- `src/app/person/[externalId]/page.tsx`: Removed hardcoded badge colors
- `src/app/tools/bulk-uploads/BulkUploadsClient.tsx`: text-white → text-destructive-foreground

### Navbar Enhancement
- Added `bg-background/95 backdrop-blur` to PublicNavbar
- Prevents text overlap when scrolling
- Modern glassmorphism effect

## About Page

### New FAQ Entry
Added "What are your data sources?" FAQ with detailed explanation of Ministry of Health as primary source.

### GitHub Link
Made GitHub repository link clickable with proper styling:
- Links to: github.com/Gaza-Deaths/gazadeaths/tree/main/data_sources
- Opens in new tab with security attributes
- Uses theme colors for consistency

## Technical Details

### Files Changed
```
Documentation:
  modified: README.md
  modified: docs/PRODUCT.md
  modified: docs/DATABASE.md
  modified: docs/ENGINEERING.md
  deleted:  docs/DATA_CONFLICTS.md

UI/Theme:
  modified: src/components/PublicNavbar.tsx
  modified: src/components/PersonsTable.tsx
  modified: src/app/page.tsx
  modified: src/app/tools/page.tsx
  modified: src/app/tools/moderation/layout.tsx
  modified: src/app/contribution/edit/[externalId]/page.tsx
  modified: src/app/person/[externalId]/page.tsx
  modified: src/app/tools/bulk-uploads/BulkUploadsClient.tsx
  modified: src/app/about/page.tsx
```

## Impact

### Documentation Quality
- All docs now accurately reflect implementation
- Removed ~500 lines of obsolete documentation
- Clearer explanation of data model and workflows
- Eliminated confusion about NEW_RECORD (no longer exists)

### Code Consistency
- Theme tokens used consistently across all components
- Better dark mode support
- Follows Shadcn UI best practices
- No raw Tailwind colors in text/backgrounds

### User Experience
- Clear data source transparency on About page
- Clickable GitHub link for verification
- Improved navbar visibility and aesthetics
- Consistent visual language throughout app

## Testing
- [x] All documentation reviewed against codebase
- [x] No linter errors
- [x] UI theme verified in browser
- [x] Links tested and working
- [x] Navbar background tested on scroll

## Philosophy
Following project rules: "Move fast, no cruft, zero backwards compatibility"
- Deleted obsolete docs cleanly (no "deprecated" markers)
- Updated all references in one go
- No transition periods or legacy support
