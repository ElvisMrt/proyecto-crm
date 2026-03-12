-- CreateEnum
CREATE TYPE "LoanProductType" AS ENUM ('CASH_LOAN', 'FINANCED_SALE');

-- CreateEnum
CREATE TYPE "LoanAmortizationMethod" AS ENUM ('FIXED_PAYMENT', 'FIXED_PRINCIPAL', 'INTEREST_ONLY');

-- CreateEnum
CREATE TYPE "LoanPaymentStatus" AS ENUM ('POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "LoanAllocationConcept" AS ENUM ('LATE_FEE', 'FEE', 'INTEREST', 'PRINCIPAL');

-- CreateEnum
CREATE TYPE "LoanEventType" AS ENUM ('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'PAYMENT_POSTED', 'PAYMENT_REVERSED', 'RESTRUCTURED', 'PAID_OFF', 'WRITTEN_OFF', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanDocumentType" AS ENUM ('CONTRACT', 'DISBURSEMENT_RECEIPT', 'PAYMENT_RECEIPT', 'STATEMENT', 'SUPPORT');

-- Replace LoanInstallmentStatus enum to support transactional migration
CREATE TYPE "LoanInstallmentStatus_new" AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'RESTRUCTURED',
    'CANCELLED'
);

ALTER TABLE "LoanInstallment"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "LoanInstallment"
ALTER COLUMN "status" TYPE "LoanInstallmentStatus_new"
USING ("status"::text::"LoanInstallmentStatus_new");

ALTER TYPE "LoanInstallmentStatus" RENAME TO "LoanInstallmentStatus_old";
ALTER TYPE "LoanInstallmentStatus_new" RENAME TO "LoanInstallmentStatus";
DROP TYPE "LoanInstallmentStatus_old";

ALTER TABLE "LoanInstallment"
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Replace LoanStatus enum to support transactional migration
CREATE TYPE "LoanStatus_new" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'DISBURSED',
    'PENDING',
    'ACTIVE',
    'DELINQUENT',
    'RESTRUCTURED',
    'PAID_OFF',
    'WRITTEN_OFF',
    'CANCELLED'
);

ALTER TABLE "Loan"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Loan"
ALTER COLUMN "status" TYPE "LoanStatus_new"
USING ("status"::text::"LoanStatus_new");

ALTER TYPE "LoanStatus" RENAME TO "LoanStatus_old";
ALTER TYPE "LoanStatus_new" RENAME TO "LoanStatus";
DROP TYPE "LoanStatus_old";

-- AlterTable
ALTER TABLE "Loan"
ADD COLUMN "amortizationMethod" "LoanAmortizationMethod" NOT NULL DEFAULT 'FIXED_PAYMENT',
ADD COLUMN "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "cancelledById" TEXT,
ADD COLUMN "disbursedAt" TIMESTAMP(3),
ADD COLUMN "disbursedById" TEXT,
ADD COLUMN "disbursementDate" TIMESTAMP(3),
ADD COLUMN "graceDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "installmentAmount" DECIMAL(12,2),
ADD COLUMN "lateInterestRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
ADD COLUMN "overdueBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidInterest" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidLateFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidPrincipal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "productType" "LoanProductType" NOT NULL DEFAULT 'CASH_LOAN',
ADD COLUMN "projectedFees" DECIMAL(12,2),
ADD COLUMN "projectedInterest" DECIMAL(12,2),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectedById" TEXT,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "saleInvoiceId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "LoanInstallment"
ADD COLUMN "feeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidInterest" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidLateFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "paidPrincipal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "pendingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LoanPayment"
ADD COLUMN "branchId" TEXT,
ADD COLUMN "cashRegisterId" TEXT,
ADD COLUMN "clientId" TEXT,
ADD COLUMN "feeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "newBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "previousBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "receiptNumber" TEXT,
ADD COLUMN "reversalReason" TEXT,
ADD COLUMN "reversedAt" TIMESTAMP(3),
ADD COLUMN "reversedById" TEXT,
ADD COLUMN "status" "LoanPaymentStatus" NOT NULL DEFAULT 'POSTED';

UPDATE "LoanPayment" lp
SET "clientId" = l."clientId",
    "branchId" = l."branchId"
FROM "Loan" l
WHERE lp."loanId" = l."id"
  AND lp."clientId" IS NULL;

ALTER TABLE "LoanPayment"
ALTER COLUMN "clientId" SET NOT NULL;

-- CreateTable
CREATE TABLE "LoanPaymentAllocation" (
    "id" TEXT NOT NULL,
    "loanPaymentId" TEXT NOT NULL,
    "loanInstallmentId" TEXT NOT NULL,
    "concept" "LoanAllocationConcept" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanLedger" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "eventType" "LoanEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2),
    "notes" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanDocument" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "loanPaymentId" TEXT,
    "type" "LoanDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sentEmailAt" TIMESTAMP(3),
    "sentWhatsAppAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanPaymentAllocation_loanPaymentId_idx" ON "LoanPaymentAllocation"("loanPaymentId");
CREATE INDEX "LoanPaymentAllocation_loanInstallmentId_idx" ON "LoanPaymentAllocation"("loanInstallmentId");
CREATE INDEX "LoanPaymentAllocation_concept_idx" ON "LoanPaymentAllocation"("concept");
CREATE INDEX "LoanLedger_loanId_idx" ON "LoanLedger"("loanId");
CREATE INDEX "LoanLedger_eventType_idx" ON "LoanLedger"("eventType");
CREATE INDEX "LoanLedger_eventDate_idx" ON "LoanLedger"("eventDate");
CREATE INDEX "LoanDocument_loanId_idx" ON "LoanDocument"("loanId");
CREATE INDEX "LoanDocument_loanPaymentId_idx" ON "LoanDocument"("loanPaymentId");
CREATE INDEX "LoanDocument_type_idx" ON "LoanDocument"("type");
CREATE INDEX "Loan_productType_idx" ON "Loan"("productType");
CREATE INDEX "Loan_saleInvoiceId_idx" ON "Loan"("saleInvoiceId");
CREATE UNIQUE INDEX "LoanPayment_receiptNumber_key" ON "LoanPayment"("receiptNumber");
CREATE INDEX "LoanPayment_clientId_idx" ON "LoanPayment"("clientId");
CREATE INDEX "LoanPayment_branchId_idx" ON "LoanPayment"("branchId");
CREATE INDEX "LoanPayment_cashRegisterId_idx" ON "LoanPayment"("cashRegisterId");
CREATE INDEX "LoanPayment_status_idx" ON "LoanPayment"("status");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_disbursedById_fkey" FOREIGN KEY ("disbursedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_saleInvoiceId_fkey" FOREIGN KEY ("saleInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanPaymentAllocation" ADD CONSTRAINT "LoanPaymentAllocation_loanPaymentId_fkey" FOREIGN KEY ("loanPaymentId") REFERENCES "LoanPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanPaymentAllocation" ADD CONSTRAINT "LoanPaymentAllocation_loanInstallmentId_fkey" FOREIGN KEY ("loanInstallmentId") REFERENCES "LoanInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanLedger" ADD CONSTRAINT "LoanLedger_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanLedger" ADD CONSTRAINT "LoanLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanDocument" ADD CONSTRAINT "LoanDocument_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanDocument" ADD CONSTRAINT "LoanDocument_loanPaymentId_fkey" FOREIGN KEY ("loanPaymentId") REFERENCES "LoanPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
