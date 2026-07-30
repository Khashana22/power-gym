import { Module } from '@nestjs/common';
import { FreezeService } from './freeze.service';
import { FreezeController } from './freeze.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [FreezeService],
  controllers: [FreezeController],
})
export class FreezeModule {}
