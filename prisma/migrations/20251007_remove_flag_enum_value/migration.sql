-- Remove FLAG from SubmissionType enum
-- PostgreSQL doesn't support dropping enum values, so we need to recreate the enum

-- Step 1: Check if any records use FLAG (should update them first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "CommunitySubmission" WHERE "type" = 'FLAG') THEN
    -- Update any FLAG records to NEW_RECORD
    UPDATE "CommunitySubmission" SET "type" = 'NEW_RECORD' WHERE "type" = 'FLAG';
    RAISE NOTICE 'Updated % records from FLAG to NEW_RECORD', (SELECT COUNT(*) FROM "CommunitySubmission" WHERE "type" = 'NEW_RECORD');
  END IF;
END $$;

-- Step 2: Create new enum type without FLAG
CREATE TYPE "SubmissionType_new" AS ENUM ('NEW_RECORD', 'EDIT');

-- Step 3: Alter the column to use the new enum
ALTER TABLE "CommunitySubmission" 
  ALTER COLUMN "type" TYPE "SubmissionType_new" 
  USING ("type"::text::"SubmissionType_new");

-- Step 4: Drop the old enum
DROP TYPE "SubmissionType";

-- Step 5: Rename the new enum to the original name
ALTER TYPE "SubmissionType_new" RENAME TO "SubmissionType";

