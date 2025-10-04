-- Add thumbnail and original photo URL columns to Person and PersonVersion
-- Generated manually to align prod with dev schema

ALTER TABLE "Person"
  ADD COLUMN IF NOT EXISTS "photoUrlOriginal" TEXT,
  ADD COLUMN IF NOT EXISTS "photoUrlThumb" TEXT;

ALTER TABLE "PersonVersion"
  ADD COLUMN IF NOT EXISTS "photoUrlOriginal" TEXT,
  ADD COLUMN IF NOT EXISTS "photoUrlThumb" TEXT;
