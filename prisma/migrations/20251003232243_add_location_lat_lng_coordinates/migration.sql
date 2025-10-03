-- AlterTable
ALTER TABLE "Person" ADD COLUMN "locationOfDeathLat" DOUBLE PRECISION,
ADD COLUMN "locationOfDeathLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PersonVersion" ADD COLUMN "locationOfDeathLat" DOUBLE PRECISION,
ADD COLUMN "locationOfDeathLng" DOUBLE PRECISION;

