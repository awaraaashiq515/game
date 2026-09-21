-- CreateTable
CREATE TABLE "AdminWallet" (
    "id" TEXT NOT NULL,
    "totalFundsAdded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithdrawnByUsers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availablePool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminWalletTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminWalletTransaction_type_idx" ON "AdminWalletTransaction"("type");

-- CreateIndex
CREATE INDEX "AdminWalletTransaction_createdAt_idx" ON "AdminWalletTransaction"("createdAt");
