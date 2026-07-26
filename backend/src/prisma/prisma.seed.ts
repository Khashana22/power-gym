import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  const gym = await prisma.gym.create({
    data: {
      name: 'Power Gym',
    },
  });

  console.log('Gym created:');
  console.log(gym);

  await prisma.$disconnect();
}

main();