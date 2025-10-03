# Gaza Deaths Database - API Documentation

> **Version**: 1.0.0  
> **Last Updated**: 2025-10-02

---

## Overview

This API provides access to the Gaza Deaths database for both the **Admin Control Panel** (this repo) and the **Public-Facing Web Application** (separate repo).

### Two Application Architecture

- **Admin Control Panel** (this repo): Internal staff tool for data management and moderation
- **Public Web Application** (separate repo): Public data consumption, search, filtering, and community submissions

**Both applications connect to the same PostgreSQL database.**

---

## Base URL

```
Production: https://api.gazadeaths.org (TBD)
Development: http://localhost:3000
```

---

## Authentication

### Admin Endpoints
- **Prefix**: `/api/admin/*`
- **Authentication**: Clerk session cookies
- **Authorization**: Role-based (admin, moderator, community)
- **Headers**: Automatically managed by Clerk SDK

### Public Endpoints
- **Prefix**: `/api/public/*`
- **Authentication**: 
  - Read operations: No auth required (public data)
  - Write operations (community submissions): Clerk auth or JWT tokens
- **Rate Limiting**: TBD (recommended: 100 requests/minute per IP)

---

## Public API Endpoints (For Public Webapp)

### 1. Get Person Records (Paginated)

Retrieve person records with filtering, sorting, and pagination.

```http
GET /api/public/persons
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 50, max: 100) |
| `sortBy` | string | No | Field to sort by: `name`, `dateOfBirth`, `dateOfDeath`, `createdAt`, `updatedAt` (default: `createdAt`) |
| `sortOrder` | string | No | `asc` or `desc` (default: `desc`) |
| `search` | string | No | Search by name or external ID |
| `gender` | string | No | Filter by gender: `MALE`, `FEMALE`, `OTHER` |
| `confirmedByMoh` | boolean | No | Filter by MoH confirmation status: `true`, `false` |
| `isDeleted` | boolean | No | Include deleted records: `true`, `false` (default: `false`) |
| `minAge` | integer | No | Minimum age at time of death |
| `maxAge` | integer | No | Maximum age at time of death |
| `dateOfDeathFrom` | date | No | Filter deaths from this date (YYYY-MM-DD) |
| `dateOfDeathTo` | date | No | Filter deaths to this date (YYYY-MM-DD) |
| `location` | string | No | Filter by location of death (partial match) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "externalId": "P12345",
      "name": "John Doe",
      "gender": "MALE",
      "dateOfBirth": "1990-05-15",
      "dateOfDeath": "2024-01-20",
      "locationOfDeath": "Gaza City",
      "obituary": "...",
      "photoUrl": "https://blob.vercel-storage.com/...",
      "confirmedByMoh": true,
      "isDeleted": false,
      "currentVersion": 3,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-02-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 42750,
    "pages": 855
  },
  "filters": {
    "appliedFilters": {
      "gender": "MALE",
      "confirmedByMoh": true
    }
  }
}
```

**Example Requests:**

```bash
# Get all records (first page)
GET /api/public/persons

# Search by name
GET /api/public/persons?search=Ahmad&page=1&limit=20

# Filter by gender and MoH status
GET /api/public/persons?gender=MALE&confirmedByMoh=true

# Get records by date range
GET /api/public/persons?dateOfDeathFrom=2024-01-01&dateOfDeathTo=2024-01-31

# Sort by name ascending
GET /api/public/persons?sortBy=name&sortOrder=asc
```

---

### 2. Get Person by ID

Retrieve detailed information about a specific person, including version history.

```http
GET /api/public/persons/{externalId}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `externalId` | string | The external ID of the person (e.g., P12345) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeHistory` | boolean | No | Include version history (default: false) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "externalId": "P12345",
    "name": "John Doe",
    "gender": "MALE",
    "dateOfBirth": "1990-05-15",
    "dateOfDeath": "2024-01-20",
    "locationOfDeath": "Gaza City",
    "obituary": "...",
    "photoUrl": "https://blob.vercel-storage.com/...",
    "confirmedByMoh": true,
    "isDeleted": false,
    "currentVersion": 3,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-02-15T10:30:00Z",
    "history": [
      {
        "versionNumber": 1,
        "changeType": "INSERT",
        "confirmedByMoh": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "source": {
          "type": "COMMUNITY_SUBMISSION",
          "description": "Community-submitted new record"
        }
      },
      {
        "versionNumber": 2,
        "changeType": "UPDATE",
        "confirmedByMoh": false,
        "createdAt": "2024-01-15T10:00:00Z",
        "source": {
          "type": "COMMUNITY_SUBMISSION",
          "description": "Community-submitted edit"
        },
        "changes": ["dateOfDeath", "locationOfDeath"]
      },
      {
        "versionNumber": 3,
        "changeType": "UPDATE",
        "confirmedByMoh": true,
        "createdAt": "2024-02-15T10:30:00Z",
        "source": {
          "type": "BULK_UPLOAD",
          "description": "MoH Official Data - February 2024"
        }
      }
    ]
  }
}
```

---

### 3. Get Statistics

Retrieve aggregate statistics about the database.

```http
GET /api/public/stats
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupBy` | string | No | Group statistics by: `gender`, `ageGroup`, `location`, `month` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "total": 42750,
    "confirmed": 40123,
    "communitySubmitted": 2627,
    "byGender": {
      "MALE": 25650,
      "FEMALE": 15100,
      "OTHER": 2000
    },
    "byAgeGroup": {
      "0-10": 8550,
      "11-20": 6800,
      "21-30": 9200,
      "31-40": 7500,
      "41-50": 5400,
      "51+": 5300
    },
    "lastUpdated": "2024-02-15T10:30:00Z"
  }
}
```

---

### 4. Submit Community Contribution (New Record)

Submit a new person record for moderation.

```http
POST /api/public/community/submit
```

**Authentication:** Required (Clerk or JWT)

**Request Body:**

```json
{
  "type": "NEW_RECORD",
  "proposedPayload": {
    "externalId": "P99999",
    "name": "Ahmad Hassan",
    "gender": "MALE",
    "dateOfBirth": "1995-03-10",
    "dateOfDeath": "2024-01-15",
    "locationOfDeath": "Rafah",
    "obituary": "...",
    "photoUrl": "https://blob.vercel-storage.com/..."
  },
  "reason": "Personal knowledge - family member"
}
```

**Validation Rules:**

- **Required fields**: `externalId`, `name`, `gender`, `dateOfBirth`
- **Optional fields**: `dateOfDeath`, `locationOfDeath`, `obituary`, `photoUrl`
- `gender` must be: `MALE`, `FEMALE`, or `OTHER`
- `dateOfBirth` must be in format: `YYYY-MM-DD`
- `externalId` must not already exist in the database
- Photos must be uploaded to Vercel Blob first, then URL provided

**Response:** `201 Created`

```json
{
  "success": true,
  "submission": {
    "id": "uuid",
    "type": "NEW_RECORD",
    "status": "PENDING",
    "createdAt": "2024-10-02T10:00:00Z"
  },
  "message": "Submission received and will be reviewed by moderators"
}
```

**Error Response:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Person with this External ID already exists. Use EDIT instead."
}
```

---

### 5. Submit Community Contribution (Edit)

Propose an edit to an existing person record.

```http
POST /api/public/community/submit
```

**Authentication:** Required (Clerk or JWT)

**Request Body:**

```json
{
  "type": "EDIT",
  "externalId": "P12345",
  "proposedPayload": {
    "dateOfDeath": "2024-01-20",
    "locationOfDeath": "Gaza City",
    "obituary": "Updated information...",
    "photoUrl": "https://blob.vercel-storage.com/..."
  },
  "reason": "Correcting location based on family confirmation"
}
```

**Validation Rules:**

- **Required**: `externalId` (must exist in database)
- **Editable fields**: Only `dateOfDeath`, `locationOfDeath`, `obituary`, `photoUrl`
- **Immutable fields**: `name`, `gender`, `dateOfBirth` (cannot be edited via community submissions)
- At least one field must be provided
- Person record must exist

**Response:** `201 Created`

```json
{
  "success": true,
  "submission": {
    "id": "uuid",
    "type": "EDIT",
    "status": "PENDING",
    "personId": "uuid",
    "createdAt": "2024-10-02T10:00:00Z"
  },
  "message": "Edit proposal submitted for moderation"
}
```

---

### 6. Get My Submissions

Retrieve submission history for the authenticated user.

```http
GET /api/public/community/my-submissions
```

**Authentication:** Required (Clerk or JWT)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `PENDING`, `APPROVED`, `REJECTED`, `SUPERSEDED` |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Results per page (default: 20) |

**Response:** `200 OK`

```json
{
  "success": true,
  "submissions": [
    {
      "id": "uuid",
      "type": "NEW_RECORD",
      "status": "APPROVED",
      "proposedPayload": {
        "externalId": "P99999",
        "name": "Ahmad Hassan"
      },
      "reason": "Personal knowledge - family member",
      "submittedAt": "2024-10-01T10:00:00Z",
      "approvedAt": "2024-10-02T09:30:00Z",
      "decisionNote": "Verified and approved"
    },
    {
      "id": "uuid",
      "type": "EDIT",
      "status": "REJECTED",
      "personId": "uuid",
      "proposedPayload": {
        "dateOfDeath": "2024-01-20"
      },
      "reason": "Date correction",
      "submittedAt": "2024-09-28T14:00:00Z",
      "approvedAt": "2024-09-29T10:00:00Z",
      "decisionNote": "Insufficient evidence for date change"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### 7. Upload Photo

Upload a photo to Vercel Blob storage.

```http
POST /api/public/community/upload-photo
```

**Authentication:** Required (Clerk or JWT)

**Request:** `multipart/form-data`

```
photo: [file] (max 10MB, formats: jpg, jpeg, png, webp)
```

**Response:** `200 OK`

```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/xyz123.webp",
  "dimensions": {
    "width": 2048,
    "height": 2048
  },
  "size": 245678
}
```

**Processing:**
- Automatically resized to max 2048x2048px
- Maintains aspect ratio
- Converted to WebP format for optimal compression
- Original aspect ratio preserved

---

## Admin API Endpoints (Control Panel Only)

These endpoints are for the admin control panel and should NOT be exposed to the public webapp.

### Bulk Upload Endpoints

```http
POST /api/admin/bulk-upload/simulate
POST /api/admin/bulk-upload/apply
GET  /api/admin/bulk-upload/list
POST /api/admin/bulk-upload/{id}/rollback
```

### Moderation Endpoints

```http
GET  /api/admin/moderation/list
POST /api/admin/moderation/{id}/approve
POST /api/admin/moderation/{id}/reject
```

### Audit Log Endpoints

```http
GET /api/admin/audit-logs
```

### Records Management

```http
GET /api/persons (Staff only - returns all records including deleted)
GET /api/stats (Staff only - includes sensitive stats)
```

---

## Data Models

### Person

```typescript
{
  id: string;                    // UUID
  externalId: string;            // Unique identifier (e.g., P12345)
  name: string;                  // Full name
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;           // ISO 8601 date
  dateOfDeath: string | null;    // ISO 8601 date
  locationOfDeath: string | null;
  obituary: string | null;
  photoUrl: string | null;       // Vercel Blob URL
  confirmedByMoh: boolean;       // true = bulk upload, false = community
  isDeleted: boolean;
  currentVersion: number;        // Current version number
  createdAt: string;             // ISO 8601 datetime
  updatedAt: string;             // ISO 8601 datetime
}
```

### Community Submission

```typescript
{
  id: string;                    // UUID
  type: "NEW_RECORD" | "EDIT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUPERSEDED";
  personId: string | null;       // NULL for NEW_RECORD
  proposedPayload: object;       // Proposed changes
  reason: string | null;         // Submitter's explanation
  submittedBy: string;           // User ID
  submittedAt: string;           // ISO 8601 datetime
  approvedBy: string | null;     // Moderator user ID
  approvedAt: string | null;     // ISO 8601 datetime
  decisionNote: string | null;   // Moderator's note
}
```

---

## Error Responses

All endpoints follow this error format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Implementation Status

### ✅ Implemented (Available Now)

- Community submission endpoints (`POST /api/community/submit`, `GET /api/community/my-submissions`)
- Admin moderation endpoints
- Staff records browser (`GET /api/persons` - staff only)
- Audit logs

### 🚧 To Be Implemented (For Public Webapp)

- `GET /api/public/persons` - Public records query with filtering/pagination
- `GET /api/public/persons/{externalId}` - Single person with history
- `GET /api/public/stats` - Public statistics
- `POST /api/public/community/upload-photo` - Photo upload
- Rate limiting and caching
- Public API authentication (JWT or API keys)

---

## Rate Limiting (Recommended)

| Endpoint Type | Rate Limit |
|---------------|------------|
| Read operations (public) | 100 requests/minute per IP |
| Write operations (submissions) | 10 requests/minute per user |
| Photo uploads | 5 requests/minute per user |
| Search queries | 30 requests/minute per IP |

---

## Caching Strategy (Recommended)

| Endpoint | Cache Duration | Invalidation |
|----------|----------------|--------------|
| `GET /api/public/persons` | 5 minutes | On bulk upload or approval |
| `GET /api/public/persons/{id}` | 10 minutes | On record update |
| `GET /api/public/stats` | 15 minutes | On bulk upload |

---

## Security Considerations

### Public API Access
1. **CORS**: Configure allowed origins for public webapp
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Sanitize all user inputs
4. **SQL Injection**: Use parameterized queries (Prisma handles this)
5. **Authentication**: Clerk for community submissions

### Photo Uploads
1. **File Type Validation**: Only jpg, png, webp allowed
2. **Size Limits**: Max 10MB
3. **Malware Scanning**: Consider integration
4. **CDN**: Use Vercel Blob with CDN for performance

### Data Privacy
1. **No PII in URLs**: Don't expose database IDs in public URLs (use externalId)
2. **Audit Logging**: Log all data modifications
3. **GDPR Compliance**: Allow data export/deletion requests

---

## Development Setup

### 1. Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Vercel Blob (for photos)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"
RATE_LIMIT_ENABLED="true"
```

### 2. Running Locally

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### 3. Testing API Endpoints

```bash
# Test public persons endpoint (when implemented)
curl http://localhost:3000/api/public/persons?page=1&limit=10

# Test community submission (requires auth)
curl -X POST http://localhost:3000/api/community/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "NEW_RECORD",
    "proposedPayload": {
      "externalId": "P99999",
      "name": "Test Person",
      "gender": "MALE",
      "dateOfBirth": "1990-01-01"
    }
  }'
```

---

## Support & Contact

- **Documentation Issues**: Open an issue in the repository
- **API Questions**: Contact the development team
- **Security Concerns**: security@gazadeaths.org (TBD)

---

## Changelog

### Version 1.0.0 (2024-10-02)
- Initial API documentation
- Community submission endpoints implemented
- Public query endpoints designed (not yet implemented)
- Photo upload specification defined


