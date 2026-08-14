-- AlterEnum
BEGIN;
CREATE TYPE "EOtpPurpose_new" AS ENUM ('REGISTER', 'RESET_PASSWORD');
ALTER TABLE "OtpRequest" ALTER COLUMN "purpose" TYPE "EOtpPurpose_new" USING ("purpose"::text::"EOtpPurpose_new");
ALTER TYPE "EOtpPurpose" RENAME TO "EOtpPurpose_old";
ALTER TYPE "EOtpPurpose_new" RENAME TO "EOtpPurpose";
DROP TYPE "public"."EOtpPurpose_old";
COMMIT;
