-- Account owns shared profile fields (displayName/avatarUrl/trustScore),
-- Address moves from Profile to Account, Profile gains isActive.
-- Hand-written (not `prisma migrate dev`) to backfill existing rows instead of
-- dropping columns with data — see implementation-plans/account-and-profile.feature.md mục 0.

-- 1. Account: add shared fields (nullable for now, trustScore defaults to 100)
ALTER TABLE "Account" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 100;

-- 2. Backfill Account shared fields from each account's (currently sole) Profile row.
--    DISTINCT ON picks one deterministic Profile per account in case more than one exists.
UPDATE "Account" a
SET "displayName" = p."displayName",
    "avatarUrl" = p."avatarUrl",
    "trustScore" = p."trustScore"
FROM (
  SELECT DISTINCT ON ("accountId") "accountId", "displayName", "avatarUrl", "trustScore"
  FROM "Profile"
  ORDER BY "accountId", "createdAt" ASC
) p
WHERE p."accountId" = a.id;

-- 3. Profile: add isActive, default false
ALTER TABLE "Profile" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- 4. Backfill isActive: earliest profile per account becomes the active one
--    (preserves "exactly one active profile per account" invariant for existing data).
UPDATE "Profile" p
SET "isActive" = true
FROM (
  SELECT DISTINCT ON ("accountId") id
  FROM "Profile"
  ORDER BY "accountId", "createdAt" ASC
) active
WHERE p.id = active.id;

-- 5. Profile: drop columns moved to Account
ALTER TABLE "Profile" DROP COLUMN "avatarUrl",
DROP COLUMN "displayName",
DROP COLUMN "trustScore";

-- 6. Address: add accountId (nullable first, to backfill before dropping profileId)
ALTER TABLE "Address" ADD COLUMN     "accountId" TEXT;

-- 7. Backfill Address.accountId via the old profileId -> Profile.accountId chain
UPDATE "Address" ad
SET "accountId" = p."accountId"
FROM "Profile" p
WHERE p.id = ad."profileId";

-- 8. Drop old Profile FK + profileId column, make accountId required, add new FK
ALTER TABLE "Address" DROP CONSTRAINT "Address_profileId_fkey";
ALTER TABLE "Address" DROP COLUMN "profileId";
ALTER TABLE "Address" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "Address" ADD CONSTRAINT "Address_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
