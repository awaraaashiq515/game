-- CreateEnum
CREATE TYPE "BrandApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "BrandApplication" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "category" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BrandApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandApplication_status_idx" ON "BrandApplication"("status");

-- CreateIndex
CREATE INDEX "BrandApplication_submittedAt_idx" ON "BrandApplication"("submittedAt");
