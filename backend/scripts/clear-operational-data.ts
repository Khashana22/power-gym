import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function clearOperationalData() {
  console.log('--- Cleaning Operational Data from Power Gym Database ---');

  // Count existing records
  const countsBefore = {
    attendance: await prisma.attendance.count(),
    payments: await prisma.payment.count(),
    notifications: await prisma.notification.count(),
    freezes: await prisma.memberFreeze.count(),
    subscriptions: await prisma.subscription.count(),
    members: await prisma.member.count(),
    expenses: await prisma.expense.count(),
    auditLogs: await prisma.auditLog.count(),
    users: await prisma.user.count(),
    gyms: await prisma.gym.count(),
    plans: await prisma.membershipPlan.count(),
  };

  console.log('Record counts before cleanup:', countsBefore);

  // Delete in foreign key dependency order
  console.log('Deleting Attendance records...');
  await prisma.attendance.deleteMany({});

  console.log('Deleting Payment records...');
  await prisma.payment.deleteMany({});

  console.log('Deleting Notification records...');
  await prisma.notification.deleteMany({});

  console.log('Deleting MemberFreeze records...');
  await prisma.memberFreeze.deleteMany({});

  console.log('Deleting Subscription records...');
  await prisma.subscription.deleteMany({});

  console.log('Deleting Member records...');
  await prisma.member.deleteMany({});

  console.log('Deleting Expense records...');
  await prisma.expense.deleteMany({});

  console.log('Deleting AuditLog records...');
  await prisma.auditLog.deleteMany({});

  // Verify preserved data
  const countsAfter = {
    attendance: await prisma.attendance.count(),
    payments: await prisma.payment.count(),
    notifications: await prisma.notification.count(),
    freezes: await prisma.memberFreeze.count(),
    subscriptions: await prisma.subscription.count(),
    members: await prisma.member.count(),
    expenses: await prisma.expense.count(),
    auditLogs: await prisma.auditLog.count(),
    users: await prisma.user.count(),
    gyms: await prisma.gym.count(),
    plans: await prisma.membershipPlan.count(),
  };

  console.log('Record counts after cleanup:', countsAfter);

  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true },
  });
  console.log('Preserved Admin Users:', users);

  const plans = await prisma.membershipPlan.findMany({
    select: { id: true, name: true, durationDays: true, price: true },
  });
  console.log(`Preserved Membership Plans (${plans.length}):`, plans.map(p => p.name));

  console.log('✅ Operational data successfully cleaned. Admin accounts, Gym, Settings, and Plans preserved.');
}

clearOperationalData()
  .catch((err) => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
