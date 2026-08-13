-- AlterTable
ALTER TABLE "Address" DROP COLUMN "district";

-- CreateIndex
CREATE INDEX "Address_accountId_idx" ON "Address"("accountId");

