# Gaza Death Toll - Admin Tools (Product Overview)

> Status: ✅ Production Ready

---

## 🎯 What This Is

Internal admin control panel for managing the Gaza Death Toll database.

**Purpose**: Data management, bulk uploads, community moderation  
**NOT**: Public-facing application (that's separate)

**For Whom**:
- **Admins**: Full system control - bulk uploads, system management
- **Moderators**: Review and approve community submissions
- **Community**: Any authenticated user can submit new records or suggest edits

**Why**: 
- Maintain accurate, up-to-date records of casualties
- Enable community participation with proper oversight
- Provide transparent audit trail of all changes
- Support bulk updates from official sources (Ministry of Health)

---

## ✅ Core Features

### Data Management
- **Bulk Uploads** — Upload CSV files from official sources with simulation preview
- **Apply & Rollback** — Safely apply uploads with ability to reverse changes
- **Records Browser** — View all records with complete version history
- **Audit Logs** — Complete audit trail of all administrative actions

### Community Participation
- **Submit New Records** — Community can propose new casualty records
- **Suggest Edits** — Update death dates, locations, obituaries, and photos
- **Photo Uploads** — Add photos to existing records (automatically resized)
- **Moderation Queue** — Staff review and approve/reject all submissions

### Oversight & Control
- **Simulation Mode** — Preview all changes before applying (inserts/updates/deletes)
- **Version Tracking** — Full history of every change to every record
- **Role-Based Access** — Separate permissions for admins, moderators, community
- **Audit Trail** — Who did what, when, and why

---

## 🔐 Access Control

| Role | Who | Can Do |
|------|-----|--------|
| **Admin** | System administrators | Everything (bulk uploads, moderation, system settings, audit logs) |
| **Moderator** | Trusted reviewers | Review submissions, access records and audit logs |
| **Community** | Any logged-in user | Submit new records and suggest edits |
| **Public** | Anonymous users | Read-only access via separate public API |

**Notes**:
- Admins automatically have all moderator permissions
- Moderators automatically have all community permissions
- Community role is not explicitly assigned - any authenticated user can submit

---

## 📁 System Overview

```
Admin Tools (This App)
  ↓ manages data in
PostgreSQL Database (Shared)
  ↑ provides data to
Public Website (Separate App)
  ↓ allows
Community Submissions
  ↓ reviewed by
Moderation Queue (This App)
```

**Key Concepts**:
- **Person**: Individual casualty record
- **Version**: Snapshot of a person's data at a point in time
- **Change Source**: What caused a change (bulk upload, community submission, manual edit)
- **Submission**: Community proposal awaiting moderation

---

## 🔄 Key Workflows

### 1. Bulk Upload (Admin Only)
1. Upload CSV file with label and release date
2. System compares with existing data
3. Preview shows: inserts, updates (with diffs), deletions
4. Approve to apply or cancel to discard
5. Can rollback if needed (LIFO - last upload first)

### 2. Community Submission (Any User)
**New Record**:
1. User fills form: External ID, Name, Gender, Date of Birth
2. Optional: Death date, location, obituary, photo
3. Submission enters moderation queue
4. Staff reviews and approves/rejects

**Edit Suggestion**:
1. User searches for existing record
2. Proposes changes: death date, location, obituary, or photo
3. Explains reason for change
4. Staff reviews and approves/rejects

### 3. Moderation (Moderators & Admins)
1. View all pending submissions (FIFO queue)
2. Review proposed changes and reason
3. Approve (creates new version) or Reject (with note)
4. All actions logged in audit trail

---

## 📋 Data Fields: Sources & Permissions

### Core Identity Fields (Bulk Upload Only)

These fields come **exclusively from official Ministry of Health CSV uploads** and cannot be modified by the community:

| Field | Description | Source |
|-------|-------------|--------|
| **External ID** | Unique identifier from MoH | MoH CSV only |
| **Name** | Full name (Arabic) | MoH CSV only |
| **English Name** | Full name (English) | MoH CSV only |
| **Gender** | Male/Female/Other | MoH CSV only |
| **Date of Birth** | Birth date | MoH CSV only |

**Important**: These fields establish the **official identity** of each person and are considered authoritative. Community cannot edit these fields for existing records.

---

### Additional Context Fields (Community Editable)

These fields can be **added or updated by community submissions** (subject to moderation):

| Field | Description | Can Be Added By | Status |
|-------|-------------|-----------------|--------|
| **Date of Death** | When the person died | MoH CSV or Community | ✅ Implemented |
| **Location (Latitude)** | Death location coordinates (lat) | Community only | ✅ Implemented |
| **Location (Longitude)** | Death location coordinates (lng) | Community only | ✅ Implemented |
| **Obituary** | Memorial text, family statement | Community only | ✅ Implemented |
| **Photo** | Portrait photo | Community only | ✅ Implemented |
| **Profession** | Person's occupation/role | Community only | 🚧 Not Yet Implemented |
| **Cause of Death** | How the person died | Community only | 🚧 Not Yet Implemented |

**Important**: 
- MoH CSV files **do not include** location coordinates, obituaries, photos, profession, or cause of death
- Community submissions **enrich** official records with additional context
- All community additions require moderation approval
- Photos are automatically resized to max 2048x2048 pixels

**🚧 Planned Fields (Not Yet Implemented)**:
- **Profession**: Requires agreed-upon categories (e.g., journalist, medical worker, academic, civil defense, teacher, student, etc.)
- **Cause of Death**: Requires agreed-upon categories (e.g., gunshot, explosion, airstrike, famine, medical collapse, etc.)
- These fields need category definitions and database schema updates before implementation

---

### Community Submission Rules

**When Proposing a NEW Record**:
- ✅ Must provide: External ID, Name, Gender, Date of Birth
- ✅ Optional: Date of Death, Location, Obituary, Photo
- 🚧 Future: Profession, Cause of Death (not yet implemented)
- ⚠️ Record marked as `confirmed_by_moh = false` (not official)
- 📝 Requires moderation approval before appearing in database

**When Suggesting an EDIT**:
- ✅ Can modify: Date of Death, Location, Obituary, Photo
- 🚧 Future: Profession, Cause of Death (not yet implemented)
- ❌ Cannot modify: External ID, Name, English Name, Gender, Date of Birth
- 📝 Requires moderation approval before being applied

**Why This Separation?**:
- Ensures **core identity data** remains authoritative and traceable to official sources
- Allows **community enrichment** with contextual information (locations, photos, memorials)
- Prevents unauthorized changes to official government records
- Maintains clear audit trail of data provenance

---

## 📊 Data Integrity

**Safeguards**:
- All changes are versioned - nothing is truly deleted
- Bulk uploads show full preview before applying
- Deletions can be rolled back
- Audit logs track every action
- Community submissions require approval

**Version History**:
- Every change creates a new version
- Each version links to its change source
- Can view complete history of any record
- Rollback restores previous version

---

## 📚 Documentation

### For Users
- This file (`PRODUCT.md`) — What the product does and why

### For Developers
- `ENGINEERING.md` — Technical architecture and implementation
- `API_README.md` — API documentation index
- `PUBLIC_AND_COMMUNITY_API.md` — External developer API reference
- `ADMIN_AND_MODERATOR_API.md` — Internal staff API reference
- `CONTRIBUTING.md` — How to contribute code
- `.cursorrules` — Development standards and AI agent guidelines

---

## 🎯 Success Metrics

The system is successful when:
- ✅ Data from official sources is quickly and safely imported
- ✅ Community can meaningfully contribute corrections and additions
- ✅ All changes are transparent and auditable
- ✅ Moderators can efficiently review submissions
- ✅ Database remains accurate and up-to-date


