import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MembershipCardService } from '../membership-card/membership-card.service';
import { AuditService, AuditContext } from '../audit/audit.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly cardService: MembershipCardService,
    private readonly audit: AuditService,
  ) {}

  async create(gymId: string, dto: CreateSubscriptionDto, auditContext?: AuditContext) {
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

    const subscription = await this.prisma.subscription.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      include: {
        member: { select: { id: true, fullName: true, memberCode: true, phone: true } },
        plan: true,
      },
    });

    // Audit log
    if (auditContext) {
      await this.audit.log(
        auditContext,
        'CREATE',
        'Subscription',
        subscription.id,
        `New subscription: ${plan.name} for ${member.fullName}`,
        null,
        { planId: plan.id, endDate },
      );
    }

    // Send renewal notification
    this.notifications
      .sendRenewalSuccess(member.id, member.fullName, member.phone, plan.name, endDate)
      .catch(() => undefined);

    // Generate and deliver membership card
    this.deliverMembershipCard(member.id, subscription.id, member.fullName, member.phone).catch(() => undefined);

    return subscription;
  }

  private async deliverMembershipCard(memberId: string, subscriptionId: string, fullName: string, phone: string) {
    const cardPath = await this.cardService.generateAndSendCard(memberId, subscriptionId);
    if (cardPath) {
      await this.notifications
        .sendMembershipCard(memberId, fullName, phone, cardPath)
        .catch(() => undefined);
    }
  }

  async renew(gymId: string, subscriptionId: string, planId?: string, auditContext?: AuditContext) {
    const existing = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, member: { gymId } },
      include: { member: true, plan: true },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    const plan = planId
      ? await this.prisma.membershipPlan.findFirst({ where: { id: planId, gymId, isActive: true } })
      : existing.plan;

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const now = new Date();
    const startDate = existing.endDate > now ? existing.endDate : now;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const newSubscription = await this.prisma.subscription.create({
      data: {
        memberId: existing.memberId,
        planId: plan.id,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      include: {
        member: { select: { id: true, fullName: true, memberCode: true, phone: true } },
        plan: true,
      },
    });

    if (existing.endDate < now) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { status: 'EXPIRED' },
      });
    }

    // Audit log
    if (auditContext) {
      await this.audit.log(
        auditContext,
        'UPDATE',
        'Subscription',
        newSubscription.id,
        `Renewal: ${plan.name} for ${existing.member.fullName} until ${endDate.toISOString()}`,
        { endDate: existing.endDate },
        { newSubscriptionId: newSubscription.id, endDate },
      );
    }

    // Send renewal notification
    const { member } = existing;
    this.notifications
      .sendRenewalSuccess(member.id, member.fullName, member.phone, plan.name, endDate)
      .catch(() => undefined);

    // Deliver new membership card
    this.deliverMembershipCard(member.id, newSubscription.id, member.fullName, member.phone).catch(() => undefined);

    return newSubscription;
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
      include: { plan: true, payments: { orderBy: { paidAt: 'desc' } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        member: { gymId },
      },
      include: { member: true, plan: true, payments: { orderBy: { paidAt: 'desc' } } },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }
}
