# Public & Community API Documentation

> **Version**: 2.0.0  
> **Last Updated**: 2025-10-06  
> **For**: External developers building public-facing applications

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Public Endpoints](#public-endpoints)
4. [Community Endpoints](#community-endpoints)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Code Examples](#code-examples)

---

## Overview

This API provides public access to Gaza Death Toll data and allows authenticated users to contribute to the database through community submissions.

### Base URL

```
Production: https://gazadeathtoll-admin.vercel.app
Development: http://localhost:3000
```

### API Endpoints Summary

| Endpoint | Authentication | Purpose |
|----------|---------------|---------|
| `GET /api/public/persons` | None | List records with filtering |
| `GET /api/public/person/{id}` | None | Get single record |
| `GET /api/public/stats` | None | Get public statistics |
| `POST /api/community/submit` | Required | Submit new record or edit |
| `POST /api/community/upload-photo` | Required | Upload photo |
| `GET /api/community/my-submissions` | Required | View own submissions |

---

## Authentication

### Public Endpoints
**No authentication required**. These endpoints are fully open for public consumption.

### Community Endpoints
**Authentication required** using Clerk session cookies.

#### For Web Applications
```javascript
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';

// Wrap your app
<ClerkProvider>
  <SignedIn>
    {/* User is authenticated */}
  </SignedIn>
  <SignedOut>
    {/* Show sign-in */}
  </SignedOut>
</ClerkProvider>
```

#### For API Calls
When authenticated with Clerk, session cookies are automatically included in fetch requests from the same domain.

---

## Public Endpoints

### 1. List Person Records

Get a paginated list of person records with filtering.

```http
GET /api/public/persons
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `50` | Records per page (max: 100) |
| `search` | string | - | Search by name, nameEnglish, or externalId |
| `confirmedOnly` | boolean | `true` | Only show MoH confirmed records |
| `filter` | string | - | Apply predefined filter (see below) |

#### Available Filters

| Filter | Description |
|--------|-------------|
| `with_photo` | Only records with photos |
| `with_location` | Only records with death location coordinates |
| `recent` | Updated in last 30 days |
| `community_reported` | Community submissions (not MoH confirmed) |

#### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "persons": [
      {
        "id": "abc-123-uuid",
        "externalId": "P12345",
        "name": "محمد أحمد",
        "nameEnglish": "Mohammed Ahmed",
        "gender": "MALE",
        "dateOfBirth": "1990-05-15T00:00:00.000Z",
        "dateOfDeath": "2023-10-15T00:00:00.000Z",
        "locationOfDeathLat": 31.5,
        "locationOfDeathLng": 34.5,
        "photoUrlThumb": "https://blob.vercel-storage.com/.../thumb.webp",
        "confirmedByMoh": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-02-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 50000,
      "pages": 1000
    },
    "filters": {
      "search": null,
      "filter": "with_photo",
      "confirmedOnly": true
    }
  }
}
```

#### Data Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Internal database ID |
| `externalId` | string | Public ID (e.g., "P12345") |
| `name` | string | Name in Arabic |
| `nameEnglish` | string? | Name in English (if available) |
| `gender` | enum | `MALE`, `FEMALE`, or `OTHER` |
| `dateOfBirth` | ISO8601? | Birth date (nullable) |
| `dateOfDeath` | ISO8601? | Death date (nullable) |
| `locationOfDeathLat` | number? | Latitude of death location |
| `locationOfDeathLng` | number? | Longitude of death location |
| `photoUrlThumb` | string? | Thumbnail photo URL (512x512 WebP) |
| `confirmedByMoh` | boolean | Confirmed by Ministry of Health |
| `createdAt` | ISO8601 | Record creation timestamp |
| `updatedAt` | ISO8601 | Last update timestamp |

**Note**: Public endpoint does NOT expose:
- `obituary` (sensitive/long text)
- `photoUrlOriginal` (high-res images)
- `isDeleted` (internal field)

#### Example Requests

```bash
# Get first page of all records
curl https://gazadeathtoll-admin.vercel.app/api/public/persons

# Search for a name
curl "https://gazadeathtoll-admin.vercel.app/api/public/persons?search=mohammed&page=1&limit=20"

# Get records with photos
curl "https://gazadeathtoll-admin.vercel.app/api/public/persons?filter=with_photo&limit=100"

# Get community-reported records
curl "https://gazadeathtoll-admin.vercel.app/api/public/persons?confirmedOnly=false"

# Get recent updates
curl "https://gazadeathtoll-admin.vercel.app/api/public/persons?filter=recent"
```

---

### 2. Get Single Person Record

Get detailed information about a specific person.

```http
GET /api/public/person/{id}
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Person's UUID or externalId (e.g., "P12345") |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeHistory` | boolean | `false` | Include version history |

#### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "abc-123-uuid",
    "externalId": "P12345",
    "name": "محمد أحمد",
    "nameEnglish": "Mohammed Ahmed",
    "gender": "MALE",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "dateOfDeath": "2023-10-15T00:00:00.000Z",
    "locationOfDeathLat": 31.5,
    "locationOfDeathLng": 34.5,
    "photoUrlThumb": "https://blob.vercel-storage.com/.../thumb.webp",
    "confirmedByMoh": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-02-15T10:30:00.000Z",
    "history": [
      {
        "versionNumber": 1,
        "changeType": "INSERT",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "source": {
          "type": "BULK_UPLOAD",
          "description": "MOH Update 2024-01-05"
        }
      },
      {
        "versionNumber": 2,
        "changeType": "UPDATE",
        "createdAt": "2024-02-15T10:30:00.000Z",
        "source": {
          "type": "COMMUNITY_SUBMISSION",
          "description": null
        }
      }
    ]
  }
}
```

#### Response: `404 Not Found`

```json
{
  "error": "Person not found"
}
```

**Note**: Deleted records return 404 for privacy/security.

#### Example Requests

```bash
# Get by external ID
curl https://gazadeathtoll-admin.vercel.app/api/public/person/P12345

# Get by UUID with history
curl "https://gazadeathtoll-admin.vercel.app/api/public/person/abc-123-uuid?includeHistory=true"
```

---

### 3. Get Public Statistics

Get aggregate statistics about the database.

```http
GET /api/public/stats
```

#### Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "totalPersons": 50000,
    "totalDeceased": 48500,
    "confirmedByMoh": 47000,
    "lastUpdated": "2025-10-06T12:00:00.000Z"
  }
}
```

#### Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalPersons` | integer | Total active records (not deleted) |
| `totalDeceased` | integer | Records with date of death |
| `confirmedByMoh` | integer | MoH confirmed records |
| `lastUpdated` | ISO8601 | Timestamp of response |

#### Example Request

```bash
curl https://gazadeathtoll-admin.vercel.app/api/public/stats
```

---

## Community Endpoints

**All community endpoints require authentication.**

### 1. Submit New Record or Edit

Submit a new person record or suggest an edit to an existing record.

```http
POST /api/community/submit
```

#### Request Headers

```
Content-Type: application/json
Cookie: __clerk_session_... (automatically included)
```

#### Request Body: New Record

```json
{
  "type": "NEW_RECORD",
  "data": {
    "externalId": "C12345",
    "name": "محمد عبدالله",
    "gender": "MALE",
    "dateOfBirth": "1995-03-20",
    "dateOfDeath": "2024-10-01",
    "locationOfDeathLat": 31.5,
    "locationOfDeathLng": 34.5,
    "obituary": "Optional obituary text...",
    "photoUrlThumb": "https://blob.vercel-storage.com/.../thumb.webp",
    "photoUrlOriginal": "https://blob.vercel-storage.com/.../original.jpg"
  },
  "reason": "Personal knowledge - family member"
}
```

#### Request Body: Edit Existing Record

```json
{
  "type": "EDIT",
  "personId": "abc-123-uuid",
  "data": {
    "dateOfDeath": "2024-10-02",
    "locationOfDeathLat": 31.52,
    "locationOfDeathLng": 34.48,
    "obituary": "Updated obituary...",
    "photoUrlThumb": "https://blob.vercel-storage.com/.../new-thumb.webp",
    "photoUrlOriginal": "https://blob.vercel-storage.com/.../new-original.jpg"
  },
  "reason": "Correcting death date based on family information"
}
```

#### Field Requirements

**New Record** (`type: "NEW_RECORD"`):
- Required: `externalId`, `name`, `gender`
- Optional: `dateOfBirth`, `dateOfDeath`, `locationOfDeathLat`, `locationOfDeathLng`, `obituary`, `photoUrlThumb`, `photoUrlOriginal`

**Edit** (`type: "EDIT"`):
- Required: `personId`
- At least one of: `dateOfDeath`, `locationOfDeathLat`, `locationOfDeathLng`, `obituary`, `photoUrlThumb`, `photoUrlOriginal`

**Both**:
- `reason` (optional): Explanation for the submission

#### Response: `201 Created`

```json
{
  "success": true,
  "submissionId": "def-456-uuid",
  "message": "Submission received and pending review"
}
```

#### Response: `400 Bad Request`

```json
{
  "error": "Invalid submission data",
  "details": "Missing required field: name"
}
```

#### Response: `401 Unauthorized`

```json
{
  "error": "Unauthorized - not logged in"
}
```

#### Example Request (JavaScript)

```javascript
async function submitNewRecord(data, reason) {
  const response = await fetch('/api/community/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'NEW_RECORD',
      data,
      reason
    })
  });

  if (!response.ok) {
    throw new Error('Submission failed');
  }

  return await response.json();
}

// Usage
await submitNewRecord({
  externalId: 'C12345',
  name: 'محمد عبدالله',
  gender: 'MALE',
  dateOfBirth: '1995-03-20',
  dateOfDeath: '2024-10-01'
}, 'Family member information');
```

---

### 2. Upload Photo

Upload a photo for use in community submissions.

```http
POST /api/community/upload-photo
```

#### Request Headers

```
Content-Type: multipart/form-data
Cookie: __clerk_session_... (automatically included)
```

#### Request Body

```
photo: <file> (JPEG, PNG, WebP)
```

#### Response: `200 OK`

```json
{
  "success": true,
  "thumbUrl": "https://blob.vercel-storage.com/.../thumb-abc123.webp",
  "originalUrl": "https://blob.vercel-storage.com/.../original-abc123.jpg"
}
```

#### Response: `400 Bad Request`

```json
{
  "error": "No photo file provided"
}
```

#### Response: `401 Unauthorized`

```json
{
  "error": "Unauthorized - not logged in"
}
```

#### Image Processing

- **Thumbnail**: Resized to 512x512, converted to WebP
- **Original**: Resized to max 2048px width, JPEG/PNG preserved
- **Supported formats**: JPEG, PNG, WebP
- **Max file size**: 10MB (recommended)

#### Example Request (JavaScript)

```javascript
async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch('/api/community/upload-photo', {
    method: 'POST',
    body: formData // Don't set Content-Type, browser sets it automatically
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return await response.json();
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const { thumbUrl, originalUrl } = await uploadPhoto(file);
```

---

### 3. Get My Submissions

Get all submissions made by the current authenticated user.

```http
GET /api/community/my-submissions
```

#### Response: `200 OK`

```json
{
  "success": true,
  "submissions": [
    {
      "id": "sub-123-uuid",
      "type": "NEW_RECORD",
      "status": "PENDING",
      "proposedPayload": {
        "externalId": "C12345",
        "name": "محمد عبدالله",
        "gender": "MALE",
        "dateOfBirth": "1995-03-20",
        "dateOfDeath": "2024-10-01"
      },
      "reason": "Family member information",
      "createdAt": "2024-10-01T15:30:00.000Z",
      "approvedBy": null,
      "approvedAt": null,
      "decisionNote": null
    },
    {
      "id": "sub-456-uuid",
      "type": "EDIT",
      "status": "APPROVED",
      "personId": "abc-123-uuid",
      "proposedPayload": {
        "dateOfDeath": "2024-10-02"
      },
      "reason": "Correcting death date",
      "createdAt": "2024-09-25T10:00:00.000Z",
      "approvedBy": "mod-user-id",
      "approvedAt": "2024-09-26T08:30:00.000Z",
      "decisionNote": "Approved - verified information"
    }
  ]
}
```

#### Submission Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting moderator review |
| `APPROVED` | Accepted and applied to database |
| `REJECTED` | Rejected by moderator |
| `SUPERSEDED` | Replaced by a newer submission |

#### Response: `401 Unauthorized`

```json
{
  "error": "Unauthorized - not logged in"
}
```

#### Example Request (JavaScript)

```javascript
async function getMySubmissions() {
  const response = await fetch('/api/community/my-submissions');
  
  if (!response.ok) {
    throw new Error('Failed to fetch submissions');
  }

  const { submissions } = await response.json();
  return submissions;
}

// Usage
const submissions = await getMySubmissions();
console.log(`You have ${submissions.length} submissions`);
```

---

## Error Handling

### Standard Error Format

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "details": "Optional additional information"
}
```

### HTTP Status Codes

| Code | Meaning | When to Expect |
|------|---------|----------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `500` | Server Error | Internal server error |

### Error Handling Best Practices

```javascript
async function fetchWithErrorHandling(url, options) {
  try {
    const response = await fetch(url, options);
    
    // Parse response
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## Best Practices

### 1. Pagination

Always use pagination for list endpoints:

```javascript
// Good
async function fetchAllPersons() {
  let page = 1;
  let hasMore = true;
  const allPersons = [];
  
  while (hasMore) {
    const { data } = await fetch(`/api/public/persons?page=${page}&limit=100`);
    allPersons.push(...data.persons);
    hasMore = page < data.pagination.pages;
    page++;
  }
  
  return allPersons;
}
```

### 2. Search Optimization

Use debouncing for search inputs:

```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage
const searchTerm = useDebounce(inputValue, 500);
```

### 3. Caching

Cache public data that doesn't change frequently:

```javascript
const cache = new Map();

async function fetchWithCache(url, ttl = 60000) {
  const cached = cache.get(url);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetch(url).then(r => r.json());
  cache.set(url, { data, timestamp: Date.now() });
  
  return data;
}
```

### 4. Photo Upload Flow

Always upload photos before submitting:

```javascript
async function submitRecordWithPhoto(recordData, photoFile) {
  let photoUrls = {};
  
  // Step 1: Upload photo if provided
  if (photoFile) {
    const { thumbUrl, originalUrl } = await uploadPhoto(photoFile);
    photoUrls = { photoUrlThumb: thumbUrl, photoUrlOriginal: originalUrl };
  }
  
  // Step 2: Submit record with photo URLs
  return await submitNewRecord({
    ...recordData,
    ...photoUrls
  });
}
```

### 5. Authentication State

Always check authentication before showing community features:

```javascript
import { useUser } from '@clerk/nextjs';

function CommunityFeature() {
  const { isSignedIn, user } = useUser();
  
  if (!isSignedIn) {
    return <SignInPrompt />;
  }
  
  return <SubmissionForm />;
}
```

---

## Code Examples

### Complete React Component: Person List

```typescript
import { useState, useEffect } from 'react';

interface Person {
  id: string;
  externalId: string;
  name: string;
  nameEnglish?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  dateOfDeath?: string;
  photoUrlThumb?: string;
  confirmedByMoh: boolean;
}

export function PersonList() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPersons();
  }, [page, search]);

  async function fetchPersons() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search })
      });

      const response = await fetch(`/api/public/persons?${params}`);
      const { data } = await response.json();
      
      setPersons(data.persons);
    } catch (error) {
      console.error('Failed to fetch persons:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {persons.map(person => (
            <li key={person.id}>
              <h3>{person.name}</h3>
              {person.nameEnglish && <p>{person.nameEnglish}</p>}
              <p>ID: {person.externalId}</p>
              {person.photoUrlThumb && (
                <img src={person.photoUrlThumb} alt={person.name} />
              )}
            </li>
          ))}
        </ul>
      )}
      
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
}
```

### Complete React Component: Submit New Record

```typescript
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function SubmitRecordForm() {
  const { isSignedIn } = useUser();
  const [formData, setFormData] = useState({
    externalId: '',
    name: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: '',
    dateOfDeath: '',
    reason: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSignedIn) {
    return <div>Please sign in to submit records</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photoUrls = {};

      // Upload photo if provided
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        
        const photoResponse = await fetch('/api/community/upload-photo', {
          method: 'POST',
          body: formData
        });
        
        const { thumbUrl, originalUrl } = await photoResponse.json();
        photoUrls = {
          photoUrlThumb: thumbUrl,
          photoUrlOriginal: originalUrl
        };
      }

      // Submit record
      const response = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_RECORD',
          data: {
            ...formData,
            ...photoUrls
          },
          reason: formData.reason
        })
      });

      if (response.ok) {
        alert('Submission successful!');
        // Reset form
        setFormData({
          externalId: '',
          name: '',
          gender: 'MALE',
          dateOfBirth: '',
          dateOfDeath: '',
          reason: ''
        });
        setPhoto(null);
      } else {
        alert('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        required
        placeholder="External ID"
        value={formData.externalId}
        onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
      />
      
      <input
        required
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      <select
        value={formData.gender}
        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
      >
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
        <option value="OTHER">Other</option>
      </select>
      
      <input
        type="date"
        placeholder="Date of Birth"
        value={formData.dateOfBirth}
        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
      />
      
      <input
        type="date"
        placeholder="Date of Death"
        value={formData.dateOfDeath}
        onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
      />
      
      <textarea
        placeholder="Reason for submission"
        value={formData.reason}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
      />
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Record'}
      </button>
    </form>
  );
}
```

---

## Support

For questions or issues with the API:

1. Check this documentation first
2. Review error messages carefully
3. Check the browser console for detailed errors
4. Contact the development team

---

**Last Updated**: October 6, 2025  
**API Version**: 2.0.0  
**Status**: Production Ready ✅

