import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MembersModule } from './members/members.module';
import { AuthModule } from './auth/auth.module';
import { MembershipPlansModule } from './membership-plans/membership-plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MembersModule,
    AuthModule,
    MembershipPlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}