-- Add currentVersion field to Person table
-- This field stores the latest version number for each person
-- Default is 1 for new records

-- Step 1: Add the column with default value
ALTER TABLE "Person" ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;

-- Step 2: Populate existing records with their actual current version
-- Calculate the max version number for each person from PersonVersion table
UPDATE "Person" p
SET "currentVersion" = COALESCE(
  (SELECT MAX(v."versionNumber") 
   FROM "PersonVersion" v 
   WHERE v."personId" = p.id),
  1
);

