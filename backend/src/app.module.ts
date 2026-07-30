import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MembersModule } from './members/members.module';
import { AuthModule } from './auth/auth.module';
import { MembershipPlansModule } from './membership-plans/membership-plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FreezeModule } from './freeze/freeze.module';
import { SettingsModule } from './settings/settings.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { AuditModule } from './audit/audit.module';
import { MembershipCardModule } from './membership-card/membership-card.module';
import { SnapshotsModule } from './snapshots/snapshots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 120, // max 120 requests per window per IP
      },
    ]),
    PrismaModule,
    AuditModule,
    MembersModule,
    AuthModule,
    MembershipPlansModule,
    SubscriptionsModule,
    PaymentsModule,
    AttendanceModule,
    DashboardModule,
    NotificationsModule,
    ExpensesModule,
    FreezeModule,
    SettingsModule,
    SchedulerModule,
    ReportsModule,
    SearchModule,
    MembershipCardModule,
    SnapshotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}