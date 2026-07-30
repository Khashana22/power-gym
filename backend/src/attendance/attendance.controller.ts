import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { CheckinDto } from './dto/checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('checkin')
  checkin(@Req() req: AuthenticatedRequest, @Body() dto: CheckinDto) {
    return this.attendanceService.checkin(req.user.gymId, dto);
  }

  @Get('today')
  getToday(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.getToday(req.user.gymId);
  }

  @Get('month-count')
  getMonthCount(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.getMonthCount(req.user.gymId);
  }

  @Get('member/:memberId/stats')
  getMemberStats(
    @Req() req: AuthenticatedRequest,
    @Param('memberId') memberId: string,
  ) {
    return this.attendanceService.getMemberStats(req.user.gymId, memberId);
  }

  @Get('history')
  getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('memberId') memberId?: string,
    @Query('days') days?: string,
  ) {
    return this.attendanceService.getHistory(
      req.user.gymId,
      memberId,
      days ? parseInt(days) : 30,
    );
  }
}
