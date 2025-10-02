-- AlterTable PersonVersion: Add changeType column with default
ALTER TABLE "PersonVersion" ADD COLUMN "changeType" "ChangeType" NOT NULL DEFAULT 'INSERT';

-- Data Migration: Set changeType based on isDeleted flag
-- If a version has isDeleted = true, it represents a DELETE operation
-- Otherwise, if versionNumber = 1, it's an INSERT, else it's an UPDATE
UPDATE "PersonVersion" 
SET "changeType" = 
  CASE 
    WHEN "isDeleted" = true THEN 'DELETE'::"ChangeType"
    WHEN "versionNumber" = 1 THEN 'INSERT'::"ChangeType"
    ELSE 'UPDATE'::"ChangeType"
  END;

-- DropIndex: Remove old indexes before adding new ones
DROP INDEX IF EXISTS "PersonVersion_personId_idx";
DROP INDEX IF EXISTS "PersonVersion_sourceId_idx";

-- CreateIndex: Add unique constraint for personId + versionNumber
CREATE UNIQUE INDEX "PersonVersion_personId_versionNumber_key" ON "PersonVersion"("personId", "versionNumber");

-- CreateIndex: Add optimized indexes
CREATE INDEX "PersonVersion_personId_idx" ON "PersonVersion"("personId");
CREATE INDEX "PersonVersion_sourceId_idx" ON "PersonVersion"("sourceId");
CREATE INDEX "PersonVersion_sourceId_changeType_idx" ON "PersonVersion"("sourceId", "changeType");
CREATE INDEX "PersonVersion_createdAt_idx" ON "PersonVersion"("createdAt");

-- AlterTable ChangeSource: Drop changeType column (no longer needed at source level)
ALTER TABLE "ChangeSource" DROP COLUMN "changeType";

-- Note: Not dropping User table as it has foreign key dependencies
-- It's not managed by this schema but exists in the database

