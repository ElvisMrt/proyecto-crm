-- CreateTable
CREATE TABLE "NcfSequence" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "description" TEXT,
    "startRange" INTEGER NOT NULL,
    "endRange" INTEGER NOT NULL,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NcfSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NcfSequence_prefix_idx" ON "NcfSequence"("prefix");

-- CreateIndex
CREATE INDEX "NcfSequence_isActive_idx" ON "NcfSequence"("isActive");

-- CreateIndex
CREATE INDEX "NcfSequence_branchId_idx" ON "NcfSequence"("branchId");

-- CreateIndex
CREATE INDEX "NcfSequence_validUntil_idx" ON "NcfSequence"("validUntil");

-- AddForeignKey
ALTER TABLE "NcfSequence" ADD CONSTRAINT "NcfSequence_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
