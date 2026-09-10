-- CreateTable
CREATE TABLE "StripeAccount" (
    "id" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "displayName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "dashboard" TEXT,
    "appliedConfigurations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "configuration" JSONB,
    "defaults" JSONB,
    "identity" JSONB,
    "requirements" JSONB,
    "metadata" JSONB,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeAccount_stripeAccountId_key" ON "StripeAccount"("stripeAccountId");
