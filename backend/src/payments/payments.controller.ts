import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.gymId, dto);
  }

  @Get('subscription/:subscriptionId')
  findAllForSubscription(
    @Req() req: AuthenticatedRequest,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.paymentsService.findAllForSubscription(req.user.gymId, subscriptionId);
  }
}

