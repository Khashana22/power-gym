import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FreezeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async freeze(gymId: string, memberId: string, reason?: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) throw new NotFoundException('Member not found');
    
    const subscription = member.subscriptions[0];
    if (!subscription) throw new BadRequestException('No active subscription to freeze');
    if (subscription.status === 'FROZEN') throw new BadRequestException('Subscription is already frozen');

    const now = new Date();

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'FROZEN', frozenAt: now },
    });

    const freeze = await this.prisma.memberFreeze.create({
      data: {
        memberId: member.id,
        subscriptionId: subscription.id,
        reason,
        frozenAt: now,
      },
    });

    this.notifications
      .sendFreezeNotification(member.id, member.fullName, member.phone, reason)
      .catch(() => undefined);

    return { success: true, freeze, subscription };
  }

  async unfreeze(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
      include: {
        subscriptions: {
          where: { status: 'FROZEN' },
          orderBy: { frozenAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) throw new NotFoundException('Member not found');

    const subscription = member.subscriptions[0];
    if (!subscription) throw new BadRequestException('No frozen subscription found');
    if (!subscription.frozenAt) throw new BadRequestException('Freeze start date missing');

    const now = new Date();
    const frozenAt = new Date(subscription.frozenAt);
    const daysFrozen = Math.ceil((now.getTime() - frozenAt.getTime()) / (1000 * 60 * 60 * 24));

    // Extend the end date by the frozen days
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + daysFrozen);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        frozenAt: null,
        frozenDays: { increment: daysFrozen },
        endDate: newEndDate,
      },
    });

    await this.prisma.memberFreeze.updateMany({
      where: { subscriptionId: subscription.id, resumedAt: null },
      data: { resumedAt: now, daysFrozen },
    });

    this.notifications
      .sendUnfreezeNotification(member.id, member.fullName, member.phone)
      .catch(() => undefined);

    return { success: true, daysFrozen, newEndDate };
  }

  async getFreezeHistory(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gymId } });
    if (!member) throw new NotFoundException('Member not found');

    return this.prisma.memberFreeze.findMany({
      where: { memberId },
      include: { subscription: { include: { plan: { select: { name: true } } } } },
      orderBy: { frozenAt: 'desc' },
    });
  }
}
