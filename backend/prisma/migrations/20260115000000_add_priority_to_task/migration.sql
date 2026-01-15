-- AlterTable
ALTER TABLE "Task" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");








