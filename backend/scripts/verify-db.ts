import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function verify() {
  const members = await (prisma as any).member.count();
  const subscriptions = await (prisma as any).subscription.count();
  const attendance = await (prisma as any).attendance.count();
  const payments = await (prisma as any).payment.count();
  const notifications = await (prisma as any).notification.count();
  const auditLogs = await (prisma as any).auditLog.count();
  const itemSales = await (prisma as any).itemSale.count();
  const expenses = await (prisma as any).expense.count();

  // Preserved
  const users = await (prisma as any).user.count();
  const gyms = await (prisma as any).gym.count();
  const plans = await (prisma as any).membershipPlan.count();

  console.log('\n=== OPERATIONAL DATA (should all be 0) ===');
  console.log('Members:', members);
  console.log('Subscriptions:', subscriptions);
  console.log('Attendance:', attendance);
  console.log('Payments:', payments);
  console.log('Notifications:', notifications);
  console.log('Audit Logs:', auditLogs);
  console.log('Item Sales:', itemSales);
  console.log('Expenses:', expenses);

  console.log('\n=== PRESERVED DATA (should be > 0) ===');
  console.log('Users (admins):', users);
  console.log('Gyms:', gyms);
  console.log('Membership Plans:', plans);

  await (prisma as any).$disconnect();
}

verify().catch(console.error);
