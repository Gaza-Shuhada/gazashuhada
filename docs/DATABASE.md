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
  photoUrlOriginal  String?                   // Vercel Blob URL
  photoUrlThumb     String?                   // Thumbnail (512x512)
  isDeleted         Boolean   @default(false) // soft delete
  currentVersion    Int       @default(1)     // Current version number
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  versions          PersonVersion[]
  submissions       CommunitySubmission[]
}
```

**Key Points:**
- `externalId` is **UNIQUE** - one person per ID  
- All identity data (name, gender, date of birth) originates from Ministry of Health CSV uploads
- `isDeleted` = soft delete (preserve history, hide from public)
- `currentVersion` tracks the latest version number for quick reference
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
  photoUrlOriginal  String?
  photoUrlThumb     String?
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
  comment         String?                     // Optional user-provided comment
  dateReleased    DateTime                    // When MoH released this data
  fileUrl         String                      // Vercel Blob URL
  fileSize        Int                         // File size in bytes
  fileSha256      String                      // SHA-256 hash for integrity
  contentType     String                      // MIME type
  previewLines    String?                     // First ~20 lines for preview
  uploadedAt      DateTime      @default(now())
  
  changeSource    ChangeSource  @relation(fields: [changeSourceId], references: [id])
}
```

**Key Points:**
- `comment` is optional for user-friendly identification (replaces old `label` field)
- `dateReleased` tracks when MoH published the data
- `fileUrl` stored in Vercel Blob with metadata for integrity verification

---

### CommunitySubmission
**Two-phase moderation queue for community contributions.**

```prisma
model CommunitySubmission {
  id                      String            @id @default(uuid())
  type                    SubmissionType    // Always EDIT (only edits allowed)
  baseVersionId           String            // Required: version being edited
  personId                String            // Required: person being edited
  proposedPayload         Json              // Only editable fields: date_of_death, location, photo
  reason                  String?           // Optional explanation for the submission
  submittedBy             String            // Clerk user ID
  status                  SubmissionStatus  @default(PENDING)
  createdAt               DateTime          @default(now())
  
  // AFTER APPROVAL (moderation time)
  approvedBy              String?           // Clerk user ID
  approvedAt              DateTime?
  decisionAction          DecisionAction?   // UPDATE | DELETE
  decisionNote            String?           // Moderator's note
  approvedChangeSourceId  String?           @unique
  appliedVersionId        String?
  
  baseVersion             PersonVersion?    @relation("BaseVersion", fields: [baseVersionId], references: [id])
  person                  Person?           @relation(fields: [personId], references: [id])
  approvedChangeSource    ChangeSource?     @relation(fields: [approvedChangeSourceId], references: [id])
  appliedVersion          PersonVersion?    @relation("AppliedVersion", fields: [appliedVersionId], references: [id])
}
```

**Key Points:**
- **Stays in table forever** (permanent audit history)
- `baseVersionId` and `personId` are **required** (only edits to existing records allowed)
- `proposedPayload` is JSON - contains only editable fields (date of death, location, photos)
- No NEW_RECORD submissions - all records must originate from Ministry of Health

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

### EDIT Flow (Only Option)

#### 1. User Submits Edit
```sql
-- User wants to update dateOfDeath and location for existing person "P12345"
-- They see version 5 of this person when submitting

CommunitySubmission:
  id: "sub-edit"
  type: 'EDIT'                       -- Always EDIT (only option)
  status: 'PENDING'
  submittedBy: "user_789"
  proposedPayload: {
    "dateOfDeath": "2024-10-01",
    "locationOfDeathLat": 31.5,
    "locationOfDeathLng": 34.4
  }
  
  -- These are REQUIRED because person exists:
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
  locationOfDeathLat: 31.5,
  locationOfDeathLng: 34.4;

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
┌─────┬────────┬────────┬─────────────┬───────────────────┐
│ Ver │ Type   │ Source │ dateOfDeath │ Notes             │
├─────┼────────┼────────┼─────────────┼───────────────────┤
│ 1   │ INSERT │ Bulk   │ NULL        │ MoH initial data  │
│ 2   │ UPDATE │ Comm.  │ 2024-10-01  │ Community added   │
│ 3   │ UPDATE │ Bulk   │ 2024-10-15  │ MoH corrected     │
└─────┴────────┴────────┴─────────────┴───────────────────┘
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

| Field | EDIT (Only Option) | Purpose |
|-------|-------------------|---------|
| `baseVersionId` | `"version-5"` (required) | "What version did user see when they made this edit?" |
| `personId` | `"person-xyz"` (required) | "Which person is being edited?" |
| `appliedVersionId` | `NULL` initially, then `"version-6"` after approval | "What version was created when approved?" |

**Think of it like Git:**
```bash
# EDIT:
git checkout abc123  # Basing changes on commit abc123 (baseVersionId = "abc123")

# If someone else pushed, you have a merge conflict!
```

**Note:** All records must originate from Ministry of Health. Community can only edit existing records.

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
baseVersionId String
```
**Reason:**
- Always required - references the version they edited from (e.g., `"version-5"`)
- No NEW_RECORD submissions allowed

---

#### `CommunitySubmission.personId`
```prisma
personId String
```
**Reason:**
- Always required - identifies which existing person is being edited (e.g., `"person-xyz"`)
- No NEW_RECORD submissions allowed

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

