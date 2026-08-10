-- CreateEnum
CREATE TYPE "EOtpPurpose" AS ENUM ('REGISTER', 'RESET_PASSWORD', 'CHANGE_PASSWORD');

-- CreateTable
CREATE TABLE "OtpRequest" (
    "id" TEXT NOT NULL,
    "purpose" "EOtpPurpose" NOT NULL,
    "accountId" TEXT,
    "identifier" TEXT,
    "codeHash" TEXT NOT NULL,
    "wrongAttempts" INTEGER NOT NULL DEFAULT 0,
    "resendAttempts" INTEGER NOT NULL DEFAULT 0,
    "consumeAt" TIMESTAMP(3),
    "blockedUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resetTokenHash" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpRequest_accountId_idx" ON "OtpRequest"("accountId");

-- CreateIndex
CREATE INDEX "OtpRequest_identifier_idx" ON "OtpRequest"("identifier");
