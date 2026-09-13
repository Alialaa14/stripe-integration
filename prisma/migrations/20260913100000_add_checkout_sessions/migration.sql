-- CreateEnum
CREATE TYPE "CheckoutSessionStatus" AS ENUM ('open', 'complete', 'expired');

-- CreateEnum
CREATE TYPE "CheckoutMode" AS ENUM ('payment', 'subscription', 'setup');

-- CreateTable
CREATE TABLE "CheckoutSession" (
    "id" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "CheckoutSessionStatus" NOT NULL DEFAULT 'open',
    "mode" "CheckoutMode" NOT NULL DEFAULT 'payment',
    "currency" TEXT,
    "amountTotal" INTEGER,
    "url" TEXT,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutSessionItem" (
    "id" TEXT NOT NULL,
    "checkoutSessionId" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutSessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutSession_stripeCheckoutSessionId_key" ON "CheckoutSession"("stripeCheckoutSessionId");
CREATE INDEX "CheckoutSession_userId_createdAt_idx" ON "CheckoutSession"("userId", "createdAt");
CREATE UNIQUE INDEX "CheckoutSessionItem_checkoutSessionId_priceId_key" ON "CheckoutSessionItem"("checkoutSessionId", "priceId");

-- AddForeignKey
ALTER TABLE "CheckoutSession" ADD CONSTRAINT "CheckoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckoutSession" ADD CONSTRAINT "CheckoutSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "StripeCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CheckoutSessionItem" ADD CONSTRAINT "CheckoutSessionItem_checkoutSessionId_fkey" FOREIGN KEY ("checkoutSessionId") REFERENCES "CheckoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckoutSessionItem" ADD CONSTRAINT "CheckoutSessionItem_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;