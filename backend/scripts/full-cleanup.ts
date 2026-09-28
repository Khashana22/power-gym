import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function clearAll() {
  console.log('Starting full cleanup...');

  const itemSales = await (prisma as any).itemSale.deleteMany({});
  console.log('Deleted itemSales:', itemSales.count);

  const notifications = await (prisma as any).notification.deleteMany({});
  console.log('Deleted notifications:', notifications.count);

  const auditLogs = await (prisma as any).auditLog.deleteMany({});
  console.log('Deleted auditLogs:', auditLogs.count);

  const attendances = await (prisma as any).attendance.deleteMany({});
  console.log('Deleted attendances:', attendances.count);

  const payments = await (prisma as any).payment.deleteMany({});
  console.log('Deleted payments:', payments.count);

  const subscriptions = await (prisma as any).subscription.deleteMany({});
  console.log('Deleted subscriptions:', subscriptions.count);

  const expenses = await (prisma as any).expense.deleteMany({});
  console.log('Deleted expenses:', expenses.count);

  const members = await (prisma as any).member.deleteMany({});
  console.log('Deleted members:', members.count);

  // Verify
  const countMembers = await (prisma as any).member.count();
  const countSubs = await (prisma as any).subscription.count();
  const countAtt = await (prisma as any).attendance.count();
  const countPay = await (prisma as any).payment.count();

  console.log('\n=== VERIFICATION ===');
  console.log('Members remaining:', countMembers);
  console.log('Subscriptions remaining:', countSubs);
  console.log('Attendances remaining:', countAtt);
  console.log('Payments remaining:', countPay);

  await (prisma as any).$disconnect();
  console.log('\nDone!');
}

clearAll().catch(console.error);
