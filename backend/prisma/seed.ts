const dbUrl = "postgresql://neondb_owner:npg_mxHd28yakYiv@ep-delicate-water-arcqmylf.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require";
process.env.DATABASE_URL = dbUrl;

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to Neon PostgreSQL and seeding database...");

  // 1. Create or get Gym
  let gym = await prisma.gym.findFirst();
  if (!gym) {
    gym = await prisma.gym.create({
      data: {
        name: "Power Gym",
        phone: "01559666564",
        address: "Egypt",
      }
    });
    console.log("Created Gym:", gym.name, gym.id);
  } else {
    console.log("Existing Gym found:", gym.name);
  }

  // 2. Create Admin User
  const adminEmail = "admin@powergym.com";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hashedPassword = await argon2.hash("Admin@2026");
    admin = await prisma.user.create({
      data: {
        fullName: "Sayed Khashana",
        email: adminEmail,
        password: hashedPassword,
        role: "OWNER",
        gymId: gym.id,
      }
    });
    console.log("Created Admin User:", admin.email);
  } else {
    console.log("Admin user already exists:", admin.email);
  }

  // 3. Create Default Membership Plans
  const plans = [
    { name: "اشتراك شهري (1 Month)", durationDays: 30, price: 400 },
    { name: "اشتراك 3 شهور (3 Months)", durationDays: 90, price: 1000 },
    { name: "اشتراك 6 شهور (6 Months)", durationDays: 180, price: 1800 },
    { name: "اشتراك سنوي (1 Year)", durationDays: 365, price: 3200 },
  ];

  for (const p of plans) {
    const existingPlan = await prisma.membershipPlan.findFirst({
      where: { gymId: gym.id, name: p.name }
    });
    if (!existingPlan) {
      await prisma.membershipPlan.create({
        data: {
          ...p,
          gymId: gym.id,
          isActive: true,
        }
      });
      console.log("Created Plan:", p.name);
    }
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
