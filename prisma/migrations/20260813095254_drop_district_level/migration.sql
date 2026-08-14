/*
  Warnings:

  - You are about to drop the column `districtCodename` on the `Ward` table. All the data in the column will be lost.
  - You are about to drop the `District` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "District" DROP CONSTRAINT "District_provinceCodename_fkey";

-- DropForeignKey
ALTER TABLE "Ward" DROP CONSTRAINT "Ward_provinceCodename_districtCodename_fkey";

-- DropIndex
DROP INDEX "Ward_provinceCodename_districtCodename_idx";

-- AlterTable
ALTER TABLE "Ward" DROP COLUMN "districtCodename";

-- DropTable
DROP TABLE "District";

-- CreateIndex
CREATE INDEX "Ward_provinceCodename_idx" ON "Ward"("provinceCodename");

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_provinceCodename_fkey" FOREIGN KEY ("provinceCodename") REFERENCES "Province"("codename") ON DELETE CASCADE ON UPDATE CASCADE;
