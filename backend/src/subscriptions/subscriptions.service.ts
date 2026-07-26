import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreateSubscriptionDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gymId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: dto.planId, gymId },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('This plan is no longer active');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.prisma.subscription.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      include: {
        member: true,
        plan: true,
      },
    });
  }

  async findAllForMember(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.subscription.findMany({
      where: { memberId },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        member: { gymId },
      },
      include: { member: true, plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }
}

