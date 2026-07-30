import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SnapshotsService } from '../snapshots/snapshots.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly snapshots: SnapshotsService,
  ) {}

  // ── Daily snapshot at 2:00 AM ────────────────────────────────────────
  @Cron('0 2 * * *')
  async handleDailySnapshot() {
    this.logger.log('[CRON] Running daily database snapshot...');
    const snap = await this.snapshots.createSnapshot('daily');
    if (snap) {
      this.logger.log(`[CRON] Snapshot created: ${snap.fileName}`);
      this.snapshots.cleanupOldSnapshots(14); // keep 14 daily snapshots
    } else {
      this.logger.warn('[CRON] Daily snapshot failed (pg_dump may not be available)');
    }
  }

  // ── Birthday messages at 8:00 AM ────────────────────────────────────
  @Cron('0 8 * * *')
  async handleBirthdayMessages() {
    this.logger.log('[CRON] Sending birthday messages...');
    await this.sendBirthdayMessages();
  }

  // ── Expiry reminders at 9:00 AM ─────────────────────────────────────
  @Cron('0 9 * * *')
  async handleExpiryReminders() {
    this.logger.log('[CRON] Sending expiry reminders...');
    await Promise.allSettled([
      this.sendExpiryReminders(),
      this.markExpiredSubscriptions(),
    ]);
  }

  // ── Absence reminders at 10:00 AM ────────────────────────────────────
  @Cron('0 10 * * *')
  async handleAbsenceReminders() {
    this.logger.log('[CRON] Sending absence reminders...');
    await this.sendAbsenceReminders();
  }

  // ── Retry pending notifications every 30 minutes ─────────────────────
  @Cron('*/30 * * * *')
  async handleRetryPending() {
    this.logger.log('[CRON] Retrying pending notifications...');
    await this.notifications.retryPending();
  }

  // ── Monthly report on 1st at 7:00 AM ─────────────────────────────────
  @Cron('0 7 1 * *')
  async handleMonthlyReport() {
    this.logger.log('[CRON] Running monthly report cron...');
    // Create an extra snapshot at start of month
    await this.snapshots.createSnapshot('monthly');
    this.snapshots.cleanupOldSnapshots(14);
  }

  // ── Weekly cleanup on Sunday at 3:00 AM ──────────────────────────────
  @Cron('0 3 * * 0')
  async handleWeeklyCleanup() {
    this.logger.log('[CRON] Running weekly cleanup...');
    // Cleanup old notifications (> 90 days, SENT status)
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deleted = await this.prisma.notification.deleteMany({
      where: { status: 'SENT', createdAt: { lt: cutoff } },
    });
    this.logger.log(`[CRON] Cleaned ${deleted.count} old notifications`);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private async sendExpiryReminders() {
    const now = new Date();
    const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
    const in3 = new Date(now); in3.setDate(in3.getDate() + 3);
    const in1 = new Date(now); in1.setDate(in1.getDate() + 1);
    const today = new Date(now); today.setHours(23, 59, 59, 999);
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    const windows = [
      { gte: new Date(in7.getTime()), lte: new Date(in7.getTime() + 86400000 - 1), days: 7 },
      { gte: new Date(in3.getTime()), lte: new Date(in3.getTime() + 86400000 - 1), days: 3 },
      { gte: new Date(in1.getTime()), lte: new Date(in1.getTime() + 86400000 - 1), days: 1 },
      { gte: todayStart, lte: today, days: 0 },
    ];

    for (const { gte, lte, days } of windows) {
      const subs = await this.prisma.subscription.findMany({
        where: { status: 'ACTIVE', endDate: { gte, lte } },
        include: { member: true },
      });

      for (const sub of subs) {
        const { member } = sub;
        if (!member.isActive || member.isArchived) continue;
        await this.notifications
          .sendExpiryReminder(member.id, member.fullName, member.phone, days)
          .catch(() => undefined);
      }
    }
  }

  private async markExpiredSubscriptions() {
    const now = new Date();
    await this.prisma.subscription.updateMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      data: { status: 'EXPIRED' },
    });

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const justExpired = await this.prisma.subscription.findMany({
      where: { status: 'EXPIRED', endDate: { gte: todayStart, lt: now } },
      include: { member: true },
      take: 50,
    });

    for (const sub of justExpired) {
      const { member } = sub;
      if (!member.isActive || member.isArchived) continue;
      await this.notifications
        .sendExpiredNotification(member.id, member.fullName, member.phone)
        .catch(() => undefined);
    }
  }

  private async sendBirthdayMessages() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const members = await this.prisma.member.findMany({
      where: { isActive: true, isArchived: false, birthday: { not: null } },
    });

    for (const member of members) {
      if (!member.birthday) continue;
      const bday = new Date(member.birthday);
      if (bday.getMonth() + 1 === month && bday.getDate() === day) {
        await this.notifications
          .sendBirthdayMessage(member.id, member.fullName, member.phone)
          .catch(() => undefined);
      }
    }
  }

  private async sendAbsenceReminders() {
    const now = new Date();
    const ago7 = new Date(now); ago7.setDate(ago7.getDate() - 7);
    const ago30 = new Date(now); ago30.setDate(ago30.getDate() - 30);

    const absent7Members = await this.prisma.$queryRaw<{ id: string; fullName: string; phone: string }[]>`
      SELECT m.id, m."fullName", m.phone
      FROM "Member" m
      WHERE m."isActive" = true AND m."isArchived" = false
        AND EXISTS (
          SELECT 1 FROM "Subscription" s WHERE s."memberId" = m.id AND s.status = 'ACTIVE'
        )
        AND NOT EXISTS (
          SELECT 1 FROM "Attendance" a WHERE a."memberId" = m.id AND a."checkIn" >= ${ago7}
        )
        AND EXISTS (
          SELECT 1 FROM "Attendance" a WHERE a."memberId" = m.id AND a."checkIn" >= ${ago30}
        )
    `;

    for (const member of absent7Members) {
      await this.notifications
        .sendAbsenceReminder(member.id, member.fullName, member.phone, 7)
        .catch(() => undefined);
    }

    const absent30Members = await this.prisma.$queryRaw<{ id: string; fullName: string; phone: string }[]>`
      SELECT m.id, m."fullName", m.phone
      FROM "Member" m
      WHERE m."isActive" = true AND m."isArchived" = false
        AND EXISTS (
          SELECT 1 FROM "Subscription" s WHERE s."memberId" = m.id AND s.status = 'ACTIVE'
        )
        AND NOT EXISTS (
          SELECT 1 FROM "Attendance" a WHERE a."memberId" = m.id AND a."checkIn" >= ${ago30}
        )
    `;

    for (const member of absent30Members) {
      await this.notifications
        .sendAbsenceReminder(member.id, member.fullName, member.phone, 30)
        .catch(() => undefined);
    }
  }

  // Manual trigger endpoints (for admin use)
  async triggerExpiryReminders() {
    await this.handleExpiryReminders();
    return { triggered: true };
  }

  async triggerSnapshot(label = 'manual') {
    return this.snapshots.createSnapshot(label);
  }
}
