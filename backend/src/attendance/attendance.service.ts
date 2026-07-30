import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckinDto } from './dto/checkin.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkin(gymId: string, dto: CheckinDto) {
    const member = await this.prisma.member.findFirst({
      where: {
        memberCode: { equals: dto.memberCode, mode: 'insensitive' },
        gymId,
      },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: { select: { name: true } } },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found with this code');
    }

    const latestSubscription = member.subscriptions[0];
    const now = new Date();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Check for duplicate check-in today
    const existingCheckin = await this.prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        checkIn: { gte: startOfDay },
      },
    });

    if (existingCheckin) {
      return {
        alreadyCheckedIn: true,
        previousCheckInTime: existingCheckin.checkIn,
        member: {
          id: member.id,
          fullName: member.fullName,
          memberCode: member.memberCode,
          phone: member.phone,
          photo: member.photo,
        },
        subscriptionStatus: latestSubscription?.status ?? null,
        plan: latestSubscription?.plan?.name ?? null,
        subscriptionEndsAt: latestSubscription?.endDate ?? null,
      };
    }

    const attendance = await this.prisma.attendance.create({
      data: { memberId: member.id },
    });

    const daysRemaining = latestSubscription
      ? Math.ceil(
          (latestSubscription.endDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      alreadyCheckedIn: false,
      status: 'success',
      member: {
        id: member.id,
        fullName: member.fullName,
        memberCode: member.memberCode,
        phone: member.phone,
        photo: member.photo,
      },
      subscriptionStatus: latestSubscription?.status ?? null,
      plan: latestSubscription?.plan?.name ?? null,
      subscriptionEndsAt: latestSubscription?.endDate ?? null,
      daysRemaining,
      checkedInAt: attendance.checkIn,
    };
  }

  async getToday(gymId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.attendance.findMany({
      where: {
        member: { gymId },
        checkIn: { gte: startOfDay },
      },
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            memberCode: true,
            photo: true,
            subscriptions: {
              orderBy: { endDate: 'desc' },
              take: 1,
              select: { status: true },
            },
          },
        },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getMonthCount(gymId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.prisma.attendance.count({
      where: {
        member: { gymId },
        checkIn: { gte: startOfMonth },
      },
    });
  }

  async getMemberStats(gymId: string, memberId: string) {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [total, thisMonth, thisYear, lastAttendance] = await Promise.all([
      this.prisma.attendance.count({ where: { memberId } }),
      this.prisma.attendance.count({
        where: { memberId, checkIn: { gte: startOfMonth } },
      }),
      this.prisma.attendance.count({
        where: { memberId, checkIn: { gte: startOfYear } },
      }),
      this.prisma.attendance.findFirst({
        where: { memberId },
        orderBy: { checkIn: 'desc' },
      }),
    ]);

    return {
      total,
      thisMonth,
      thisYear,
      lastAttendanceDate: lastAttendance?.checkIn ?? null,
      lastAttendanceTime: lastAttendance?.checkIn ?? null,
    };
  }

  async getHistory(gymId: string, memberId?: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      checkIn: { gte: since },
    };

    if (memberId) {
      where.memberId = memberId;
    } else {
      where.member = { gymId };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            memberCode: true,
            photo: true,
            subscriptions: {
              orderBy: { endDate: 'desc' },
              take: 1,
              select: { status: true },
            },
          },
        },
      },
      orderBy: { checkIn: 'desc' },
    });
  }
}
