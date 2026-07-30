-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'FREEZE', 'UNFREEZE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT');

-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'RETRYING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBERSHIP_CARD';
ALTER TYPE "NotificationType" ADD VALUE 'BIRTHDAY';
ALTER TYPE "NotificationType" ADD VALUE 'ABSENCE_7';
ALTER TYPE "NotificationType" ADD VALUE 'ABSENCE_30';
ALTER TYPE "NotificationType" ADD VALUE 'ATTENDANCE_CONFIRM';
ALTER TYPE "NotificationType" ADD VALUE 'FREEZE';
ALTER TYPE "NotificationType" ADD VALUE 'UNFREEZE';
ALTER TYPE "NotificationType" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "archiveReason" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "errorMsg" TEXT,
ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "frozenDays" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GymSettings" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "gymName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#F97316',
    "secondaryColor" TEXT NOT NULL DEFAULT '#09090B',
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "businessHours" TEXT,
    "whatsappToken" TEXT,
    "whatsappPhoneId" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFrom" TEXT,
    "smtpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethods" TEXT NOT NULL DEFAULT 'CASH,VISA,INSTAPAY,VODAFONE_CASH',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberFreeze" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "reason" TEXT,
    "frozenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumedAt" TIMESTAMP(3),
    "daysFrozen" INTEGER,

    CONSTRAINT "MemberFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gymId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymSettings_gymId_key" ON "GymSettings"("gymId");

-- CreateIndex
CREATE INDEX "MemberFreeze_memberId_idx" ON "MemberFreeze"("memberId");

-- CreateIndex
CREATE INDEX "AuditLog_gymId_createdAt_idx" ON "AuditLog"("gymId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "Attendance_memberId_idx" ON "Attendance"("memberId");

-- CreateIndex
CREATE INDEX "Expense_gymId_createdAt_idx" ON "Expense"("gymId", "createdAt");

-- CreateIndex
CREATE INDEX "Member_gymId_isActive_idx" ON "Member"("gymId", "isActive");

-- CreateIndex
CREATE INDEX "Member_gymId_isArchived_idx" ON "Member"("gymId", "isArchived");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_memberId_idx" ON "Notification"("memberId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Subscription_memberId_idx" ON "Subscription"("memberId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- AddForeignKey
ALTER TABLE "GymSettings" ADD CONSTRAINT "GymSettings_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberFreeze" ADD CONSTRAINT "MemberFreeze_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberFreeze" ADD CONSTRAINT "MemberFreeze_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
