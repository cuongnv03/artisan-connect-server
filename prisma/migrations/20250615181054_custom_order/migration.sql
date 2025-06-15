-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customDescription" TEXT,
ADD COLUMN     "customOrderId" TEXT,
ADD COLUMN     "customTitle" TEXT,
ADD COLUMN     "isCustomOrder" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "OrderItem_customOrderId_idx" ON "OrderItem"("customOrderId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_customOrderId_fkey" FOREIGN KEY ("customOrderId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
