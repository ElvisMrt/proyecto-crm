-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paid" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PurchasePaymentDetail" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasePaymentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchasePaymentDetail_paymentId_idx" ON "PurchasePaymentDetail"("paymentId");

-- CreateIndex
CREATE INDEX "PurchasePaymentDetail_purchaseId_idx" ON "PurchasePaymentDetail"("purchaseId");

-- AddForeignKey
ALTER TABLE "PurchasePaymentDetail" ADD CONSTRAINT "PurchasePaymentDetail_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "SupplierPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePaymentDetail" ADD CONSTRAINT "PurchasePaymentDetail_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
