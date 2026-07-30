#!/usr/bin/env node
/**
 * Migration: Convert existing member codes to PG-XXXX format (starting at 1001)
 * Run: node scripts/migrate-member-codes.js
 */

const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting member code migration...\n');

  // Fetch ALL members ordered by creation date
  const members = await prisma.member.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, memberCode: true, fullName: true, createdAt: true },
  });

  console.log(`Found ${members.length} members to migrate.\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const newCode = `PG-${1001 + i}`;

    // Skip if already in the correct format
    if (member.memberCode === newCode) {
      console.log(`  SKIP  ${member.fullName} → already ${newCode}`);
      skipped++;
      continue;
    }

    try {
      await prisma.member.update({
        where: { id: member.id },
        data: { memberCode: newCode },
      });
      console.log(
        `  OK    ${member.fullName}: ${member.memberCode} → ${newCode}`,
      );
      updated++;
    } catch (err) {
      console.error(
        `  ERROR ${member.fullName} (${member.memberCode}): ${err.message}`,
      );
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total:   ${members.length}`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
