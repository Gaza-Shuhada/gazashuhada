# Admin & Moderator API Documentation

> **Version**: 2.0.0  
> **Last Updated**: 2025-10-06  
> **For**: Internal admin and moderator staff

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Authentication & Roles](#authentication--roles)
3. [Admin Endpoints](#admin-endpoints)
4. [Moderator Endpoints](#moderator-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)

---

## Overview

This API provides internal access for administrators and moderators to manage the Gaza Death Toll database.

### Base URL

```
Production: https://gazadeathtoll-admin.vercel.app
Development: http://localhost:3000
```

### Quick Reference

| Endpoint Prefix | Access Level | Purpose |
|----------------|--------------|---------|
| `/api/admin/*` | Admin only | System administration |
| `/api/moderator/*` | Moderator + Admin | Content moderation, data review |
| `/api/community/*` | All authenticated | Available to staff too |
| `/api/public/*` | No auth | Available to staff too |

---

## Authentication & Roles

### Role Hierarchy

```
Admin (role='admin')
  ├─ Full system access
  ├─ Can use: /api/admin/* + /api/moderator/* + /api/community/* + /api/public/*
  └─ Permissions: Bulk uploads, user management, database operations

Moderator (role='moderator')
  ├─ Content moderation access
  ├─ Can use: /api/moderator/* + /api/community/* + /api/public/*
  └─ Permissions: Approve/reject submissions, view all records, audit logs
```

### Authentication Method

**Clerk Session Cookies** - Automatically included in requests from authenticated users.

**Role Check**:
```typescript
// Backend
import { requireAdmin, requireModerator } from '@/lib/auth-utils';

// Admin only
await requireAdmin();

// Moderator or Admin
await requireModerator();
```

**Frontend**:
```typescript
import { useUser } from '@clerk/nextjs';

const { user } = useUser();
const isAdmin = user?.publicMetadata?.role === 'admin';
const isModerator = user?.publicMetadata?.role === 'moderator' || isAdmin;
```

---

## Admin Endpoints

Admin-only operations for system management.

### 1. Bulk Upload - Simulate

Preview changes from a CSV upload without applying them.

```http
POST /api/admin/bulk-upload/simulate
```

#### Request Headers

```
Content-Type: multipart/form-data
```

#### Request Body

```
file: <CSV file>
label: <string> (e.g., "MOH Update 2024-10-06")
dateReleased: <ISO8601 date> (e.g., "2024-10-06")
```

#### CSV Format

```csv
external_id,name,name_en,gender,date_of_birth
P12345,محمد أحمد,Mohammed Ahmed,M,1990-05-15
P12346,فاطمة علي,Fatima Ali,F,1985-03-20
```

**Required columns**: `external_id`, `name`, `gender`  
**Optional columns**: `name_en`, `date_of_birth`  
**Gender values**: `M` (MALE), `F` (FEMALE), `O` (OTHER)  
**Date formats**: `YYYY-MM-DD` or `MM/DD/YYYY`

#### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "summary": {
      "inserts": 150,
      "updates": 25,
      "deletes": 5,
      "unchanged": 500
    },
    "preview": [
      {
        "externalId": "P12345",
        "operation": "INSERT",
        "incoming": {
          "name": "محمد أحمد",
          "nameEnglish": "Mohammed Ahmed",
          "gender": "MALE",
          "dateOfBirth": "1990-05-15T00:00:00.000Z"
        }
      },
      {
        "externalId": "P12346",
        "operation": "UPDATE",
        "current": {
          "name": "فاطمة علي",
          "dateOfBirth": "1985-03-20T00:00:00.000Z"
        },
        "incoming": {
          "name": "فاطمة علي",
          "dateOfBirth": "1985-03-21T00:00:00.000Z"
        },
        "changes": ["dateOfBirth"]
      }
    ]
  }
}
```

---

### 2. Bulk Upload - Apply

Apply a CSV upload to the database.

```http
POST /api/admin/bulk-upload/apply
```

#### Request

Same format as simulate endpoint.

#### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "uploadId": "upload-uuid-123",
    "summary": {
      "inserts": 150,
      "updates": 25,
      "deletes": 5
    },
    "message": "Bulk upload applied successfully"
  }
}
```

#### Response: `500 Server Error`

```json
{
  "error": "Bulk upload failed",
  "details": "Transaction timeout"
}
```

---

### 3. Bulk Upload - List

Get all previous bulk uploads.

```http
GET /api/admin/bulk-upload/list
```

#### Response: `200 OK`

```json
{
  "success": true,
  "uploads": [
    {
      "id": "upload-123",
      "filename": "moh-2024-10-06.csv",
      "label": "MOH Update 2024-10-06",
      "dateReleased": "2024-10-06T00:00:00.000Z",
      "fileUrl": "https://blob.vercel-storage.com/.../file.csv",
      "fileSize": 1048576,
      "uploadedAt": "2024-10-06T10:30:00.000Z",
      "stats": {
        "inserts": 150,
        "updates": 25,
        "deletes": 5
      },
      "canRollback": true
    }
  ]
}
```

---

### 4. Bulk Upload - Rollback

Undo a bulk upload (LIFO - Last In, First Out).

```http
POST /api/admin/bulk-upload/{uploadId}/rollback
```

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `uploadId` | UUID of the upload to rollback |

#### Response: `200 OK`

```json
{
  "success": true,
  "message": "Bulk upload rolled back successfully",
  "stats": {
    "recordsRestored": 5,
    "recordsReverted": 25,
    "recordsRemoved": 150
  }
}
```

#### Response: `400 Bad Request`

```json
{
  "error": "Cannot rollback: newer uploads exist that modified these records"
}
```

---

### 5. Clear Database

**⚠️ DANGER ZONE** - Delete all data from the database.

```http
POST /api/admin/clear-database
```

#### Response: `200 OK`

```json
{
  "success": true,
  "message": "Database cleared successfully",
  "stats": {
    "persons": 50000,
    "versions": 125000,
    "uploads": 15,
    "sources": 20,
    "submissions": 100
  }
}
```

**Note**: CSV files in Blob storage are NOT deleted.

---

### 6. Set User Role

Change a user's role (admin or moderator).

```http
POST /api/admin/set-role
```

#### Request Body

```json
{
  "userId": "user_clerk_id_123",
  "role": "moderator"
}
```

**Valid roles**: `"admin"`, `"moderator"`, `null` (remove role)

#### Response: `200 OK`

```json
{
  "success": true,
  "message": "User role updated to moderator"
}
```

---

## Moderator Endpoints

Moderator and admin access for content management.

### 1. List Pending Submissions

Get all community submissions awaiting review.

```http
GET /api/moderator/moderation/list
```

#### Response: `200 OK`

```json
{
  "success": true,
  "submissions": [
    {
      "id": "sub-123",
      "type": "NEW_RECORD",
      "status": "PENDING",
      "submittedBy": "user_clerk_id",
      "proposedPayload": {
        "externalId": "C12345",
        "name": "محمد عبدالله",
        "gender": "MALE",
        "dateOfBirth": "1995-03-20",
        "dateOfDeath": "2024-10-01"
      },
      "reason": "Family member information",
      "createdAt": "2024-10-01T15:30:00.000Z",
      "baseVersion": null,
      "person": null
    },
    {
      "id": "sub-456",
      "type": "EDIT",
      "status": "PENDING",
      "submittedBy": "user_clerk_id",
      "personId": "person-uuid-123",
      "proposedPayload": {
        "dateOfDeath": "2024-10-02"
      },
      "reason": "Correcting death date",
      "createdAt": "2024-09-25T10:00:00.000Z",
      "baseVersion": {
        "versionNumber": 3,
        "name": "محمد أحمد",
        "dateOfDeath": "2024-10-01T00:00:00.000Z"
      },
      "person": {
        "id": "person-uuid-123",
        "externalId": "P12345",
        "name": "محمد أحمد",
        "confirmedByMoh": true
      }
    }
  ]
}
```

---

### 2. Approve Submission

Approve and apply a community submission.

```http
POST /api/moderator/moderation/{submissionId}/approve
```

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `submissionId` | UUID of the submission |

#### Request Body (Optional)

```json
{
  "note": "Approved - verified information"
}
```

#### Response: `200 OK`

```json
{
  "success": true,
  "message": "Submission approved",
  "personId": "person-uuid-123",
  "versionNumber": 4
}
```

#### What Happens

**New Record**:
- Creates new `Person` record
- Creates version 1 in `PersonVersion`
- Creates `ChangeSource` with type `COMMUNITY_SUBMISSION`
- Links submission to applied version

**Edit**:
- Updates existing `Person` record
- Creates new version in `PersonVersion`
- Links to new `ChangeSource`

---

### 3. Reject Submission

Reject a community submission.

```http
POST /api/moderator/moderation/{submissionId}/reject
```

#### Path Parameters

| Parameter | Description |
|-----------|-------------|
| `submissionId` | UUID of the submission |

#### Request Body (Required)

```json
{
  "note": "Insufficient evidence"
}
```

#### Response: `200 OK`

```json
{
  "success": true,
  "message": "Submission rejected"
}
```

---

### 4. View All Persons (with Filters)

Get all person records with advanced filtering.

```http
GET /api/moderator/persons
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `limit` | integer | `10` | Records per page (max: 100) |
| `filter` | string | - | Predefined filter |

#### Available Filters

| Filter | Description |
|--------|-------------|
| `reported_by_community` | Records submitted by community (not MoH confirmed) |
| `updated_by_community` | Records with UPDATE versions from community |
| `updated_by_moh` | Records with UPDATE versions from bulk uploads |
| `deleted_by_moh` | Soft-deleted records |

#### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "persons": [
      {
        "id": "person-uuid",
        "externalId": "P12345",
        "name": "محمد أحمد",
        "nameEnglish": "Mohammed Ahmed",
        "gender": "MALE",
        "dateOfBirth": "1990-05-15T00:00:00.000Z",
        "dateOfDeath": "2023-10-15T00:00:00.000Z",
        "locationOfDeathLat": 31.5,
        "locationOfDeathLng": 34.5,
        "photoUrlThumb": "https://...",
        "confirmedByMoh": true,
        "isDeleted": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-02-15T10:30:00.000Z",
        "currentVersion": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50000,
      "pages": 5000
    },
    "filter": "updated_by_community"
  }
}
```

**Note**: Unlike public endpoint, this includes:
- Deleted records (when filtered)
- `isDeleted` flag
- All sensitive fields

---

### 5. View Statistics (Full)

Get comprehensive database statistics.

```http
GET /api/moderator/stats
```

#### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "totalPersons": 50000,
    "totalDeceased": 48500,
    "totalAlive": 1500,
    "recentUploads": 234,
    "recordsReportedByCommunity": 215,
    "recordsDeletedByMoH": 42,
    "recordsUpdatedByCommunity": 125,
    "recordsUpdatedByMoH": 3450
  }
}
```

#### Statistics Explained

| Stat | Description |
|------|-------------|
| `totalPersons` | Active records (not deleted) |
| `totalDeceased` | Records with date of death |
| `totalAlive` | Records without date of death |
| `recentUploads` | Created in last 7 days |
| `recordsReportedByCommunity` | Community submissions (not MoH confirmed) |
| `recordsDeletedByMoH` | Soft-deleted records |
| `recordsUpdatedByCommunity` | Persons with UPDATE versions from community |
| `recordsUpdatedByMoH` | Persons with UPDATE versions from bulk uploads |

---

### 6. View Audit Logs

Get system audit logs.

```http
GET /api/moderator/audit-logs
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `50` | Number of logs to retrieve |

#### Response: `200 OK`

```json
{
  "success": true,
  "logs": [
    {
      "id": "log-uuid",
      "userId": "user_clerk_id",
      "userEmail": "admin@example.com",
      "action": "BULK_UPLOAD_APPLIED",
      "resourceType": "BULK_UPLOAD",
      "resourceId": "upload-uuid",
      "description": "Applied bulk upload: MOH Update 2024-10-06",
      "metadata": {
        "inserts": 150,
        "updates": 25,
        "deletes": 5
      },
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-10-06T10:30:00.000Z"
    },
    {
      "id": "log-uuid-2",
      "userId": "mod_clerk_id",
      "userEmail": "moderator@example.com",
      "action": "COMMUNITY_SUBMISSION_APPROVED",
      "resourceType": "COMMUNITY_SUBMISSION",
      "resourceId": "sub-uuid",
      "description": "Approved community submission for person P12345",
      "metadata": {
        "submissionType": "EDIT",
        "personId": "person-uuid"
      },
      "createdAt": "2024-10-05T14:20:00.000Z"
    }
  ]
}
```

#### Audit Action Types

| Action | Description |
|--------|-------------|
| `BULK_UPLOAD_APPLIED` | CSV upload applied |
| `BULK_UPLOAD_ROLLED_BACK` | Upload rolled back |
| `COMMUNITY_SUBMISSION_APPROVED` | Submission approved |
| `COMMUNITY_SUBMISSION_REJECTED` | Submission rejected |
| `DATABASE_CLEARED` | Database cleared |
| `USER_ROLE_CHANGED` | User role updated |

---

## Data Models

### Person

```typescript
interface Person {
  id: string;                    // UUID
  externalId: string;            // Unique ID (e.g., "P12345")
  name: string;                  // Arabic name
  nameEnglish: string | null;    // English name (optional)
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: Date | null;      // Birth date (nullable)
  dateOfDeath: Date | null;      // Death date (nullable)
  locationOfDeathLat: number | null;  // Latitude
  locationOfDeathLng: number | null;  // Longitude
  obituary: string | null;       // Obituary text
  photoUrlOriginal: string | null;    // Original photo URL
  photoUrlThumb: string | null;       // Thumbnail URL
  confirmedByMoh: boolean;       // MoH confirmed
  isDeleted: boolean;            // Soft delete flag
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### PersonVersion

```typescript
interface PersonVersion {
  id: string;                    // UUID
  personId: string;              // FK to Person
  versionNumber: number;         // Version number (1, 2, 3...)
  changeType: "INSERT" | "UPDATE" | "DELETE";
  sourceId: string;              // FK to ChangeSource
  
  // Snapshot of data at this version
  externalId: string;
  name: string;
  nameEnglish: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;
  locationOfDeathLat: number | null;
  locationOfDeathLng: number | null;
  obituary: string | null;
  photoUrlOriginal: string | null;
  photoUrlThumb: string | null;
  confirmedByMoh: boolean;
  isDeleted: boolean;
  createdAt: Date;
}
```

### CommunitySubmission

```typescript
interface CommunitySubmission {
  id: string;                    // UUID
  type: "NEW_RECORD" | "EDIT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";
  
  // For EDIT type
  personId: string | null;       // FK to Person
  baseVersionId: string | null;  // FK to PersonVersion
  
  // Proposed changes
  proposedPayload: object;       // JSON data
  reason: string | null;         // Submitter's explanation
  
  // Submission metadata
  submittedBy: string;           // Clerk user ID
  createdAt: Date;
  
  // Decision metadata
  approvedBy: string | null;     // Moderator user ID
  approvedAt: Date | null;
  decisionAction: "UPDATE" | "DELETE" | null;
  decisionNote: string | null;
  approvedChangeSourceId: string | null;
  appliedVersionId: string | null;
}
```

### BulkUpload

```typescript
interface BulkUpload {
  id: string;                    // UUID
  changeSourceId: string;        // FK to ChangeSource
  filename: string;              // Original filename
  label: string;                 // Description
  dateReleased: Date;            // When source data was published
  
  // Blob storage
  fileUrl: string;               // Vercel Blob URL
  fileSize: number;              // Bytes
  fileSha256: string;            // Hash for integrity
  contentType: string;           // MIME type
  previewLines: string | null;   // Gzipped preview
  
  uploadedAt: Date;
}
```

### AuditLog

```typescript
interface AuditLog {
  id: string;                    // UUID
  userId: string;                // Clerk user ID
  userEmail: string | null;      // User email (cached)
  action: string;                // Action type
  resourceType: string;          // Resource type
  resourceId: string | null;     // Resource ID
  description: string;           // Human-readable description
  metadata: object | null;       // Additional context (JSON)
  ipAddress: string | null;      // IP address
  createdAt: Date;
}
```

---

## Error Handling

### Standard Error Format

```json
{
  "error": "Human-readable error message",
  "details": "Optional additional information"
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Request successful |
| `201` | Created | Resource created |
| `400` | Bad Request | Invalid data |
| `401` | Unauthorized | Not authenticated |
| `403` | Forbidden | Wrong role |
| `404` | Not Found | Resource missing |
| `500` | Server Error | Server issue |

### Common Errors

#### 403 Forbidden (Wrong Role)

```json
{
  "error": "Unauthorized - requires admin role"
}
```

**Solution**: Check user's role in Clerk dashboard.

#### 400 Bad Request (Invalid CSV)

```json
{
  "error": "CSV parsing failed",
  "details": "Invalid date format in row 5"
}
```

**Solution**: Fix CSV data and retry.

#### 500 Server Error (Transaction Timeout)

```json
{
  "error": "Bulk upload failed",
  "details": "Transaction timeout - file too large"
}
```

**Solution**: Split large CSV files into smaller batches.

---

## Best Practices

### 1. Bulk Uploads

**Always simulate before applying:**

```typescript
// Step 1: Simulate
const simulation = await fetch('/api/admin/bulk-upload/simulate', {
  method: 'POST',
  body: formData
});

const { summary } = await simulation.json();

// Step 2: Review changes
console.log(`Will insert: ${summary.inserts}, update: ${summary.updates}`);

// Step 3: Confirm and apply
if (confirm('Apply these changes?')) {
  await fetch('/api/admin/bulk-upload/apply', {
    method: 'POST',
    body: formData
  });
}
```

### 2. Moderation Workflow

**Check submission details before approving:**

```typescript
async function reviewSubmission(submission) {
  if (submission.type === 'EDIT') {
    // Compare current vs proposed
    console.log('Current:', submission.baseVersion);
    console.log('Proposed:', submission.proposedPayload);
  }
  
  // Approve with note
  await fetch(`/api/moderator/moderation/${submission.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      note: 'Verified with additional sources'
    })
  });
}
```

### 3. Error Handling

**Always handle errors gracefully:**

```typescript
async function safeFetch(url, options) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    alert(`Error: ${error.message}`);
    throw error;
  }
}
```

### 4. Audit Logging

**All destructive actions are automatically logged:**
- Bulk uploads (apply/rollback)
- Database clearing
- Role changes
- Moderation decisions

Check `/api/moderator/audit-logs` to review actions.

---

## Prisma Accelerate Settings

**Recommended configuration for production:**

```
Max Response Size: 15 MiB
Query Timeout: 60 seconds
Transaction Timeout: 90 seconds
```

**Why these settings:**
- Bulk uploads can process 70,000+ records
- Large responses for filtered queries
- Complex transactions need time to complete

---

## Support

### Internal Team Contacts

- **Technical Issues**: Development team
- **Role Management**: System administrators
- **Training**: Documentation team

### Useful Resources

- [Clerk Dashboard](https://dashboard.clerk.com) - User management
- [Vercel Dashboard](https://vercel.com/dashboard) - Deployment & logs
- [Prisma Studio](http://localhost:5555) - Database GUI (development)

---

**Last Updated**: October 6, 2025  
**API Version**: 2.0.0  
**Status**: Production Ready ✅

