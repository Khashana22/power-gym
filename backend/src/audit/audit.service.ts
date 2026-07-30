import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../../generated/prisma';

export interface AuditContext {
  userId?: string;
  gymId: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    context: AuditContext,
    action: AuditAction,
    entity: string,
    entityId?: string,
    summary?: string,
    oldValue?: any,
    newValue?: any,
  ) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          gymId: context.gymId,
          userId: context.userId,
          action,
          entity,
          entityId,
          summary,
          oldValue: oldValue ?? undefined,
          newValue: newValue ?? undefined,
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });
    } catch {
      // Audit logging should never break main flow
    }
  }

  async findAll(
    gymId: string,
    options: {
      page?: number;
      limit?: number;
      entity?: string;
      action?: string;
      userId?: string;
      from?: string;
      to?: string;
    } = {},
  ) {
    const take = Math.min(options.limit ?? 50, 200);
    const skip = ((options.page ?? 1) - 1) * take;

    const where: any = { gymId };
    if (options.entity && options.entity !== 'ALL') where.entity = options.entity;
    if (options.action && options.action !== 'ALL') where.action = options.action;
    if (options.userId) where.userId = options.userId;
    if (options.from || options.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = new Date(options.from);
      if (options.to) where.createdAt.lte = new Date(options.to);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page: options.page ?? 1, limit: take };
  }

  async getStats(gymId: string) {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, recent, byAction, byEntity] = await Promise.all([
      this.prisma.auditLog.count({ where: { gymId } }),
      this.prisma.auditLog.count({ where: { gymId, createdAt: { gte: since30 } } }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { gymId, createdAt: { gte: since30 } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where: { gymId, createdAt: { gte: since30 } },
        _count: true,
        orderBy: { _count: { entity: 'desc' } },
      }),
    ]);

    return { total, recent, byAction, byEntity };
  }
}
