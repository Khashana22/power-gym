import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class MembershipPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreatePlanDto) {
    return this.prisma.membershipPlan.create({
      data: {
        ...dto,
        gymId,
      },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.membershipPlan.findMany({
      where: { gymId, isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id, gymId },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    return plan;
  }

  async update(gymId: string, id: string, dto: UpdatePlanDto) {
    await this.findOne(gymId, id);

    return this.prisma.membershipPlan.update({
      where: { id },
      data: dto,
    });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);

    return this.prisma.membershipPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }
}