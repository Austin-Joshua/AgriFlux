/**
 * AgriFlux Dedicated Demo Account Seeding Utility
 * -----------------------------------------------
 * Standalone, operator-initiated provisioning script for development,
 * staging, and isolated demonstration environments.
 *
 * Security Invariants:
 * 1. Disabled by default during normal application startup.
 * 2. Strictly refused in production mode unless explicitly authorized via
 *    ALLOW_PRODUCTION_DEMO_SEEDING=true in an isolated demo instance.
 * 3. Never logs plaintext passwords, hashes, JWT keys, or sensitive credentials.
 * 4. Strictly idempotent: existing accounts are preserved and never overwritten.
 *
 * Usage:
 *   npm run seed:demo
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { seedDefaultAccounts } from '../config/db';

async function main() {
  console.log('================================================================');
  console.log('         AGRIFLUX DEDICATED DEMO ACCOUNT SEEDING UTILITY        ');
  console.log('================================================================');
  console.log(`Timestamp:   ${new Date().toISOString()}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log('----------------------------------------------------------------\n');

  if (env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_DEMO_SEEDING !== 'true') {
    console.error('🔒 [SECURITY ERROR] Dedicated demo seeding refused: NODE_ENV is "production".');
    console.error(
      '   Predictable demo accounts are strictly prohibited from production database clusters.'
    );
    console.error(
      '   If provisioning an isolated demo container, explicitly export ALLOW_PRODUCTION_DEMO_SEEDING=true.'
    );
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to database for dedicated seeding...');
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✔ Connected to database.\n');

    console.log('🌱 Executing idempotent account provisioning...');
    const result = await seedDefaultAccounts({ force: true, isCli: true });

    console.log('\n----------------------------------------------------------------');
    console.log(`Status:  ${result.status.toUpperCase()}`);
    console.log(`Seeded:  ${result.seeded} account(s)`);
    console.log(`Skipped: ${result.skipped} existing account(s)`);
    console.log('================================================================');

    await mongoose.disconnect();
    console.log('📡 Database connection closed cleanly.');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
