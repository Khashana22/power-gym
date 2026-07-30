import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { ...dto, gymId },
    });
  }

  async findAll(gymId: string, month?: string) {
    const where: any = { gymId };

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id, gymId } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);
    return this.prisma.expense.delete({ where: { id } });
  }
}
