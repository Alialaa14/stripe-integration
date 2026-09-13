-- Stripe may add cancellation reasons, so store them as text instead of a database enum.
ALTER TABLE "Payment"
ALTER COLUMN "cancellationReason" TYPE TEXT
USING "cancellationReason"::text;

ALTER TABLE "SetupIntent"
ALTER COLUMN "cancellationReason" TYPE TEXT
USING "cancellationReason"::text;

DROP TYPE "PaymentCancellationReason";

DROP TYPE "SetupIntentCancellationReason";