-- AlterTable
ALTER TABLE "PriceNegotiation" ADD COLUMN     "variantId" TEXT;

-- AddForeignKey
ALTER TABLE "PriceNegotiation" ADD CONSTRAINT "PriceNegotiation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
