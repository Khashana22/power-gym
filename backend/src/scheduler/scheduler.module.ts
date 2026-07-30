import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [PrismaModule, NotificationsModule, SnapshotsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
