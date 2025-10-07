# feat: Complete data integrity overhaul with interactive maps and conflict resolution

## 🎯 Overview

Major update to handle data conflicts between MoH bulk uploads and community submissions, add interactive location mapping, implement person detail pages with full version history, and establish comprehensive edge case handling.

---

## 🔄 Core Changes: Bulk Upload Logic (No More Deletions)

### Changed Behavior: Unconfirm Instead of Delete

**Problem**: When a record was missing from a new MoH bulk upload, it was being deleted (`isDeleted = true`). This caused issues when community members submitted records that MoH didn't include.

**Solution**: Records missing from MoH uploads are now marked as "unconfirmed" (`confirmedByMoh = false`) instead of deleted.

**Impact**:
- Community submissions are preserved even if not in MoH data
- Records maintain their history when MoH data changes
- Full transparency via version tracking

**Files Changed**:
- `src/lib/bulk-upload-service-ultra-optimized.ts`
  - Renamed "DELETE" logic to "UNCONFIRM" operations
  - Changed `isDeleted = true` to `confirmedByMoh = false`
  - Updated `ChangeType` from `DELETE` to `UPDATE` for unconfirm operations
  - Only affects records where `confirmedByMoh === true` (community records untouched)
  - Batch size: `UPDATE_BATCH_SIZE` (100) for performance

**Database Migrations**:
- None required (uses existing fields)

**Example Flow**:
```
1. MoH upload includes "12345" → confirmedByMoh: true
2. MoH upload excludes "12345" → confirmedByMoh: false (NOT deleted)
3. MoH upload re-includes "12345" → confirmedByMoh: true (restored)
```

---

## ⚠️ Edge Cases & Conflict Resolution

### Undelete Operations

**New Feature**: Community can submit NEW_RECORD for deleted records to "undelete" them.

**Implementation**:
- `src/app/api/community/submit/route.ts`
  - Checks if `externalId` belongs to deleted record
  - If deleted: Allow NEW_RECORD submission (stores `personId` for moderator)
  - If active: Reject with "Use Suggest Edit" error
  - Blocks EDIT on deleted records (must use NEW_RECORD)

- `src/app/api/moderator/moderation/[id]/approve/route.ts`
  - Detects undelete operations (NEW_RECORD with existing deleted person)
  - Updates existing `Person` record instead of creating new one
  - Sets `isDeleted = false` and `confirmedByMoh = false`
  - Creates `PersonVersion` with `changeType = UPDATE`
  - Change source description: "Community-submitted undelete: [name] ([externalId])"

**Version History Shows**:
```
v1: INSERT (MoH) - confirmedByMoh: true, isDeleted: false
v2: UPDATE (MoH) - confirmedByMoh: false, isDeleted: false (unconfirmed)
v3: UPDATE (Community) - confirmedByMoh: false, isDeleted: false (undeleted with new data)
```

### Fixed `confirmedByMoh` for Bulk Uploads

**Problem**: `confirmedByMoh` field wasn't being set during bulk upload operations.

**Solution**:
- Added `confirmedByMoh: true` to all bulk upload INSERT/UPDATE operations
- Created temporary script `scripts/fix-confirmed-by-moh.ts` to update existing records
- Script uses batching (`BATCH_SIZE: 10000`) to avoid PostgreSQL bind variable limits

**Stats Impact**:
- Dashboard now correctly shows MoH vs Community breakdown
- `/api/moderator/stats` updated to count by `confirmedByMoh` status

---

## 📄 Comprehensive Documentation

### New: DATA_CONFLICTS.md

**Location**: `docs/DATA_CONFLICTS.md`

**Contents**:
- 9 major conflict scenarios with resolutions
- Complete implementation details for each edge case
- API endpoint behavior documentation
- Database schema changes explained
- Testing checklist for QA

**Scenarios Documented**:
1. MoH removes record from upload → marks unconfirmed
2. Community submits NEW_RECORD for active record → rejected
3. **Community submits NEW_RECORD for deleted record → undelete operation** ⭐
4. Community tries to EDIT deleted record → rejected
5. MoH overwrites community record → MoH wins, history preserved
6. MoH record returns after being unconfirmed → re-confirmed
7. Pending submission when MoH uploads → moderator marks SUPERSEDED
8. Multiple pending edits → manual moderator review
9. External ID format collisions → prevented by unique constraint

### Updated: ENGINEERING.md

**Changes**:
- Added link to `DATABASE.md` at top
- Summarized database schema (full details in `DATABASE.md`)
- Updated Page Routes table with correct current routes:
  - `/records` → `/database`
  - `/community` → `/submission`
  - `/tools/settings` → `/tools/admin`
  - Added `/tools` dashboard
  - Made Landing Page (`/`) public

### Updated: README.md

**Changes**:
- Added `DATA_CONFLICTS.md` to Essential Reading
- Updated project structure with renamed routes
- Added database section highlighting conflict resolution

### Updated: CONTRIBUTING.md

**Changes**:
- Fixed broken link to `DATABASE.md`
- Updated documentation references

---

## 🗺️ Interactive Location Maps

### New Component: LocationPicker

**Location**: `src/components/LocationPicker.tsx`

**Features**:
- Open-source mapping via Leaflet + react-leaflet
- Centered on Gaza, Palestine (31.5°N, 34.45°E)
- Default zoom: 11 (Gaza overview)
- Click to place marker, drag to adjust
- Clear button to remove location
- **Read-only mode** for viewing (not editing)
- CDN-hosted marker icons (no asset issues)
- Client-side only (SSR disabled)

**Props**:
```typescript
interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationChange?: (lat: number | null, lng: number | null) => void;
  readOnly?: boolean;
}
```

**UI States**:
- **Edit mode**: "Click on the map to set location of death"
- **Edit mode with location**: Shows coordinates + Clear button
- **Read-only mode**: Shows coordinates + "View on Google Maps" link
- **Read-only zoom**: Level 13 (closer view)

**Technical**:
- Dynamic import via `next/dynamic` to avoid SSR issues
- `useEffect` optimization to prevent infinite render loops
- Proper TypeScript typing (no `any` types)

**Dependencies Added**:
```json
"leaflet": "^1.9.4",
"react-leaflet": "^4.2.1",
"@types/leaflet": "^1.9.8"
```

### Integration: Submission Forms

**Location**: `src/app/submission/page.tsx`

**Changes**:
- Replaced lat/lng text inputs with LocationPicker
- Both "Propose New Record" and "Suggest Edit" forms updated
- User never sees coordinates (handled internally)
- Coordinates automatically saved to form state
- Loading placeholder while map initializes

**Old UI**:
```
Location Coordinates (Optional)
[Latitude input] [Longitude input]
```

**New UI**:
```
Location of Death (Optional)
[Interactive Map - Click to set location]
Location selected: 31.516432, 34.456789  [Clear location]
💡 Tip: Click to place marker, drag to adjust position
```

---

## 📊 Person Detail Pages

### New Route: `/person/[externalId]`

**Location**: `src/app/person/[externalId]/page.tsx`

**Features**:
- Complete person information display
- Photo (clickable for full resolution)
- All biographical data (name, gender, dates, location)
- **Interactive read-only map** showing location of death
- Google Maps link for external navigation
- Obituary (full text, formatted)
- Created/Updated timestamps
- Status badges (Deleted, MoH Confirmed/Community)

**Version History Table**:
- All PersonVersion entries (newest first)
- Version number
- Change type (INSERT/UPDATE with color-coded badges)
- Source (MoH Bulk Upload vs Community Submission)
- MoH Confirmed status
- Deleted status at that version
- Name at that version
- Date of death at that version
- Timestamp of change

**API Endpoint**:
- Enhanced `/api/public/person/[id]` to support `?includeHistory=true`
- Returns complete person data + all versions with source details
- Accepts both UUID and externalId
- Includes `BulkUpload` and `CommunitySubmission` relations

**File**: `src/app/api/public/person/[id]/route.ts`
- Added `includeHistory` query parameter support
- Full version history includes source details (bulk upload info, community submission info)
- Returns complete `Person` object when history requested

### Clickable Database Table

**Location**: `src/components/PersonsTable.tsx`

**Changes**:
- All table rows now clickable
- Each cell wrapped in `<Link href={`/person/${person.externalId}`}>`
- Hover effect: `hover:bg-muted/50`
- Cursor changes to pointer
- Photo cell stops propagation (opens photo, not detail page)

**UI**:
- Clean, intuitive navigation
- Visual feedback on hover
- Consistent with modern web UX

---

## 🧹 Logging Cleanup

### Reduced Console Verbosity

**Problem**: Excessive console.log statements from blob upload debugging.

**Solution**: Removed verbose logging while keeping critical error logs.

**Files Cleaned**:
- `src/app/tools/bulk-uploads/BulkUploadsClient.tsx`
  - Removed 9 debug logs (file info, upload progress, simulation status)
  - Kept: `console.error('[Bulk Upload] Simulation error:', err)`

- `src/app/api/community/submit/route.ts`
  - Removed user/role logging
  - Removed request body logging
  - Removed validation step logging
  - Removed submission created logging
  - Kept: `console.error('[Community Submit] Error:', error)`

**Result**: Clean production logs with only critical errors.

---

## 🐛 Bug Fixes

### Infinite Render Loop

**Problem**: LocationPicker caused infinite re-renders on `/submission` page.

**Root Cause**: `onLocationChange` callback in `useEffect` dependency array. Callback recreated on every parent render → triggered effect → updated parent state → recreated callback → infinite loop.

**Fix**:
```typescript
// Removed onLocationChange from dependency array
useEffect(() => {
  if (!readOnly && onLocationChange) {
    if (position) {
      onLocationChange(position[0], position[1]);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [position, readOnly]); // Only track position and readOnly
```

### Leaflet Icon Not Loading

**Problem**: `iconUrl not set in Icon options` error - marker icons missing.

**Root Cause**: Static asset imports don't work well with Next.js + Leaflet.

**Fix**: Use CDN URLs for marker icons
```typescript
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
```

### Linter Warnings

**Fixed**:
- Removed unused imports: `Link`, `ImageIcon` from person detail page
- Added eslint-disable for `isDeleted` destructuring (needed to exclude from response)
- Commented out unused `DELETE_BATCH_SIZE` constant (changed to unconfirm logic)

---

## 📊 Database Schema Updates

### Prisma Schema Changes

**File**: `prisma/schema.prisma`

**Changes**:
- `SubmissionType` enum: Updated to `('NEW_RECORD', 'EDIT')` (removed `FLAG`)
- `CommunitySubmission.baseVersionId`: Made nullable (`String?`)
- `CommunitySubmission.personId`: Made nullable (`String?`)
- `CommunitySubmission.appliedVersionId`: Made nullable (`String?`)
- `CommunitySubmission.approvedChangeSourceId`: Made nullable (`String?`)

**Migrations Created**:
- `20251007_update_submission_type_enum` - Added `NEW_RECORD` enum value
- `20251007_remove_flag_enum_value` - Safely removed `FLAG` enum value
- `20251007_make_baseversion_nullable` - Made foreign keys nullable for NEW_RECORD submissions

**Why Nullable**: NEW_RECORD submissions don't have `baseVersionId` or `personId` until approved (unless undelete operation).

---

## 🔧 Technical Improvements

### Route Configuration

**Files Updated**:
- `src/app/api/admin/bulk-upload/simulate/route.ts`
- `src/app/api/admin/bulk-upload/apply/route.ts`
- `src/app/api/public/person/[id]/route.ts`

**Added**:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // or 300 for apply
```

**Documented in ENGINEERING.md**:
- Why `runtime = 'nodejs'` (bulk operations, large files)
- Why `dynamic = 'force-dynamic'` (unique requests, no caching)
- Why `maxDuration` varies (complexity of operation)

### Performance Optimizations

**Already Implemented** (documented today):
- PostgreSQL bind variable limit handling (32,767 max)
- Batch sizes for different operations:
  - `MAX_BATCH_SIZE: 10000` (SELECT queries)
  - `INSERT_BATCH_SIZE: 5000` (bulk inserts)
  - `UPDATE_BATCH_SIZE: 100` (transactions)
- Next.js body size limit: 10MB (for large CSV uploads)
- Prisma transaction timeouts: 90 seconds
- Vercel Blob direct uploads (bypass 4.5MB serverless limit)

---

## 🎨 UI/UX Improvements

### Responsive Design

**Maps**: Full width on mobile, consistent sizing on desktop
**Forms**: Clean, card-based layouts
**Person Detail**: Two-column grid on desktop, single column on mobile

### Visual Feedback

**Toast Notifications**: All errors/success messages use Sonner (persistent until dismissed)
**Loading States**: Spinners for maps, tables, and async operations
**Hover Effects**: Table rows, buttons, links
**Color-Coded Badges**: 
- INSERT → Green
- UPDATE → Secondary
- DELETE → Red
- MoH Confirmed → Default
- Community → Secondary

### Accessibility

**Maps**: Keyboard navigation, screen reader compatible
**Links**: Proper `next/link` for internal, `<a target="_blank">` for external
**Images**: Alt text for all photos
**Forms**: Proper labels, required field indicators

---

## 📦 File Summary

### New Files (8)
- `src/components/LocationPicker.tsx` - Interactive map component
- `src/app/person/[externalId]/page.tsx` - Person detail page
- `docs/DATA_CONFLICTS.md` - Conflict resolution documentation
- `src/app/api/admin/bulk-upload/upload-csv/route.ts` - Direct blob upload handler
- `prisma/migrations/20251007_update_submission_type_enum/` - Add NEW_RECORD enum
- `prisma/migrations/20251007_remove_flag_enum_value/` - Remove FLAG enum
- `prisma/migrations/20251007_make_baseversion_nullable/` - Nullable foreign keys

### Modified Files (15)
- `src/lib/bulk-upload-service-ultra-optimized.ts` - Unconfirm logic
- `src/app/submission/page.tsx` - Interactive maps
- `src/app/tools/bulk-uploads/BulkUploadsClient.tsx` - Logging cleanup
- `src/app/api/community/submit/route.ts` - Undelete logic, logging cleanup
- `src/app/api/moderator/moderation/[id]/approve/route.ts` - Undelete approval
- `src/app/api/public/person/[id]/route.ts` - History support
- `src/app/api/moderator/stats/route.ts` - Fixed stats logic
- `src/components/PersonsTable.tsx` - Clickable rows
- `docs/ENGINEERING.md` - Route updates, DB references
- `docs/DATABASE.md` - Referenced in other docs
- `docs/CONTRIBUTING.md` - Fixed links
- `README.md` - Added DATA_CONFLICTS.md
- `prisma/schema.prisma` - Enum and nullable changes
- `next.config.js` - Already had body size limits
- `package.json` - Added leaflet dependencies

### Temporary Files (Deleted)
- `scripts/fix-confirmed-by-moh.ts` - One-time data fix (no longer needed)

---

## ✅ Testing Checklist

- [x] Bulk upload marks records as unconfirmed (not deleted)
- [x] Community submissions preserved during MoH uploads
- [x] Undelete operations work correctly
- [x] Person detail page shows complete history
- [x] Interactive maps work on submission forms
- [x] Read-only maps work on person detail page
- [x] Clickable table rows navigate to detail page
- [x] Dashboard stats show correct MoH vs Community breakdown
- [x] No infinite render loops
- [x] Leaflet markers display correctly
- [x] All linter errors resolved
- [x] Production build successful

---

## 🚀 Deployment Notes

**Database Migrations**: Run migrations before deploying
```bash
npx prisma migrate deploy
```

**Environment Variables**: No new variables required

**Breaking Changes**: None (backwards compatible)

**Rollback Plan**: Revert commit, run `npx prisma migrate reset` (dev only)

---

## 📈 Impact

**Code Quality**: 
- Better separation of concerns
- Comprehensive edge case handling
- Improved error handling
- Reduced logging verbosity

**User Experience**:
- Interactive maps (no manual coordinate entry)
- Complete person history visibility
- Clear conflict resolution
- Persistent toast notifications

**Data Integrity**:
- Community submissions preserved
- Full audit trail via version history
- No data loss from MoH updates
- Transparent undelete operations

**Documentation**:
- Complete edge case documentation
- Clear API behavior specifications
- Testing checklist for QA

---

## 👥 Credits

**Leaflet**: Open-source mapping library (https://leafletjs.com)  
**OpenStreetMap**: Map tile provider (https://www.openstreetmap.org)

---

## 🔗 Related Issues

- Resolves: Records being deleted when missing from MoH uploads
- Resolves: Community unable to revive deleted records
- Resolves: No visual representation of death locations
- Resolves: No way to view complete person history
- Resolves: Dashboard stats inaccurate (MoH vs Community)
- Resolves: Excessive console logging in production

---

**Status**: ✅ All changes tested and production-ready  
**Build**: ✅ Successful (no errors, no warnings)  
**Migrations**: ✅ Applied and tested  
**Documentation**: ✅ Complete and up-to-date
