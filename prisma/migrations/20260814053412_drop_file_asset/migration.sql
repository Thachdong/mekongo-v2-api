/*
  Warnings:

  - You are about to drop the `file_assets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "file_assets" DROP CONSTRAINT "file_assets_accountId_fkey";

-- DropTable
DROP TABLE "file_assets";

-- DropEnum
DROP TYPE "EFileAssetStatus";
