import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';

class RenewDto {
  @IsOptional()
  @IsString()
  planId?: string;
}

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

function getAuditContext(req: AuthenticatedRequest) {
  return {
    userId: req.user.userId,
    gymId: req.user.gymId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(req.user.gymId, dto, getAuditContext(req));
  }

  @Post(':id/renew')
  renew(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RenewDto,
  ) {
    return this.subscriptionsService.renew(req.user.gymId, id, dto.planId, getAuditContext(req));
  }

  @Get('member/:memberId')
  findAllForMember(
    @Req() req: AuthenticatedRequest,
    @Param('memberId') memberId: string,
  ) {
    return this.subscriptionsService.findAllForMember(req.user.gymId, memberId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionsService.findOne(req.user.gymId, id);
  }
}
