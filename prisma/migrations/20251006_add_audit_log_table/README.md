# Migration: Add AuditLog Table

## Context
The `AuditLog` model was defined in the Prisma schema but was never migrated to the database. This caused errors when trying to create audit logs (e.g., when clearing the database).

## Changes
- Created the `AuditLog` table with all fields from the schema:
  - `id` (UUID primary key)
  - `userId` (Clerk user ID)
  - `userEmail` (cached email for display)
  - `action` (action type string)
  - `resourceType` (resource type string)
  - `resourceId` (UUID of affected resource)
  - `description` (human-readable description)
  - `metadata` (JSONB for additional context)
  - `ipAddress` (optional IP address)
  - `createdAt` (timestamp)

- Created indexes for:
  - `userId` + `createdAt` (for user activity history)
  - `resourceType` + `resourceId` (for resource audit trails)
  - `createdAt` (for time-based queries)
  - `action` (for filtering by action type)

## Date
2025-10-06

