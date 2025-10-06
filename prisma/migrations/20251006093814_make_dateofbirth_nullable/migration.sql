-- AlterTable: Make dateOfBirth nullable in Person table
ALTER TABLE "Person" ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- AlterTable: Make dateOfBirth nullable in PersonVersion table
ALTER TABLE "PersonVersion" ALTER COLUMN "dateOfBirth" DROP NOT NULL;

