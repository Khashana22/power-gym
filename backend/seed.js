const { Client } = require('pg');
const argon2 = require('argon2');
const crypto = require('crypto');

function cuid() {
  return 'c' + crypto.randomBytes(12).toString('hex');
}

const connectionString = "postgresql://neondb_owner:npg_mxHd28yakYiv@ep-delicate-water-arcqmylf.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to Neon DB!");

  try {
    // 1. Gym
    const resGym = await client.query('SELECT id, name FROM "Gym" LIMIT 1;');
    let gymId;
    if (resGym.rows.length === 0) {
      gymId = cuid();
      await client.query(
        'INSERT INTO "Gym" (id, name, phone, address, "createdAt") VALUES ($1, $2, $3, $4, NOW());',
        [gymId, 'Power Gym', '01559666564', 'Egypt']
      );
      console.log("Created Gym:", gymId);
    } else {
      gymId = resGym.rows[0].id;
      console.log("Existing Gym:", gymId);
    }

    // 2. Admin User
    const adminEmail = 'admin@powergym.com';
    const resUser = await client.query('SELECT id, email FROM "User" WHERE email = $1;', [adminEmail]);
    if (resUser.rows.length === 0) {
      const hash = await argon2.hash('Admin@2026');
      const userId = cuid();
      await client.query(
        'INSERT INTO "User" (id, "fullName", email, password, role, "gymId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW());',
        [userId, 'Sayed Khashana', adminEmail, hash, 'OWNER', gymId]
      );
      console.log("Created Admin User: admin@powergym.com / Admin@2026");
    } else {
      console.log("Admin User already exists");
    }

    // 3. Plans
    const plans = [
      { name: 'اشتراك شهري (1 Month)', durationDays: 30, price: 400 },
      { name: 'اشتراك 3 شهور (3 Months)', durationDays: 90, price: 1000 },
      { name: 'اشتراك 6 شهور (6 Months)', durationDays: 180, price: 1800 },
      { name: 'اشتراك سنوي (1 Year)', durationDays: 365, price: 3200 },
    ];

    for (const p of plans) {
      const resPlan = await client.query(
        'SELECT id FROM "MembershipPlan" WHERE "gymId" = $1 AND name = $2;',
        [gymId, p.name]
      );
      if (resPlan.rows.length === 0) {
        await client.query(
          'INSERT INTO "MembershipPlan" (id, name, "durationDays", price, "isActive", "gymId") VALUES ($1, $2, $3, $4, $5, $6);',
          [cuid(), p.name, p.durationDays, p.price, true, gymId]
        );
        console.log("Created Plan:", p.name);
      }
    }

    console.log("🎉 Seeding completed successfully!");
  } finally {
    await client.end();
  }
}

run().catch(console.error);
