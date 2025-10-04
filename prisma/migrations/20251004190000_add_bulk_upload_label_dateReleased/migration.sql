-- Add missing required columns to BulkUpload to align with schema
-- Columns are NOT NULL; safe for new/empty dev DBs

ALTER TABLE "BulkUpload"
  ADD COLUMN IF NOT EXISTS "label" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "dateReleased" TIMESTAMP(3) NOT NULL;
