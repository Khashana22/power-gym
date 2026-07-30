import {
  Controller, Get, Post, Delete,
  Param, Query, UseGuards, Req, Body,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const gymId = req.user.gymId;
    const take = Math.min(parseInt(limit || '50'), 100);
    const skip = (parseInt(page || '1') - 1) * take;

    const where: any = { member: { gymId } };
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.type = type;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          member: {
            select: { id: true, fullName: true, memberCode: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total, page: parseInt(page || '1'), limit: take };
  }

  @Post(':id/retry')
  async retry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, member: { gymId: req.user.gymId } },
      include: { member: true },
    });
    if (!notification) return { error: 'Not found' };

    return this.notificationsService.retryNotification(notification.id, notification.member.phone);
  }

  @Post('send-custom')
  async sendCustom(
    @Req() req: AuthenticatedRequest,
    @Body() body: { memberId: string; message: string },
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: body.memberId, gymId: req.user.gymId },
    });
    if (!member) return { error: 'Member not found' };
    return this.notificationsService.sendCustomMessage(member.id, member.fullName, member.phone, body.message);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.prisma.notification.deleteMany({
      where: { id, member: { gymId: req.user.gymId } },
    });
    return { success: true };
  }
}
