import {
  Controller,
  Post,
  Body,
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
}

