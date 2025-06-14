/*
  Warnings:

  - The `paymentMethod` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `paymentMethod` on the `PaymentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `mentionedProducts` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `categoryIds` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethods` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `paymentMethodType` to the `PaymentTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH_ON_DELIVERY');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_paymentMethodId_fkey";

-- DropIndex
DROP INDEX "Product_categoryIds_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethodType";

-- AlterTable
ALTER TABLE "PaymentTransaction" DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethodType" "PaymentMethodType" NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "mentionedProducts";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "categoryIds";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "paymentMethods";

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "PaymentMethod";

-- CreateTable
CREATE TABLE "PostProductMention" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "contextText" TEXT,
    "position" INTEGER,

    CONSTRAINT "PostProductMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryProduct" (
    "categoryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CategoryProduct_pkey" PRIMARY KEY ("categoryId","productId")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "holderName" TEXT,
    "bankName" TEXT,
    "accountLast4" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostProductMention_postId_idx" ON "PostProductMention"("postId");

-- CreateIndex
CREATE INDEX "PostProductMention_productId_idx" ON "PostProductMention"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PostProductMention_postId_productId_key" ON "PostProductMention"("postId", "productId");

-- CreateIndex
CREATE INDEX "CategoryProduct_categoryId_idx" ON "CategoryProduct"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryProduct_productId_idx" ON "CategoryProduct"("productId");

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "PaymentMethod_isDefault_idx" ON "PaymentMethod"("isDefault");

-- AddForeignKey
ALTER TABLE "PostProductMention" ADD CONSTRAINT "PostProductMention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostProductMention" ADD CONSTRAINT "PostProductMention_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryProduct" ADD CONSTRAINT "CategoryProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryProduct" ADD CONSTRAINT "CategoryProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
