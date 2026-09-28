import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreateSaleDto) {
    return this.prisma.itemSale.create({
      data: {
        gymId,
        itemName: dto.itemName.trim(),
        amount: dto.amount,
        category: dto.category?.trim() || 'مشروبات',
        quantity: dto.quantity || 1,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async findAll(gymId: string, startDate?: string, endDate?: string) {
    const where: any = { gymId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const sales = await this.prisma.itemSale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const total = sales.reduce((sum, s) => sum + s.amount, 0);

    return {
      total,
      count: sales.length,
      sales,
    };
  }

  async delete(gymId: string, id: string) {
    const sale = await this.prisma.itemSale.findFirst({
      where: { id, gymId },
    });

    if (!sale) {
      throw new NotFoundException('العملية غير موجودة');
    }

    return this.prisma.itemSale.delete({
      where: { id },
    });
  }
}
