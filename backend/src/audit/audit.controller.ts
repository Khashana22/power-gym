import {
  Controller, Get, Query, UseGuards, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('OWNER')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditService.findAll(req.user.gymId, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
      entity,
      action,
      userId,
      from,
      to,
    });
  }

  @Get('stats')
  @Roles('OWNER')
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.auditService.getStats(req.user.gymId);
  }
}
