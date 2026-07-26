import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MembershipPlansService } from './membership-plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    gymId: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('membership-plans')
export class MembershipPlansController {
  constructor(private readonly plansService: MembershipPlansService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePlanDto) {
    return this.plansService.create(req.user.gymId, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.plansService.findAll(req.user.gymId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.plansService.findOne(req.user.gymId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(req.user.gymId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.plansService.remove(req.user.gymId, id);
  }
}