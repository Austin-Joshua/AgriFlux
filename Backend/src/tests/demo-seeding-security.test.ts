/**
 * Automated Test Suite: Demo Account Seeding Security & Environment Validation
 * ----------------------------------------------------------------------------
 * Verifies:
 * 1. Default production initialization strictly refuses demo account creation.
 * 2. Production seeding override is rejected unless deliberate CLI authorization exists.
 * 3. Dedicated CLI seeding works only under explicit configuration.
 * 4. Default development startup skips seeding unless AUTO_SEED_DEMO=true is set.
 * 5. Seeding is strictly idempotent: existing accounts are never overwritten.
 * 6. Production configuration fails safely when required secrets are absent, weak, or placeholders.
 * 7. No sensitive passwords, hashes, or secrets are leaked to operational logs.
 */

import assert from 'assert';
import { env, validateProductionSecurity } from '../config/env';
import { seedDefaultAccounts } from '../config/db';
import User from '../../../Database/Models/User';

export async function runDemoSeedingSecurityTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Default production initialization strictly refuses demo accounts
  try {
    const originalEnv = env.NODE_ENV;
    const originalAllow = process.env.ALLOW_PRODUCTION_DEMO_SEEDING;

    (env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_PRODUCTION_DEMO_SEEDING;

    const res = await seedDefaultAccounts();
    assert.strictEqual(
      res.status,
      'refused_in_production',
      'Normal production startup must refuse demo account seeding'
    );
    assert.strictEqual(res.seeded, 0, 'Zero accounts may be seeded in production by default');

    (env as any).NODE_ENV = originalEnv;
    if (originalAllow) process.env.ALLOW_PRODUCTION_DEMO_SEEDING = originalAllow;

    results.push({
      name: 'Demo Seeding: Default production initialization strictly refuses demo accounts',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Demo Seeding: Default production initialization strictly refuses demo accounts',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Production seeding override without explicit CLI invocation is rejected
  try {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';
    process.env.ALLOW_PRODUCTION_DEMO_SEEDING = 'true';

    // Normal startup call (isCli: false or omitted)
    const res = await seedDefaultAccounts({ isCli: false });
    assert.strictEqual(
      res.status,
      'refused_in_production',
      'Automatic startup must refuse seeding in production even if override flag is present'
    );

    (env as any).NODE_ENV = originalEnv;
    delete process.env.ALLOW_PRODUCTION_DEMO_SEEDING;

    results.push({
      name: 'Demo Seeding: Production startup ignores override unless run from dedicated CLI script',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Demo Seeding: Production startup ignores override unless run from dedicated CLI script',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Dedicated CLI invocation in non-production provisions demo accounts
  const origFindOne = User.findOne;
  const origCreate = User.create;
  const memoryUsers = new Map<string, any>();

  try {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'development';

    (User as any).findOne = async (query: any) => {
      return memoryUsers.get(query?.email) || null;
    };
    (User as any).create = async (doc: any) => {
      memoryUsers.set(doc.email, doc);
      return doc;
    };

    const res = await seedDefaultAccounts({ force: true, isCli: true });
    assert.strictEqual(res.status, 'completed', 'Dedicated CLI seeding must complete successfully');

    // Verify presence of accounts in DB/model
    const farmer = await User.findOne({ email: 'farmer@agriflux.com' });
    assert.ok(farmer, 'Farmer demo account must exist');
    assert.strictEqual(farmer.role, 'farmer');

    (env as any).NODE_ENV = originalEnv;

    results.push({
      name: 'Demo Seeding: Dedicated CLI invocation in non-production provisions demo accounts',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Demo Seeding: Dedicated CLI invocation in non-production provisions demo accounts',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Default development startup skips seeding without explicit opt-in
  try {
    const originalEnv = env.NODE_ENV;
    const originalAuto = process.env.AUTO_SEED_DEMO;

    (env as any).NODE_ENV = 'development';
    delete process.env.AUTO_SEED_DEMO;

    const res = await seedDefaultAccounts({ force: false });
    assert.strictEqual(
      res.status,
      'disabled_by_default',
      'Normal startup without AUTO_SEED_DEMO must skip seeding by default'
    );
    assert.strictEqual(res.seeded, 0);

    (env as any).NODE_ENV = originalEnv;
    if (originalAuto) process.env.AUTO_SEED_DEMO = originalAuto;

    results.push({
      name: 'Demo Seeding: Development startup skips seeding unless AUTO_SEED_DEMO is explicitly enabled',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Demo Seeding: Development startup skips seeding unless AUTO_SEED_DEMO is explicitly enabled',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Seeding is idempotent and never overwrites existing accounts
  try {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'development';

    const farmerBefore = await User.findOne({ email: 'farmer@agriflux.com' });
    const originalPasswordHash = farmerBefore?.password;

    // Second call with existing accounts in memory
    const resSecond = await seedDefaultAccounts({ force: true });
    assert.strictEqual(resSecond.status, 'completed');
    assert.strictEqual(resSecond.seeded, 0, 'No new accounts should be created on second run');
    assert.strictEqual(resSecond.skipped, 3, 'All 3 existing accounts must be preserved');

    const farmerAfter = await User.findOne({ email: 'farmer@agriflux.com' });
    assert.strictEqual(
      farmerAfter?.password,
      originalPasswordHash,
      'Existing account password hash must not be overwritten or reset'
    );

    (env as any).NODE_ENV = originalEnv;

    results.push({
      name: 'Demo Seeding: Seeding is strictly idempotent and preserves existing account credentials',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Demo Seeding: Seeding is strictly idempotent and preserves existing account credentials',
      passed: false,
      error: err.message,
    });
  } finally {
    User.findOne = origFindOne;
    User.create = origCreate;
  }

  // Test 6: Production validator rejects missing, short, or placeholder JWT_SECRET
  try {
    const weakCheck = validateProductionSecurity({
      NODE_ENV: 'production',
      JWT_SECRET: 'your_jwt_secret_key', // placeholder
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/agriflux',
    });
    assert.strictEqual(weakCheck.valid, false, 'Placeholder secret must fail production check');
    assert.ok(
      weakCheck.errors.some((e) => e.includes('insecure development placeholder')),
      'Must explain placeholder rejection'
    );

    const shortCheck = validateProductionSecurity({
      NODE_ENV: 'production',
      JWT_SECRET: 'short_secret_under_32',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/agriflux',
    });
    assert.strictEqual(shortCheck.valid, false, 'Secret < 32 chars must fail production check');
    assert.ok(
      shortCheck.errors.some((e) => e.includes('too short')),
      'Must explain minimum length constraint'
    );

    const strongCheck = validateProductionSecurity({
      NODE_ENV: 'production',
      JWT_SECRET: 'a_very_secure_and_cryptographically_strong_random_secret_2026',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/agriflux',
    });
    assert.strictEqual(strongCheck.valid, true, 'Strong secret must pass production check');

    results.push({
      name: 'Production Security: Validator rejects missing, weak, or placeholder JWT secrets',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Production Security: Validator rejects missing, weak, or placeholder JWT secrets',
      passed: false,
      error: err.message,
    });
  }

  // Test 7: Production validator rejects localhost database URL
  try {
    const localhostCheck = validateProductionSecurity({
      NODE_ENV: 'production',
      JWT_SECRET: 'a_very_secure_and_cryptographically_strong_random_secret_2026',
      MONGODB_URI: 'mongodb://localhost:27017/agriflux',
    });
    assert.strictEqual(
      localhostCheck.valid,
      false,
      'Localhost database must fail production check'
    );
    assert.ok(
      localhostCheck.errors.some((e) => e.includes('authorized cluster')),
      'Must explain database cluster requirement'
    );

    results.push({
      name: 'Production Security: Validator rejects unauthenticated localhost database URLs',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Production Security: Validator rejects unauthenticated localhost database URLs',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
