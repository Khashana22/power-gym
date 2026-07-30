import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MembershipCardService } from './membership-card.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    MulterModule.register({ dest: './uploads/photos' }),
  ],
  controllers: [MembersController],
  providers: [MembersService, MembershipCardService],
})
export class MembersModule {}
