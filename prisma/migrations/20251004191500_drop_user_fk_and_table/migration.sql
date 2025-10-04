-- Drop foreign keys to legacy User table (we use Clerk IDs directly)
ALTER TABLE "CommunitySubmission"
  DROP CONSTRAINT IF EXISTS "CommunitySubmission_submittedBy_fkey";

ALTER TABLE "CommunitySubmission"
  DROP CONSTRAINT IF EXISTS "CommunitySubmission_approvedBy_fkey";

-- Drop legacy User table if present
DROP TABLE IF EXISTS "User";
