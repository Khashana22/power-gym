import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@Req() req: AuthenticatedRequest) {
    return this.settingsService.get(req.user.gymId);
  }

  @Patch()
  update(@Req() req: AuthenticatedRequest, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(req.user.gymId, dto);
  }
}
