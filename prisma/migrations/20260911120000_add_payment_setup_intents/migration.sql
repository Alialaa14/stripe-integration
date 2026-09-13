-- CreateEnum
CREATE TYPE "CaptureMethod" AS ENUM ('automatic', 'automatic_async', 'manual');

-- CreateEnum
CREATE TYPE "ConfirmationMethod" AS ENUM ('automatic', 'manual');

-- CreateEnum
CREATE TYPE "SetupFutureUsage" AS ENUM ('on_session', 'off_session');

-- CreateEnum
CREATE TYPE "PaymentCancellationReason" AS ENUM ('duplicate', 'fraudulent', 'requested_by_customer', 'abandoned');

-- CreateEnum
CREATE TYPE "SetupIntentStatus" AS ENUM ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'canceled', 'succeeded');

-- CreateEnum
CREATE TYPE "SetupIntentUsage" AS ENUM ('on_session', 'off_session');

-- CreateEnum
CREATE TYPE "SetupIntentCancellationReason" AS ENUM ('abandoned', 'requested_by_customer', 'duplicate');

-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "paymentMethodId" TEXT,
ADD COLUMN "captureMethod" "CaptureMethod" NOT NULL DEFAULT 'automatic',
ADD COLUMN "confirmationMethod" "ConfirmationMethod" NOT NULL DEFAULT 'automatic',
ADD COLUMN "setupFutureUsage" "SetupFutureUsage",
ADD COLUMN "receiptEmail" TEXT,
ADD COLUMN "statementDescriptor" TEXT,
ADD COLUMN "cancellationReason" "PaymentCancellationReason";

-- CreateTable
CREATE TABLE "SetupIntent" (
    "id" TEXT NOT NULL,
    "stripeSetupIntentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "paymentMethodId" TEXT,
    "status" "SetupIntentStatus" NOT NULL,
    "usage" "SetupIntentUsage" NOT NULL DEFAULT 'off_session',
    "description" TEXT,
    "cancellationReason" "SetupIntentCancellationReason",
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetupIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SetupIntent_stripeSetupIntentId_key" ON "SetupIntent"("stripeSetupIntentId");

-- AddForeignKey
ALTER TABLE "SetupIntent" ADD CONSTRAINT "SetupIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupIntent" ADD CONSTRAINT "SetupIntent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "StripeCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
