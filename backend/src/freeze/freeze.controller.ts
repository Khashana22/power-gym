import { Controller, Post, Delete, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { FreezeService } from './freeze.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

class FreezeDto {
  reason?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('members')
export class FreezeController {
  constructor(private readonly freezeService: FreezeService) {}

  @Post(':id/freeze')
  freeze(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: FreezeDto,
  ) {
    return this.freezeService.freeze(req.user.gymId, id, dto.reason);
  }

  @Post(':id/unfreeze')
  unfreeze(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.freezeService.unfreeze(req.user.gymId, id);
  }

  @Get(':id/freezes')
  history(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.freezeService.getFreezeHistory(req.user.gymId, id);
  }
}
