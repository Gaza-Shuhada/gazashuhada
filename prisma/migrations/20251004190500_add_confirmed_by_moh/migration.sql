-- Add confirmedByMoh columns to align DB with Prisma schema

ALTER TABLE "Person"
  ADD COLUMN IF NOT EXISTS "confirmedByMoh" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "PersonVersion"
  ADD COLUMN IF NOT EXISTS "confirmedByMoh" BOOLEAN NOT NULL DEFAULT FALSE;
