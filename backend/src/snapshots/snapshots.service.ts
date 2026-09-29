import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface SnapshotInfo {
  fileName: string;
  createdAt: Date;
  sizeBytes: number;
  label?: string;
  summary?: {
    members: number;
    subscriptions: number;
    payments: number;
    attendance: number;
    itemSales: number;
    plans: number;
  };
}

export interface BackupData {
  version: string;
  system: string;
  exportedAt: string;
  gymId: string;
  gymName?: string;
  summary: {
    members: number;
    plans: number;
    subscriptions: number;
    payments: number;
    attendance: number;
    itemSales: number;
    expenses: number;
  };
  data: {
    gym: any;
    plans: any[];
    members: any[];
    subscriptions: any[];
    payments: any[];
    attendance: any[];
    freezes: any[];
    itemSales: any[];
    expenses: any[];
  };
}

@Injectable()
export class SnapshotsService {
  private readonly logger = new Logger(SnapshotsService.name);
  private readonly snapshotsDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.snapshotsDir = process.env.VERCEL
      ? path.join('/tmp', 'snapshots')
      : path.join(process.cwd(), 'snapshots');
    try {
      if (!fs.existsSync(this.snapshotsDir)) {
        fs.mkdirSync(this.snapshotsDir, { recursive: true });
      }
    } catch {
      // Ignored in read-only environments
    }
  }

  async getDatabaseSummary(gymId: string) {
    const [
      membersCount,
      plansCount,
      subscriptionsCount,
      paymentsCount,
      attendanceCount,
      itemSalesCount,
      expensesCount,
      gym,
    ] = await Promise.all([
      this.prisma.member.count({ where: { gymId } }),
      this.prisma.membershipPlan.count({ where: { gymId } }),
      this.prisma.subscription.count({ where: { member: { gymId } } }),
      this.prisma.payment.count({ where: { subscription: { member: { gymId } } } }),
      this.prisma.attendance.count({ where: { member: { gymId } } }),
      (this.prisma as any).itemSale.count({ where: { gymId } }),
      this.prisma.expense.count({ where: { gymId } }),
      this.prisma.gym.findUnique({ where: { id: gymId }, select: { name: true, phone: true } }),
    ]);

    return {
      gymName: gym?.name || 'Power Gym',
      members: membersCount,
      plans: plansCount,
      subscriptions: subscriptionsCount,
      payments: paymentsCount,
      attendance: attendanceCount,
      itemSales: itemSalesCount,
      expenses: expensesCount,
    };
  }

  async exportData(gymId: string): Promise<BackupData> {
    const [
      gym,
      plans,
      members,
      subscriptions,
      payments,
      attendance,
      freezes,
      itemSales,
      expenses,
    ] = await Promise.all([
      this.prisma.gym.findUnique({ where: { id: gymId } }),
      this.prisma.membershipPlan.findMany({ where: { gymId } }),
      this.prisma.member.findMany({ where: { gymId } }),
      this.prisma.subscription.findMany({ where: { member: { gymId } } }),
      this.prisma.payment.findMany({ where: { subscription: { member: { gymId } } } }),
      this.prisma.attendance.findMany({ where: { member: { gymId } } }),
      this.prisma.memberFreeze.findMany({ where: { member: { gymId } } }),
      (this.prisma as any).itemSale.findMany({ where: { gymId } }),
      this.prisma.expense.findMany({ where: { gymId } }),
    ]);

    return {
      version: '1.0',
      system: 'Power Gym Management System',
      exportedAt: new Date().toISOString(),
      gymId,
      gymName: gym?.name,
      summary: {
        members: members.length,
        plans: plans.length,
        subscriptions: subscriptions.length,
        payments: payments.length,
        attendance: attendance.length,
        itemSales: itemSales.length,
        expenses: expenses.length,
      },
      data: {
        gym,
        plans,
        members,
        subscriptions,
        payments,
        attendance,
        freezes,
        itemSales,
        expenses,
      },
    };
  }

  async createSnapshot(gymId: string, label?: string): Promise<SnapshotInfo> {
    const backup = await this.exportData(gymId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = label ? label.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_') : 'manual';
    const fileName = `snapshot-${safeName}-${timestamp}.json`;
    const filePath = path.join(this.snapshotsDir, fileName);

    const jsonContent = JSON.stringify(backup, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf-8');

    const stat = fs.statSync(filePath);
    this.logger.log(`Snapshot saved: ${fileName} (${stat.size} bytes)`);

    return {
      fileName,
      createdAt: new Date(),
      sizeBytes: stat.size,
      label: label || 'manual',
      summary: {
        members: backup.summary.members,
        subscriptions: backup.summary.subscriptions,
        payments: backup.summary.payments,
        attendance: backup.summary.attendance,
        itemSales: backup.summary.itemSales,
        plans: backup.summary.plans,
      },
    };
  }

  listSnapshots(): SnapshotInfo[] {
    try {
      if (!fs.existsSync(this.snapshotsDir)) return [];
      const files = fs.readdirSync(this.snapshotsDir);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((fileName) => {
          const filePath = path.join(this.snapshotsDir, fileName);
          const stat = fs.statSync(filePath);
          let label = 'manual';
          let summary: any = undefined;
          try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(raw);
            summary = parsed.summary;
          } catch {
            // file might be in process
          }

          const parts = fileName.replace('.json', '').split('-');
          if (parts.length > 2) {
            label = parts.slice(1, -6).join('-') || 'manual';
          }

          return {
            fileName,
            createdAt: stat.mtime,
            sizeBytes: stat.size,
            label,
            summary,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }

  getSnapshotPath(fileName: string): string | null {
    const safe = path.basename(fileName);
    const filePath = path.join(this.snapshotsDir, safe);
    if (fs.existsSync(filePath) && safe.endsWith('.json')) return filePath;
    return null;
  }

  deleteSnapshot(fileName: string): boolean {
    const filePath = this.getSnapshotPath(fileName);
    if (!filePath) return false;
    try {
      fs.unlinkSync(filePath);
      this.logger.log(`Snapshot deleted: ${fileName}`);
      return true;
    } catch {
      return false;
    }
  }

  cleanupOldSnapshots(keepCount = 10) {
    const snapshots = this.listSnapshots();
    if (snapshots.length <= keepCount) return;

    const toDelete = snapshots.slice(keepCount);
    for (const snap of toDelete) {
      this.deleteSnapshot(snap.fileName);
    }
  }
}
