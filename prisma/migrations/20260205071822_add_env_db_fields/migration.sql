-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "providesDb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresEnv" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "dbConnection" TEXT,
ADD COLUMN     "envVars" TEXT;
