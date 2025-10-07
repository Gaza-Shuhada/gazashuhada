# Data Conflicts and Edge Cases

**Last Updated**: 2025-10-07  
**Status**: ✅ All edge cases documented and handled

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Conflict Scenarios](#conflict-scenarios)
4. [Implementation Details](#implementation-details)
5. [Testing Checklist](#testing-checklist)

---

## Overview

This document outlines how the Gaza Death Toll database handles data conflicts between:
- **MoH Bulk Uploads** (authoritative source, `confirmedByMoh = true`)
- **Community Submissions** (crowd-sourced, `confirmedByMoh = false`)
- **Deleted Records** (soft-deleted via `isDeleted = true`)

The system uses **event sourcing** and **version history** to track all changes, ensuring full transparency and auditability.

---

## Core Principles

### 1. **MoH is Authoritative**
- When MoH data is available, it takes precedence
- MoH uploads set `confirmedByMoh = true`
- Community submissions set `confirmedByMoh = false`

### 2. **Soft Deletes, Not Hard Deletes**
- Records are never permanently deleted from the database
- `isDeleted = true` marks a record as inactive
- Version history preserves all past states

### 3. **External IDs Are Unique**
- Each `externalId` must be unique across active records
- Deleted records retain their `externalId` (prevents ID reuse confusion)
- Exception: Community can submit NEW_RECORD to undelete a deleted record

### 4. **Full Version History**
- Every change creates a new `PersonVersion` entry
- Moderators can view complete history to make informed decisions
- Audit logs track who made changes and when

---

## Conflict Scenarios

### **Scenario A: MoH Removes Record from Upload**

**Situation:**
1. MoH upload 1 includes `external_id: "12345"` → `confirmedByMoh = true`, `isDeleted = false`
2. MoH upload 2 does **not** include "12345"

**System Behavior:**
```
✅ Record is NOT deleted
✅ Record is marked as no longer MoH-confirmed: confirmedByMoh = false
✅ PersonVersion created with changeType: UPDATE
✅ Record remains visible and searchable
```

**Why:** The record may have been removed from MoH's list but could still be valid (community-sourced, awaiting verification, etc.)

**Version History Example:**
```
Version 1: INSERT (MoH bulk upload) - confirmedByMoh: true
Version 2: UPDATE (MoH bulk upload) - confirmedByMoh: false
```

---

### **Scenario B: Community Submits NEW_RECORD for Existing Active Record**

**Situation:**
1. Active record exists with `external_id: "12345"`, `isDeleted = false`
2. Community user tries to submit NEW_RECORD with same `external_id`

**System Behavior:**
```
❌ Submission REJECTED
📧 Error: "A person with External ID '12345' already exists. Use 'Suggest Edit' instead."
```

**Why:** Prevents duplicate records. User should edit existing record, not create a new one.

---

### **Scenario C: Community Submits NEW_RECORD for Deleted Record** ⭐ **UNDELETE OPERATION**

**Situation:**
1. Deleted record exists with `external_id: "12345"`, `isDeleted = true`
2. Community user submits NEW_RECORD with same `external_id` but different data

**System Behavior:**
```
✅ Submission ACCEPTED
✅ Submission stored with personId = <deleted_record_id>
✅ When approved by moderator:
    - Person record is UPDATED (not created)
    - isDeleted = false (undeletes the record)
    - confirmedByMoh = false (community submission)
    - New fields replace old fields
    - PersonVersion created with changeType: UPDATE
```

**Why:** Allows community to "revive" records that MoH removed. Moderator sees full history and can make informed decision.

**Version History Example:**
```
Version 1: INSERT (MoH bulk upload) - confirmedByMoh: true, isDeleted: false
Version 2: UPDATE (MoH bulk upload) - confirmedByMoh: false, isDeleted: false
Version 3: UPDATE (MoH bulk upload) - confirmedByMoh: false, isDeleted: true (marked unconfirmed then deleted by later upload)
Version 4: UPDATE (Community undelete) - confirmedByMoh: false, isDeleted: false (undeleted with updated fields)
```

---

### **Scenario D: Community Tries to EDIT Deleted Record**

**Situation:**
1. Deleted record exists with `external_id: "12345"`, `isDeleted = true`
2. Community user tries to submit EDIT for this record

**System Behavior:**
```
❌ Submission REJECTED
📧 Error: "This record has been deleted and cannot be edited. If you believe it should exist, use 'Propose New Record' to submit it as a new entry."
```

**Why:** Users should use NEW_RECORD (undelete operation) to revive deleted records, not EDIT. This forces them to submit complete data.

---

### **Scenario E: MoH Overwrites Community Record**

**Situation:**
1. Community submission approved: `external_id: "C12345"`, `name: "Ahmad"`, `confirmedByMoh = false`
2. MoH bulk upload includes: `external_id: "C12345"`, `name: "Ahmed"`

**System Behavior:**
```
✅ MoH data OVERWRITES community data
✅ confirmedByMoh = true (MoH is authoritative)
✅ PersonVersion created with changeType: UPDATE
✅ Version history preserves community contribution
```

**Why:** MoH is the authoritative source. However, version history shows community originally submitted this record.

**Version History Example:**
```
Version 1: INSERT (Community) - name: "Ahmad", confirmedByMoh: false
Version 2: UPDATE (MoH bulk) - name: "Ahmed", confirmedByMoh: true
```

**Note:** Community contribution is not lost, just superseded. Moderators can review history.

---

### **Scenario F: MoH Record Returns After Being Unconfirmed**

**Situation:**
1. MoH upload 1 includes "12345" → `confirmedByMoh = true`
2. MoH upload 2 missing "12345" → `confirmedByMoh = false`
3. MoH upload 3 includes "12345" again

**System Behavior:**
```
✅ Record is re-confirmed: confirmedByMoh = true
✅ PersonVersion created with changeType: UPDATE
✅ Version history shows: confirmed → unconfirmed → re-confirmed
```

**Why:** MoH data is dynamic. Records may be temporarily removed then re-added.

**Version History Example:**
```
Version 1: INSERT (MoH) - confirmedByMoh: true
Version 2: UPDATE (MoH) - confirmedByMoh: false
Version 3: UPDATE (MoH) - confirmedByMoh: true
```

---

### **Scenario G: Pending Community Submission When MoH Upload Occurs**

**Situation:**
1. Community submits NEW_RECORD "C12345" → status: PENDING
2. Before approval, MoH bulk upload includes "C12345"

**System Behavior:**
```
✅ MoH upload succeeds (creates person with confirmedByMoh: true)
⚠️ When moderator tries to approve community submission:
    ❌ Approval FAILS: "Person with this External ID already exists. Mark as SUPERSEDED instead."
    ✅ Moderator sees error and can mark submission as SUPERSEDED
```

**Why:** MoH data arrived first. Moderator should acknowledge the submission is now redundant.

**Recommended Moderator Action:**
- Mark submission as `SUPERSEDED` with note: "Record already added by MoH bulk upload"
- If community submission has additional fields (photo, obituary), moderator can:
  1. Mark as SUPERSEDED
  2. Create a new EDIT submission internally to add those fields

---

### **Scenario H: Multiple Pending Edits to Same Record**

**Situation:**
1. User A submits EDIT to "12345" (based on version 5) → PENDING
2. User B submits EDIT to "12345" (based on version 5) → PENDING
3. Moderator approves A's edit (creates version 6)

**System Behavior:**
```
✅ User A's submission approved → version 6 created
⚠️ User B's submission is now OUTDATED (based on version 5, current is 6)
✅ Moderator can still review User B's submission
✅ No automatic conflict detection (moderator decides manually)
```

**Why:** Conflict detection is manual. Moderators have full context to make decisions.

**Recommended Moderator Action:**
- Check `baseVersionId` vs current version
- If outdated, review changes and decide:
  - Approve if changes don't conflict
  - Reject and ask user to resubmit based on latest version
  - Manually merge changes

---

### **Scenario I: External ID Format Collisions**

**Situation:**
- MoH uses numeric IDs: "12345"
- Community uses alphanumeric: "C12345"
- Both systems are separate

**System Behavior:**
```
✅ Database unique constraint prevents conflicts
✅ If collision occurs, submission/upload FAILS
📧 Error: "External ID already exists"
```

**Why:** `externalId` has unique constraint. Different ID formats naturally prevent conflicts.

**Recommended Convention:**
- MoH IDs: Pure numeric (e.g., "12345")
- Community IDs: Start with "C" (e.g., "C12345")
- Document this convention in submission UI

---

## Implementation Details

### Database Schema

**Person Table:**
```sql
CREATE TABLE Person (
  id TEXT PRIMARY KEY,
  externalId TEXT UNIQUE NOT NULL, -- Prevents duplicate IDs
  confirmedByMoh BOOLEAN DEFAULT false, -- MoH = true, Community = false
  isDeleted BOOLEAN DEFAULT false, -- Soft delete flag
  ...
);
```

**PersonVersion Table:**
```sql
CREATE TABLE PersonVersion (
  id TEXT PRIMARY KEY,
  personId TEXT NOT NULL, -- Foreign key to Person
  versionNumber INTEGER NOT NULL, -- Incremental version counter
  changeType TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  isDeleted BOOLEAN DEFAULT false, -- State at this version
  confirmedByMoh BOOLEAN DEFAULT false, -- State at this version
  sourceId TEXT NOT NULL, -- Foreign key to ChangeSource
  ...
);
```

**CommunitySubmission Table:**
```sql
CREATE TABLE CommunitySubmission (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- NEW_RECORD or EDIT
  personId TEXT NULL, -- Set if NEW_RECORD is undelete operation
  baseVersionId TEXT NULL, -- Set if EDIT operation
  proposedPayload JSON NOT NULL, -- Submitted data
  status TEXT NOT NULL, -- PENDING, APPROVED, REJECTED, SUPERSEDED
  ...
);
```

---

### API Endpoints

#### **POST /api/community/submit** (Community Submission)

**NEW_RECORD Logic:**
```typescript
// 1. Check if external ID exists
const existingPerson = await prisma.person.findUnique({
  where: { externalId: payload.externalId },
});

// 2. If active record exists → REJECT
if (existingPerson && !existingPerson.isDeleted) {
  return { error: 'Use Suggest Edit instead' };
}

// 3. If deleted record exists → ALLOW (undelete operation)
const personIdForUndelete = existingPerson?.isDeleted ? existingPerson.id : null;

// 4. Create submission (with personId if undelete)
await prisma.communitySubmission.create({
  data: {
    type: 'NEW_RECORD',
    personId: personIdForUndelete, // Signals undelete to moderator
    proposedPayload: payload,
    status: 'PENDING',
  },
});
```

**EDIT Logic:**
```typescript
// 1. Find person by external ID
const person = await prisma.person.findUnique({
  where: { externalId: externalId },
});

// 2. If not found → REJECT
if (!person) {
  return { error: 'Person not found. Use Propose New Record instead.' };
}

// 3. If deleted → REJECT (must use NEW_RECORD for undelete)
if (person.isDeleted) {
  return { error: 'This record has been deleted. Use Propose New Record to undelete.' };
}

// 4. Create EDIT submission
await prisma.communitySubmission.create({
  data: {
    type: 'EDIT',
    personId: person.id,
    baseVersionId: person.versions[0].id, // Latest version
    proposedPayload: payload,
    status: 'PENDING',
  },
});
```

---

#### **POST /api/moderator/moderation/[id]/approve** (Moderator Approval)

**NEW_RECORD Approval Logic:**
```typescript
// 1. Check if external ID exists
const existingPerson = await prisma.person.findUnique({
  where: { externalId: payload.externalId },
});

// 2. If active record exists → REJECT
if (existingPerson && !existingPerson.isDeleted) {
  return { error: 'External ID already exists. Mark as SUPERSEDED instead.' };
}

// 3. Determine if undelete operation
const isUndeleteOperation = existingPerson && existingPerson.isDeleted;

if (isUndeleteOperation) {
  // 4a. UNDELETE: Update existing person
  const nextVersionNumber = existingPerson.versions[0].versionNumber + 1;
  
  await prisma.person.update({
    where: { id: existingPerson.id },
    data: {
      ...payload,
      isDeleted: false, // Undelete
      confirmedByMoh: false, // Community submission
    },
  });
  
  await prisma.personVersion.create({
    data: {
      personId: existingPerson.id,
      ...payload,
      versionNumber: nextVersionNumber,
      changeType: 'UPDATE', // UPDATE for undelete
      isDeleted: false,
      confirmedByMoh: false,
    },
  });
} else {
  // 4b. NEW: Create new person
  const person = await prisma.person.create({
    data: { ...payload, confirmedByMoh: false, isDeleted: false },
  });
  
  await prisma.personVersion.create({
    data: {
      personId: person.id,
      ...payload,
      versionNumber: 1,
      changeType: 'INSERT', // INSERT for new
      confirmedByMoh: false,
    },
  });
}
```

---

#### **POST /api/admin/bulk-upload/apply** (MoH Bulk Upload)

**Unconfirm Logic (Records Missing from Upload):**
```typescript
// 1. Find all existing MoH-confirmed records
const allExistingPersons = await prisma.person.findMany({
  where: { isDeleted: false },
});

// 2. Find records NOT in new upload
const toUnconfirm = allExistingPersons.filter(
  existing => !incomingIdsSet.has(existing.externalId) 
    && existing.confirmedByMoh === true
);

// 3. Mark as unconfirmed (NOT deleted)
for (const person of toUnconfirm) {
  await prisma.person.update({
    where: { id: person.id },
    data: { confirmedByMoh: false }, // Unconfirm, don't delete
  });
  
  await prisma.personVersion.create({
    data: {
      personId: person.id,
      ...person,
      versionNumber: nextVersionNumber,
      changeType: 'UPDATE', // UPDATE (status change)
      confirmedByMoh: false,
      isDeleted: false, // NOT deleted
    },
  });
}
```

**Note:** Community records (`confirmedByMoh = false`) are **never** affected by MoH uploads.

---

## Testing Checklist

### ✅ **Bulk Upload Tests**

- [ ] MoH upload with new record → creates person with `confirmedByMoh = true`
- [ ] MoH upload missing previously included record → sets `confirmedByMoh = false` (not deleted)
- [ ] MoH upload re-includes previously missing record → sets `confirmedByMoh = true` again
- [ ] MoH upload overwrites community record → sets `confirmedByMoh = true`, preserves history
- [ ] MoH upload does NOT affect community records (`confirmedByMoh = false`)

### ✅ **Community Submission Tests**

- [ ] NEW_RECORD with unique external ID → ACCEPTED
- [ ] NEW_RECORD with existing active external ID → REJECTED (error: use EDIT)
- [ ] NEW_RECORD with deleted external ID → ACCEPTED (undelete operation)
- [ ] EDIT on active record → ACCEPTED
- [ ] EDIT on deleted record → REJECTED (error: use NEW_RECORD)

### ✅ **Moderation Tests**

- [ ] Approve NEW_RECORD (unique ID) → creates person with version 1
- [ ] Approve NEW_RECORD (deleted ID) → updates person, increments version, sets `isDeleted = false`
- [ ] Approve NEW_RECORD (active ID exists) → REJECTED (error: superseded)
- [ ] Approve EDIT (valid baseVersionId) → creates new version
- [ ] Approve EDIT (outdated baseVersionId) → Moderator manually reviews

### ✅ **Version History Tests**

- [ ] Each change creates new PersonVersion entry
- [ ] Version numbers increment sequentially
- [ ] `changeType` accurately reflects operation (INSERT, UPDATE)
- [ ] Undelete operations show `changeType = UPDATE` with `isDeleted: false`
- [ ] Full history visible to moderators and admins

---

## Summary

The Gaza Death Toll database handles data conflicts through:

1. **MoH Authority**: MoH data takes precedence, but community contributions are preserved
2. **Soft Deletes**: Records marked unconfirmed (not deleted) when missing from MoH uploads
3. **Undelete Operations**: Community can revive deleted records via NEW_RECORD submissions
4. **Version History**: Complete audit trail of all changes
5. **Manual Moderation**: Moderators have final decision on all community submissions

All edge cases are handled gracefully with clear error messages and full transparency.

---

**For More Information:**
- See `DATABASE.md` for database schema details
- See `ENGINEERING.md` for API configuration
- See `API_DOCUMENTATION.md` for endpoint reference

