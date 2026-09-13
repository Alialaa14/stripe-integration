-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "brand" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "shippable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sku" TEXT,
ADD COLUMN "statementDescriptor" TEXT,
ADD COLUMN "taxCode" TEXT,
ADD COLUMN "slug" TEXT,
ADD COLUMN "unitLabel" TEXT,
ADD COLUMN "url" TEXT;

-- AlterTable
ALTER TABLE "Price"
ADD COLUMN "nickname" TEXT,
ADD COLUMN "taxBehavior" TEXT NOT NULL DEFAULT 'un_specified';

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- Convert tax behavior to enum
CREATE TYPE "TaxBehavior" AS ENUM ('inclusive', 'exclusive', 'un_specified');
ALTER TABLE "Price"
ALTER COLUMN "taxBehavior" DROP DEFAULT,
ALTER COLUMN "taxBehavior" TYPE "TaxBehavior"
USING "taxBehavior"::"TaxBehavior";
ALTER TABLE "Price"
ALTER COLUMN "taxBehavior" SET DEFAULT 'un_specified'::"TaxBehavior";