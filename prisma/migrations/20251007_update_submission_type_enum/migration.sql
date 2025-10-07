-- Update SubmissionType enum: Add NEW_RECORD value
-- This migration updates the enum to match the current schema
-- Note: PostgreSQL requires enum additions in separate transactions

-- Add NEW_RECORD if it doesn't exist
ALTER TYPE "SubmissionType" ADD VALUE IF NOT EXISTS 'NEW_RECORD';

