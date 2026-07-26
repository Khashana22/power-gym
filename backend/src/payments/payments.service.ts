import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreatePaymentDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: dto.subscriptionId,
        member: { gymId },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: dto.amount,
        method: dto.method as any,
      },
    });
  }

  async findAllForSubscription(gymId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        member: { gymId },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.payment.findMany({
      where: { subscriptionId },
      orderBy: { paidAt: 'desc' },
    });
  }
}

