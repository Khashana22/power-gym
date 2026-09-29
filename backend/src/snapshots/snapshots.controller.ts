import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { SnapshotsService } from './snapshots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import * as fs from 'fs';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
@Controller('snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Get()
  async list() {
    return { snapshots: this.snapshotsService.listSnapshots() };
  }

  @Get('summary')
  async getSummary(@Req() req: AuthenticatedRequest) {
    return this.snapshotsService.getDatabaseSummary(req.user.gymId);
  }

  @Get('export')
  async exportBackup(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const backup = await this.snapshotsService.exportData(req.user.gymId);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `powergym-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(JSON.stringify(backup, null, 2));
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() body: { label?: string }) {
    return this.snapshotsService.createSnapshot(req.user.gymId, body.label);
  }

  @Get(':fileName/download')
  async download(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = this.snapshotsService.getSnapshotPath(fileName);
    if (!filePath) {
      throw new HttpException('Snapshot not found', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Delete(':fileName')
  async delete(@Param('fileName') fileName: string) {
    const success = this.snapshotsService.deleteSnapshot(fileName);
    if (!success) {
      throw new HttpException('Snapshot not found', HttpStatus.NOT_FOUND);
    }
    return { success: true };
  }

  @Post('cleanup')
  async cleanup(@Body() body: { keepCount?: number }) {
    this.snapshotsService.cleanupOldSnapshots(body.keepCount ?? 10);
    return { success: true };
  }
}
