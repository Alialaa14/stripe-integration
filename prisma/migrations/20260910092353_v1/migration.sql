-- AlterTable
ALTER TABLE "StripeAccount" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "StripeAccount_userId_idx" ON "StripeAccount"("userId");

-- AddForeignKey
ALTER TABLE "StripeAccount" ADD CONSTRAINT "StripeAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
