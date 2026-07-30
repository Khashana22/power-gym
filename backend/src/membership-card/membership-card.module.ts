import { Module } from '@nestjs/common';
import { MembershipCardService } from './membership-card.service';
import { MembershipCardController } from './membership-card.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipCardController],
  providers: [MembershipCardService],
  exports: [MembershipCardService],
})
export class MembershipCardModule {}
