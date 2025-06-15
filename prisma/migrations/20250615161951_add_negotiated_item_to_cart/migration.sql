-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "negotiationId" TEXT;

-- AlterTable
ALTER TABLE "PaymentTransaction" ALTER COLUMN "currency" SET DEFAULT 'VND';

-- CreateIndex
CREATE INDEX "CartItem_negotiationId_idx" ON "CartItem"("negotiationId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "PriceNegotiation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
