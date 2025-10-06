-- Move BulkUpload.rawFile to Blob storage
-- This migration replaces the Bytes column with Blob storage references

-- Step 1: Add new columns (nullable initially to allow for data migration)
ALTER TABLE "BulkUpload" ADD COLUMN "fileUrl" TEXT;
ALTER TABLE "BulkUpload" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "BulkUpload" ADD COLUMN "fileSha256" TEXT;
ALTER TABLE "BulkUpload" ADD COLUMN "contentType" TEXT DEFAULT 'text/csv';
ALTER TABLE "BulkUpload" ADD COLUMN "previewLines" TEXT;

-- Step 2: After data migration script runs, we'll make required fields NOT NULL
-- (This will be done in a follow-up migration after backfill is complete)

-- Note: Do NOT drop rawFile column yet - it will be used for backfilling
-- The rawFile column will be dropped in a future migration after all data is migrated

