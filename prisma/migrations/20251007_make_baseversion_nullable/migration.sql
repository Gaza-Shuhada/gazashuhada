-- Make baseVersionId and personId nullable for NEW_RECORD submissions
-- NEW_RECORD submissions don't have a base version since they're creating new records

-- First, set any existing NULL values to a placeholder (shouldn't be any, but just in case)
-- For new records, these should just be NULL

-- Make the column nullable
ALTER TABLE "CommunitySubmission" ALTER COLUMN "baseVersionId" DROP NOT NULL;
ALTER TABLE "CommunitySubmission" ALTER COLUMN "personId" DROP NOT NULL;

