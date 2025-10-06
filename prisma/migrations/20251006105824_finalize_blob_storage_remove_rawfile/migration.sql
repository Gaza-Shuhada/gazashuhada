-- Finalize Blob storage migration: make fields required and drop rawFile
-- This migration removes backwards compatibility code

-- Step 1: Make Blob storage fields NOT NULL
ALTER TABLE "BulkUpload" ALTER COLUMN "fileUrl" SET NOT NULL;
ALTER TABLE "BulkUpload" ALTER COLUMN "fileSize" SET NOT NULL;
ALTER TABLE "BulkUpload" ALTER COLUMN "fileSha256" SET NOT NULL;
ALTER TABLE "BulkUpload" ALTER COLUMN "contentType" SET NOT NULL;

-- Step 2: Drop the legacy rawFile column
ALTER TABLE "BulkUpload" DROP COLUMN "rawFile";

