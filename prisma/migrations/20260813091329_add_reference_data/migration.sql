-- CreateTable
CREATE TABLE "Province" (
    "codename" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("codename")
);

-- CreateTable
CREATE TABLE "District" (
    "codename" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceCodename" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("provinceCodename","codename")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "codename" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceCodename" TEXT NOT NULL,
    "districtCodename" TEXT NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ward_provinceCodename_districtCodename_idx" ON "Ward"("provinceCodename", "districtCodename");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_provinceCodename_fkey" FOREIGN KEY ("provinceCodename") REFERENCES "Province"("codename") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_provinceCodename_districtCodename_fkey" FOREIGN KEY ("provinceCodename", "districtCodename") REFERENCES "District"("provinceCodename", "codename") ON DELETE CASCADE ON UPDATE CASCADE;
