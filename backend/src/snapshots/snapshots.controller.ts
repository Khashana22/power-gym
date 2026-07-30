import {
  Controller, Get, Post, Delete, Param, Body,
  Res, UseGuards, Req, HttpException, HttpStatus,
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

  @Post()
  async create(@Body() body: { label?: string }) {
    const snapshot = await this.snapshotsService.createSnapshot(body.label);
    if (!snapshot) {
      throw new HttpException('Snapshot creation failed. Make sure pg_dump is available.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return snapshot;
  }

  @Get(':fileName/download')
  async download(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = this.snapshotsService.getSnapshotPath(fileName);
    if (!filePath) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Post(':fileName/restore')
  async restore(@Param('fileName') fileName: string) {
    const success = await this.snapshotsService.restoreSnapshot(fileName);
    if (!success) {
      throw new HttpException('Restore failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { success: true, message: 'Database restored successfully' };
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
