import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckinDto } from './dto/checkin.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkin(gymId: string, dto: CheckinDto) {
    const member = await this.prisma.member.findFirst({
      where: { qrToken: dto.qrToken, gymId },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Invalid QR code');
    }

    if (!member.isActive) {
      throw new BadRequestException('This member is not active');
    }

    const latestSubscription = member.subscriptions[0];

    if (!latestSubscription || latestSubscription.endDate < new Date()) {
      throw new BadRequestException('Subscription expired. Please renew.');
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingCheckin = await this.prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        checkIn: { gte: startOfDay },
      },
    });

    if (existingCheckin) {
      throw new BadRequestException('Already checked in today');
    }

    const attendance = await this.prisma.attendance.create({
      data: { memberId: member.id },
    });

    return {
      status: 'success',
      member: {
        fullName: member.fullName,
        memberCode: member.memberCode,
      },
      subscriptionEndsAt: latestSubscription.endDate,
      checkedInAt: attendance.checkIn,
    };
  }
}

