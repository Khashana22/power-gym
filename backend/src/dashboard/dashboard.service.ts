import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(gymId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    const [
      totalMembers,
      newMembersThisMonth,
      activeSubscriptions,
      expiredSubscriptions,
      expiringSoon,
      expiring3Days,
      attendanceToday,
      revenueToday,
      revenueThisMonth,
      recentMembers,
      expiringSubs,
      revenueChart,
      attendanceChart,
    ] = await Promise.all([
      this.prisma.member.count({ where: { gymId, isActive: true } }),

      this.prisma.member.count({ where: { gymId, isActive: true, createdAt: { gte: startOfMonth } } }),

      this.prisma.subscription.count({
        where: { member: { gymId }, status: 'ACTIVE', endDate: { gte: now } },
      }),

      this.prisma.subscription.count({
        where: { member: { gymId }, status: 'ACTIVE', endDate: { lt: now } },
      }),

      this.prisma.subscription.count({
        where: { member: { gymId }, status: 'ACTIVE', endDate: { gte: now, lte: in7Days } },
      }),

      this.prisma.subscription.count({
        where: { member: { gymId }, status: 'ACTIVE', endDate: { gte: now, lte: in3Days } },
      }),

      this.prisma.attendance.count({
        where: { member: { gymId }, checkIn: { gte: startOfDay } },
      }),

      this.prisma.payment.aggregate({
        where: { subscription: { member: { gymId } }, paidAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),

      this.prisma.payment.aggregate({
        where: { subscription: { member: { gymId } }, paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),

      // Recent 5 members
      this.prisma.member.findMany({
        where: { gymId, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, memberCode: true, phone: true, photo: true, createdAt: true },
      }),

      // Expiring subscriptions (next 7 days)
      this.prisma.subscription.findMany({
        where: {
          member: { gymId },
          status: 'ACTIVE',
          endDate: { gte: now, lte: in7Days },
        },
        include: { member: { select: { id: true, fullName: true, phone: true, photo: true, memberCode: true } }, plan: { select: { name: true } } },
        orderBy: { endDate: 'asc' },
        take: 10,
      }),

      // Revenue chart (last 7 days)
      this.getRevenueChart(gymId, 7),

      // Attendance chart (last 7 days)
      this.getAttendanceChart(gymId, 7),
    ]);

    return {
      totalMembers,
      newMembersThisMonth,
      activeSubscriptions,
      expiredSubscriptions,
      expiringSoon7Days: expiringSoon,
      expiringSoon3Days: expiring3Days,
      attendanceToday,
      revenueToday: revenueToday._sum.amount ?? 0,
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      recentMembers,
      expiringSubs,
      revenueChart,
      attendanceChart,
    };
  }

  private async getRevenueChart(gymId: string, days: number) {
    const result: { date: string; label: string; amount: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const agg = await this.prisma.payment.aggregate({
        where: { subscription: { member: { gymId } }, paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      result.push({
        date: start.toISOString().slice(0, 10),
        label: start.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
        amount: agg._sum.amount ?? 0,
      });
    }
    return result;
  }

  private async getAttendanceChart(gymId: string, days: number) {
    const result: { date: string; label: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const count = await this.prisma.attendance.count({
        where: { member: { gymId }, checkIn: { gte: start, lte: end } },
      });

      result.push({
        date: start.toISOString().slice(0, 10),
        label: start.toLocaleDateString('en', { weekday: 'short' }),
        count,
      });
    }
    return result;
  }
}
