/**
 * One-shot admin seeder.
 * Uses pg (already installed) and argon2 (already installed) directly.
 * Mirrors the exact hashing logic from AuthService (argon2.hash).
 *
 * Usage: node scripts/seed-admin.mjs
 */

import pg from 'pg';
import argon2 from 'argon2';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env manually (dotenv not guaranteed in raw node)
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const DATABASE_URL = envContent
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith('DATABASE_URL='))
  .map(l => l.replace('DATABASE_URL=', '').replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
  [0];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const TARGET_EMAIL = 'admin@powergym.com';
const TARGET_PASSWORD = 'Admin123!';
const TARGET_FULLNAME = 'Admin';
const TARGET_ROLE = 'OWNER';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // 1. Check if user exists
    const { rows: users } = await client.query(
      'SELECT id, email, role, "gymId" FROM "User" WHERE email = $1',
      [TARGET_EMAIL]
    );

    console.log('\n=== Existing users with that email ===');
    console.log(users.length ? JSON.stringify(users, null, 2) : '(none)');

    // 2. Also list ALL users so we know what's in the DB
    const { rows: allUsers } = await client.query(
      'SELECT id, email, role, "gymId" FROM "User" ORDER BY email'
    );
    console.log('\n=== All users in DB ===');
    console.table(allUsers);

    // 3. Hash the target password using argon2 (same as AuthService)
    const hashedPassword = await argon2.hash(TARGET_PASSWORD);
    console.log(`\n✅ Argon2 hash generated for "${TARGET_PASSWORD}"`);

    if (users.length > 0) {
      // User exists — update password
      const user = users[0];
      await client.query(
        'UPDATE "User" SET password = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );
      console.log(`\n✅ Password RESET for existing user: ${user.email} (role: ${user.role}, gymId: ${user.gymId})`);
    } else {
      // No user — need a gym first, then create the user
      // Check if any gym exists we can attach to
      const { rows: gyms } = await client.query('SELECT id, name FROM "Gym" LIMIT 1');
      let gymId;

      if (gyms.length > 0) {
        gymId = gyms[0].id;
        console.log(`\n✅ Using existing gym: ${gyms[0].name} (${gymId})`);
      } else {
        // Create a gym
        const { rows: newGym } = await client.query(
          'INSERT INTO "Gym" (id, name, "createdAt") VALUES (gen_random_uuid()::text, $1, NOW()) RETURNING id, name',
          ['Power Gym']
        );
        gymId = newGym[0].id;
        console.log(`\n✅ Created new gym: ${newGym[0].name} (${gymId})`);
      }

      // Insert the admin user
      const { rows: newUser } = await client.query(
        `INSERT INTO "User" (id, "fullName", email, password, role, "gymId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())
         RETURNING id, email, role, "gymId"`,
        [TARGET_FULLNAME, TARGET_EMAIL, hashedPassword, TARGET_ROLE, gymId]
      );
      console.log(`\n✅ CREATED new user:`, newUser[0]);
    }

    // 4. Verify the hash works
    const { rows: verifyRows } = await client.query(
      'SELECT password FROM "User" WHERE email = $1',
      [TARGET_EMAIL]
    );
    const storedHash = verifyRows[0].password;
    const valid = await argon2.verify(storedHash, TARGET_PASSWORD);
    console.log(`\n🔐 Argon2 verify check: ${valid ? '✅ PASS' : '❌ FAIL'}`);

    if (!valid) {
      console.error('❌ Hash verification failed! Something went wrong.');
      process.exit(1);
    }

    console.log('\n✅ Done. Login credentials:');
    console.log(`   Email:    ${TARGET_EMAIL}`);
    console.log(`   Password: ${TARGET_PASSWORD}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Script error:', err);
  process.exit(1);
});
