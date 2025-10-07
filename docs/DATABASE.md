# 🗄️ Database Schema & Design

**Last Updated:** 2025-10-07  
**Source of Truth:** `prisma/schema.prisma`

---

## 📋 Table of Contents
- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Tables & Relationships](#tables--relationships)
- [Community Submission Lifecycle](#community-submission-lifecycle)
- [Version History Model](#version-history-model)
- [Conflict Detection](#conflict-detection)
- [Data Integrity Rules](#data-integrity-rules)

---

## Overview

The database uses **PostgreSQL** with **Prisma ORM**. The design follows an **event-sourced version history** model where:

1. **Person** = Current state (snapshot)
2. **PersonVersion** = Immutable history of all changes
3. **ChangeSource** = Provenance tracking (where did this change come from?)
4. **CommunitySubmission** = Two-phase moderation queue

---

## Core Concepts

### 1. Event Sourcing & Version History

**Every change is tracked as a version:**
```
Person (id: "abc", name: "John", dateOfDeath: "2024-01-15")
  ↑ Current state
  
PersonVersion History:
  v1: INSERT - name: "John", dateOfDeath: null (from community submission)
  v2: UPDATE - dateOfDeath: "2024-01-10" (from community edit)
  v3: UPDATE - dateOfDeath: "2024-01-15" (from bulk upload - MoH correction)
```

**Benefits:**
- Full audit trail of all changes
- Can rollback to any previous state
- Know the source of every change
- Detect conflicts when multiple people edit

---

### 2. Two-Phase Moderation

**Community submissions don't directly create Person records.**

#### Phase 1: Submission (User Action)
```sql
-- User submits new person via /api/community/submit
INSERT INTO CommunitySubmission (
  type: 'NEW_RECORD',
  status: 'PENDING',
  proposedPayload: '{"externalId": "442", "name": "John Doe", ...}',
  personId: NULL,           -- Person doesn't exist yet
  baseVersionId: NULL       -- No previous version
)
```

Data sits as **JSON** in the submissions table. No Person or PersonVersion records exist yet.

#### Phase 2: Approval (Moderator Action)
```sql
-- Moderator approves via /api/moderator/moderation/[id]/approve
BEGIN TRANSACTION;
  
  -- 1. Create provenance record
  INSERT INTO ChangeSource (type: 'COMMUNITY_SUBMISSION', ...);
  
  -- 2. Create Person record (current state)
  INSERT INTO Person (externalId: "442", name: "John Doe", ...);
  
  -- 3. Create PersonVersion (history)
  INSERT INTO PersonVersion (
    personId: [person.id],
    versionNumber: 1,
    changeType: 'INSERT',
    sourceId: [changeSource.id],
    ...
  );
  
  -- 4. Link submission to created records
  UPDATE CommunitySubmission SET
    status: 'APPROVED',
    personId: [person.id],
    appliedVersionId: [version.id];
    
COMMIT;
```

**Why this design?**
- ✅ Keeps junk data out of main tables
- ✅ Moderators can review before it becomes "real"
- ✅ Full audit trail of who submitted what and who approved it
- ✅ Submissions stay in table forever (audit history)

---

### 3. Change Source Tracking

Every change has provenance via `ChangeSource`:

```
ChangeSource Types:
  BULK_UPLOAD          → Ministry of Health CSV imports
  COMMUNITY_SUBMISSION → Approved community contributions
  MANUAL_EDIT          → Direct admin edits (not yet implemented)
```

**Example:**
```
ChangeSource (id: "src-1", type: 'BULK_UPLOAD')
  ← BulkUpload (filename: "moh-2024-10-07.csv", label: "October Update")
  ← PersonVersion (v2, changeType: 'UPDATE')
  ← PersonVersion (v3, changeType: 'UPDATE')
  ← PersonVersion (v4, changeType: 'DELETE')
```

One change source can affect multiple person versions (one bulk upload changes many people).

---

## Tables & Relationships

### Person (Current State)
**The "snapshot" of each person's current data.**

```prisma
model Person {
  id                String    @id @default(uuid())
  externalId        String    @unique         // e.g., "P12345" from MoH
  name              String
  nameEnglish       String?
  gender            Gender                    // MALE | FEMALE | OTHER
  dateOfBirth       DateTime?
  dateOfDeath       DateTime?
  locationOfDeathLat Float?                   // -90..90
  locationOfDeathLng Float?                   // -180..180
  obituary          String?
  photoUrlOriginal  String?                   // Vercel Blob URL
  photoUrlThumb     String?                   // Thumbnail (512x512)
  confirmedByMoh    Boolean   @default(false) // true = from bulk upload
  isDeleted         Boolean   @default(false) // soft delete
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  versions          PersonVersion[]
  submissions       CommunitySubmission[]
}
```

**Key Points:**
- `externalId` is **UNIQUE** - one person per ID
- `confirmedByMoh` = `true` if ever included in MoH bulk upload
- `isDeleted` = soft delete (preserve history, hide from public)
- Gets **updated** when bulk uploads or approved edits change data

---

### PersonVersion (Immutable History)
**Every change creates a new version. Never updated or deleted.**

```prisma
model PersonVersion {
  id                String      @id @default(uuid())
  personId          String                    // FK to Person
  versionNumber     Int                       // 1, 2, 3, ...
  changeType        ChangeType                // INSERT | UPDATE | DELETE
  sourceId          String                    // FK to ChangeSource
  
  // Snapshot of person data at this version
  externalId        String
  name              String
  nameEnglish       String?
  gender            Gender
  dateOfBirth       DateTime?
  dateOfDeath       DateTime?
  locationOfDeathLat Float?
  locationOfDeathLng Float?
  obituary          String?
  photoUrlOriginal  String?
  photoUrlThumb     String?
  confirmedByMoh    Boolean
  isDeleted         Boolean
  uploadedAt        DateTime    @default(now())
  
  person            Person      @relation(fields: [personId], references: [id])
  changeSource      ChangeSource @relation(fields: [sourceId], references: [id])
  
  @@unique([personId, versionNumber])
}
```

**Key Points:**
- **IMMUTABLE** - never updated after creation
- `versionNumber` starts at 1, increments on each change
- Each version is a **complete snapshot** of all person fields
- `changeType` indicates what happened: INSERT (new), UPDATE (changed), DELETE (removed)

---

### ChangeSource (Provenance)
**Where did this change come from?**

```prisma
model ChangeSource {
  id              String            @id @default(uuid())
  type            ChangeSourceType  // BULK_UPLOAD | COMMUNITY_SUBMISSION | MANUAL_EDIT
  description     String
  createdAt       DateTime          @default(now())
  
  versions        PersonVersion[]
  bulkUpload      BulkUpload?
  submission      CommunitySubmission?
}
```

**One-to-Many Relationship:**
- One `ChangeSource` → Many `PersonVersion` records
- Example: One bulk upload creates 30,000 person versions

---

### BulkUpload
**Metadata for Ministry of Health CSV imports.**

```prisma
model BulkUpload {
  id              String        @id @default(uuid())
  changeSourceId  String        @unique
  filename        String
  label           String                      // User-provided label (max 200 chars)
  dateReleased    DateTime                    // When MoH released this data
  fileUrl         String                      // Vercel Blob URL
  uploadedAt      DateTime      @default(now())
  
  changeSource    ChangeSource  @relation(fields: [changeSourceId], references: [id])
}
```

**Key Points:**
- `label` is required for user-friendly identification
- `dateReleased` tracks when MoH published the data
- `fileUrl` stored in Vercel Blob (not in database)

---

### CommunitySubmission
**Two-phase moderation queue for community contributions.**

```prisma
model CommunitySubmission {
  id                      String            @id @default(uuid())
  type                    SubmissionType    // NEW_RECORD | EDIT
  status                  SubmissionStatus  // PENDING | APPROVED | REJECTED | SUPERSEDED
  submittedBy             String            // Clerk user ID
  createdAt               DateTime          @default(now())
  
  // BEFORE APPROVAL (submission time)
  baseVersionId           String?           // NULL for NEW_RECORD, versionId for EDIT
  personId                String?           // NULL for NEW_RECORD, personId for EDIT
  proposedPayload         Json              // All data stored as JSON
  reason                  String?           // User's explanation
  
  // AFTER APPROVAL (moderation time)
  approvedBy              String?           // Clerk user ID
  approvedAt              DateTime?
  decisionNote            String?           // Moderator's note
  approvedChangeSourceId  String?           // FK to ChangeSource (created on approval)
  appliedVersionId        String?           // FK to PersonVersion (created on approval)
  decisionAction          DecisionAction?   // UPDATE | DELETE (for EDIT only)
  
  person                  Person?           @relation(fields: [personId], references: [id])
  baseVersion             PersonVersion?    @relation("BaseVersion", fields: [baseVersionId], references: [id])
  approvedChangeSource    ChangeSource?     @relation(fields: [approvedChangeSourceId], references: [id])
  appliedVersion          PersonVersion?    @relation("AppliedVersion", fields: [appliedVersionId], references: [id])
}
```

**Key Points:**
- **Stays in table forever** (permanent audit history)
- `baseVersionId` and `personId` nullable **by design** (see Conflict Detection section)
- `proposedPayload` is JSON - flexible schema for different submission types

---

### AuditLog
**High-level audit trail for admin/moderator actions.**

```prisma
model AuditLog {
  id           String   @id @default(uuid())
  userId       String                         // Clerk user ID
  userEmail    String?                        // Cached from Clerk
  action       String                         // BULK_UPLOAD_APPLIED, COMMUNITY_SUBMISSION_APPROVED, etc.
  resourceType String                         // BULK_UPLOAD, COMMUNITY_SUBMISSION, PERSON, USER
  resourceId   String?                        // ID of affected resource
  description  String                         // Human-readable summary
  metadata     Json?                          // Additional context
  ipAddress    String?
  createdAt    DateTime @default(now())
}
```

---

## Community Submission Lifecycle

### NEW_RECORD Flow

#### 1. User Submits (Phase 1)
```sql
-- POST /api/community/submit
CommunitySubmission:
  id: "sub-abc"
  type: 'NEW_RECORD'
  status: 'PENDING'
  submittedBy: "user_123"
  proposedPayload: {
    "externalId": "P9999",
    "name": "Jane Smith",
    "gender": "FEMALE",
    "dateOfBirth": "1990-05-15",
    "dateOfDeath": null,
    "photoUrlThumb": "https://blob.../thumb.webp",
    "photoUrlOriginal": "https://blob.../original.webp"
  }
  
  -- These are NULL because nothing exists yet:
  personId: NULL
  baseVersionId: NULL
  appliedVersionId: NULL
```

**State:**
- ❌ NO Person record
- ❌ NO PersonVersion record
- ✅ Data in JSON, waiting for moderation

---

#### 2. Moderator Approves (Phase 2)
```sql
-- POST /api/moderator/moderation/sub-abc/approve
BEGIN TRANSACTION;

-- Create ChangeSource
INSERT INTO ChangeSource VALUES (
  id: "src-xyz",
  type: 'COMMUNITY_SUBMISSION',
  description: 'Community-submitted new record: Jane Smith (P9999)'
);

-- Create Person (current state)
INSERT INTO Person VALUES (
  id: "person-new",
  externalId: "P9999",
  name: "Jane Smith",
  gender: "FEMALE",
  dateOfBirth: "1990-05-15",
  confirmedByMoh: false,  -- Community submission, not MoH
  ...
);

-- Create PersonVersion (history)
INSERT INTO PersonVersion VALUES (
  id: "ver-1",
  personId: "person-new",
  versionNumber: 1,         -- First version!
  changeType: 'INSERT',
  sourceId: "src-xyz",
  -- All person data copied here
);

-- Update CommunitySubmission (link everything)
UPDATE CommunitySubmission WHERE id = "sub-abc" SET
  status: 'APPROVED',
  approvedBy: "admin_456",
  approvedAt: NOW(),
  personId: "person-new",          -- NOW LINKED
  appliedVersionId: "ver-1";       -- NOW LINKED

COMMIT;
```

**Final State:**
- ✅ Person exists
- ✅ PersonVersion v1 exists
- ✅ CommunitySubmission updated with links
- ✅ ChangeSource tracks provenance

---

### EDIT Flow

#### 1. User Submits Edit
```sql
-- User wants to update dateOfDeath for existing person "P12345"
-- They see version 5 of this person when submitting

CommunitySubmission:
  id: "sub-edit"
  type: 'EDIT'
  status: 'PENDING'
  submittedBy: "user_789"
  proposedPayload: {
    "dateOfDeath": "2024-10-01",
    "obituary": "Updated obituary text"
  }
  
  -- These are SET because person exists:
  personId: "person-existing"        -- Editing this person
  baseVersionId: "version-5"         -- Based on version 5
  appliedVersionId: NULL             -- Not approved yet
```

**State:**
- ✅ Person "person-existing" already exists (at version 5)
- ✅ `baseVersionId` = "version-5" (for conflict detection)
- ⏳ Waiting for moderation

---

#### 2. Moderator Approves
```sql
-- Check for conflicts first:
SELECT versionNumber FROM PersonVersion 
WHERE personId = "person-existing"
ORDER BY versionNumber DESC LIMIT 1;
-- Returns: versionNumber = 5

-- baseVersionId points to version 5, current is version 5 → NO CONFLICT ✅

BEGIN TRANSACTION;

-- Create ChangeSource
INSERT INTO ChangeSource VALUES (
  id: "src-edit",
  type: 'COMMUNITY_SUBMISSION',
  description: 'Community-submitted edit to John Doe (P12345)'
);

-- Update Person (current state)
UPDATE Person WHERE id = "person-existing" SET
  dateOfDeath: "2024-10-01",
  obituary: "Updated obituary text";

-- Create PersonVersion (history)
INSERT INTO PersonVersion VALUES (
  id: "ver-6",
  personId: "person-existing",
  versionNumber: 6,             -- Incremented!
  changeType: 'UPDATE',
  sourceId: "src-edit",
  -- All person data (including new changes)
);

-- Update CommunitySubmission
UPDATE CommunitySubmission WHERE id = "sub-edit" SET
  status: 'APPROVED',
  appliedVersionId: "ver-6";

COMMIT;
```

---

## Version History Model

### How Versions Work

**Person** table = **current state** (always the latest)  
**PersonVersion** table = **complete history** (never deleted)

```
Person (id: "abc-123", name: "John", dateOfDeath: "2024-10-15")
  ↑ Current state (matches version 3)

PersonVersion History:
┌─────┬────────┬────────┬─────────────┬────────────────┐
│ Ver │ Type   │ Source │ dateOfDeath │ confirmedByMoh │
├─────┼────────┼────────┼─────────────┼────────────────┤
│ 1   │ INSERT │ Comm.  │ NULL        │ false          │  ← Created by community
│ 2   │ UPDATE │ Comm.  │ 2024-10-01  │ false          │  ← Community added death date
│ 3   │ UPDATE │ Bulk   │ 2024-10-15  │ true           │  ← MoH corrected date (now official)
└─────┴────────┴────────┴─────────────┴────────────────┘
```

### Querying History

**Get current state:**
```sql
SELECT * FROM Person WHERE id = 'abc-123';
```

**Get full history:**
```sql
SELECT * FROM PersonVersion 
WHERE personId = 'abc-123' 
ORDER BY versionNumber ASC;
```

**Get specific version:**
```sql
SELECT * FROM PersonVersion 
WHERE personId = 'abc-123' AND versionNumber = 2;
```

**Rollback to version N:**
```sql
-- Update Person to match version N
UPDATE Person SET 
  dateOfDeath = (SELECT dateOfDeath FROM PersonVersion WHERE personId = 'abc-123' AND versionNumber = 2),
  obituary = (SELECT obituary FROM PersonVersion WHERE personId = 'abc-123' AND versionNumber = 2),
  ...
WHERE id = 'abc-123';

-- PersonVersion history is NEVER deleted
-- Just update current state to match old version
```

---

## Conflict Detection

### Why `baseVersionId` Exists

**Problem:** What if two people edit the same person at the same time?

```
Timeline:
  t1: User A opens edit form, sees version 5
  t2: User B opens edit form, sees version 5
  t3: User A submits edit (baseVersionId = 5)
  t4: Moderator approves User A's edit → creates version 6
  t5: User B submits edit (baseVersionId = 5)  ← STALE!
  t6: Moderator tries to approve User B's edit
```

### Conflict Detection Logic

```typescript
// src/app/api/moderator/moderation/[id]/approve/route.ts
// Lines 186-189

// Check if base version is stale
if (submission.baseVersion && 
    submission.baseVersion.versionNumber < latestVersion.versionNumber) {
  return NextResponse.json({ 
    error: 'Base version is stale. Record has been updated since submission. Mark as SUPERSEDED instead.' 
  }, { status: 400 });
}
```

**Logic:**
```
IF submission.baseVersionId.versionNumber < person.latestVersion.versionNumber:
  REJECT with "Base version is stale"
  Moderator should mark as SUPERSEDED
```

### Field Meanings

| Field | NEW_RECORD | EDIT | Purpose |
|-------|------------|------|---------|
| `baseVersionId` | `NULL` | `"version-5"` | "What version did user see when they made this edit?" |
| `personId` | `NULL` | `"person-xyz"` | "Which person is being edited?" (NULL for new) |
| `appliedVersionId` | (after approval) `"version-1"` | (after approval) `"version-6"` | "What version was created when approved?" |

**Think of it like Git:**
```bash
# NEW_RECORD:
git init  # No previous commits (baseVersionId = NULL)

# EDIT:
git checkout abc123  # Basing changes on commit abc123 (baseVersionId = "abc123")

# If someone else pushed, you have a merge conflict!
```

---

## Data Integrity Rules

### Unique Constraints

```prisma
@@unique([personId, versionNumber])  // PersonVersion: One version number per person
@unique externalId                   // Person: One person per external ID
```

### Foreign Key Constraints

```
PersonVersion.personId     → Person.id         (CASCADE delete)
PersonVersion.sourceId     → ChangeSource.id   (RESTRICT)
BulkUpload.changeSourceId  → ChangeSource.id   (CASCADE delete)
CommunitySubmission.personId         → Person.id         (SET NULL on delete)
CommunitySubmission.baseVersionId    → PersonVersion.id  (SET NULL on delete)
CommunitySubmission.appliedVersionId → PersonVersion.id  (SET NULL on delete)
```

### Soft Deletes

**Never hard-delete Person or PersonVersion records.**

```sql
-- Soft delete (preserve history):
UPDATE Person SET isDeleted = true WHERE id = 'abc-123';

-- Create DELETE version:
INSERT INTO PersonVersion VALUES (
  changeType: 'DELETE',
  isDeleted: true,
  ...
);
```

**Why?**
- Audit trail preserved
- Can be un-deleted
- Version history intact
- Community submissions still reference the person

---

## Nullable Fields Explained

### Why These Fields Are Nullable

#### `Person.dateOfBirth`
```prisma
dateOfBirth DateTime?
```
**Reason:** Some MoH records don't include date of birth.

---

#### `CommunitySubmission.baseVersionId`
```prisma
baseVersionId String?
```
**Reason:**
- NEW_RECORD: No previous version exists → `NULL`
- EDIT: References the version they edited from → `"version-5"`

---

#### `CommunitySubmission.personId`
```prisma
personId String?
```
**Reason:**
- NEW_RECORD: Person doesn't exist yet → `NULL` → Filled on approval
- EDIT: Editing existing person → `"person-xyz"`

---

#### `CommunitySubmission.appliedVersionId`
```prisma
appliedVersionId String?
```
**Reason:**
- PENDING: Not approved yet → `NULL`
- APPROVED: Version created → `"version-123"`

---

## Best Practices

### ✅ DO:
- Always create a `PersonVersion` when changing `Person`
- Use transactions for multi-table writes
- Check `baseVersionId` for staleness before approving edits
- Soft-delete (set `isDeleted = true`) instead of hard-deleting
- Include descriptive `ChangeSource.description` for audit trails

### ❌ DON'T:
- Never update or delete `PersonVersion` records (immutable)
- Never hard-delete `Person` records (breaks foreign keys)
- Never skip creating a `ChangeSource` for a change
- Never approve EDIT submissions without checking for staleness
- Never re-use `versionNumber` (always increment)

---

## Migrations

**All migrations are in:** `prisma/migrations/`

**Creating a new migration:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name description_of_change

# 3. Generate Prisma Client
npx prisma generate
```

**Applying migrations (production):**
```bash
npx prisma migrate deploy
```

---

## Questions?

**See also:**
- `docs/ENGINEERING.md` - Overall architecture
- `docs/API_DOCUMENTATION.md` - API endpoints
- `prisma/schema.prisma` - Source of truth for schema

**Key design decisions documented:**
- Event sourcing: Full version history
- Two-phase moderation: JSON → approval → Person/Version
- Conflict detection: baseVersionId for stale edit detection
- Soft deletes: Preserve audit trail

---

**End of Database Documentation**

