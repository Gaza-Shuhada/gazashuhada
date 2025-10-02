-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COMMUNITY', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ChangeSourceType" AS ENUM ('BULK_UPLOAD', 'COMMUNITY_SUBMISSION', 'MANUAL_EDIT');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('FLAG', 'EDIT');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "DecisionAction" AS ENUM ('UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMUNITY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "dateOfDeath" TIMESTAMP(3),
    "locationOfDeath" TEXT,
    "obituary" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonVersion" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "dateOfDeath" TIMESTAMP(3),
    "locationOfDeath" TEXT,
    "obituary" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeSource" (
    "id" TEXT NOT NULL,
    "type" "ChangeSourceType" NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkUpload" (
    "id" TEXT NOT NULL,
    "changeSourceId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rawFile" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunitySubmission" (
    "id" TEXT NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "baseVersionId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "proposedPayload" JSONB,
    "reason" TEXT,
    "submittedBy" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "decisionAction" "DecisionAction",
    "decisionNote" TEXT,
    "approvedChangeSourceId" TEXT,
    "appliedVersionId" TEXT,

    CONSTRAINT "CommunitySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Person_externalId_key" ON "Person"("externalId");

-- CreateIndex
CREATE INDEX "PersonVersion_personId_idx" ON "PersonVersion"("personId");

-- CreateIndex
CREATE INDEX "PersonVersion_sourceId_idx" ON "PersonVersion"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "BulkUpload_changeSourceId_key" ON "BulkUpload"("changeSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunitySubmission_approvedChangeSourceId_key" ON "CommunitySubmission"("approvedChangeSourceId");

-- CreateIndex
CREATE INDEX "CommunitySubmission_personId_idx" ON "CommunitySubmission"("personId");

-- CreateIndex
CREATE INDEX "CommunitySubmission_baseVersionId_idx" ON "CommunitySubmission"("baseVersionId");

-- CreateIndex
CREATE INDEX "CommunitySubmission_status_idx" ON "CommunitySubmission"("status");

-- AddForeignKey
ALTER TABLE "PersonVersion" ADD CONSTRAINT "PersonVersion_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonVersion" ADD CONSTRAINT "PersonVersion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ChangeSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkUpload" ADD CONSTRAINT "BulkUpload_changeSourceId_fkey" FOREIGN KEY ("changeSourceId") REFERENCES "ChangeSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySubmission" ADD CONSTRAINT "CommunitySubmission_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "PersonVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySubmission" ADD CONSTRAINT "CommunitySubmission_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySubmission" ADD CONSTRAINT "CommunitySubmission_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySubmission" ADD CONSTRAINT "CommunitySubmission_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySubmission" ADD CONSTRAINT "CommunitySubmission_approvedChangeSourceId_fkey" FOREIGN KEY ("approvedChangeSourceId") REFERENCES "ChangeSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySubmission" ADD CONSTRAINT "CommunitySubmission_appliedVersionId_fkey" FOREIGN KEY ("appliedVersionId") REFERENCES "PersonVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
