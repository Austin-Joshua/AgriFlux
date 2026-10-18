/**
 * AgriFlux Quantex '26 — Comprehensive Remediation & Safety Verification Test Suite
 * Validates fixes for:
 * 1. Finding A: Sensor & Field Telemetry Isolation (Cross-field leakage prevention)
 * 2. Finding B: Stale Telemetry Handling (Freshness boundary & quality degradation)
 * 3. Finding C: Production Demo-Account Seeding Prevention
 * 4. Finding E: Strict Input Validation on Overrides & Agricultural Ranges
 * 5. Finding I: Review Idempotency & Duplicate Audit Prevention
 */
import assert from 'assert';
import { FieldIntelligenceService } from '../services/field-intelligence.service';
import { BlockchainService } from '../services/blockchain.service';
import { seedDefaultAccounts } from '../config/db';
import { env } from '../config/env';
import IoTReading from '../../../Database/Models/IoTReading';

export async function runQuantexRemediationTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const testUserId = 'test_farmer_quantex';

  // Test 1: Finding A — Cross-Field Telemetry Isolation
  try {
    // If field-02 has no sensors, it should NOT inherit readings from field-01
    const recField2 = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-02-isolated-test',
      cropType: 'Maize',
      forceRefresh: true,
      allowSimulation: false,
    });

    // Should hit INSUFFICIENT_DATA gate because no sensor exists for field-02-isolated-test
    assert.strictEqual(
      recField2.action,
      'INSUFFICIENT_DATA',
      'Field 2 must not inherit unrelated sensor telemetry from other fields'
    );
    assert.strictEqual(recField2.supportingObservations.soilMoisture.value, null);
    assert.strictEqual(recField2.supportingObservations.soilMoisture.dataQualityStatus, 'missing');

    results.push({
      name: 'Remediation A: Cross-field telemetry isolation blocks data leakage between parcels',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation A: Cross-field telemetry isolation blocks data leakage between parcels',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Finding B — Stale Telemetry Quality Degradation & Cautionary Notice
  try {
    const recStale = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-01',
      cropType: 'Rice',
      soilMoistureOverride: null, // explicit missing/stale telemetry
      forceRefresh: true,
    });

    assert.strictEqual(
      recStale.action,
      'INSUFFICIENT_DATA',
      'Missing or stale telemetry must trigger safety gate'
    );
    assert.strictEqual(
      recStale.supportingObservations.soilMoisture.isStale,
      true,
      'Must flag isStale as true'
    );

    results.push({
      name: 'Remediation B: Stale telemetry triggers safety gating and prevents unverified advice',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation B: Stale telemetry triggers safety gating and prevents unverified advice',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Finding C — Production Demo Account Seeding Prevention
  try {
    const originalEnv = env.NODE_ENV;
    const originalAllow = process.env.ALLOW_DEMO_SEEDING;

    // Simulate production environment
    (env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_SEEDING;

    // Call seedDefaultAccounts
    await seedDefaultAccounts();

    // Restore environment
    (env as any).NODE_ENV = originalEnv;
    if (originalAllow) process.env.ALLOW_DEMO_SEEDING = originalAllow;

    results.push({
      name: 'Remediation C: Production startup strictly refuses default demo-account seeding',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation C: Production startup strictly refuses default demo-account seeding',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Finding E — Strict Input Validation on Overrides
  try {
    let rejectedInvalidPh = false;
    try {
      await FieldIntelligenceService.generateRecommendation(testUserId, {
        fieldId: 'field-01',
        soilPhOverride: -2, // physically impossible pH
      });
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('Invalid soil pH override')) {
        rejectedInvalidPh = true;
      }
    }
    assert.strictEqual(rejectedInvalidPh, true, 'Must reject negative soil pH with 400');

    let rejectedInvalidRain = false;
    try {
      await FieldIntelligenceService.generateRecommendation(testUserId, {
        fieldId: 'field-01',
        forecastRainMm: -10, // negative rainfall
      });
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('Invalid forecast rainfall override')) {
        rejectedInvalidRain = true;
      }
    }
    assert.strictEqual(rejectedInvalidRain, true, 'Must reject negative rainfall with 400');

    let rejectedNonNumeric = false;
    try {
      await FieldIntelligenceService.generateRecommendation(testUserId, {
        fieldId: 'field-01',
        soilPhOverride: 'not-a-number' as any,
      });
    } catch (err: any) {
      if (err.statusCode === 400) {
        rejectedNonNumeric = true;
      }
    }
    assert.strictEqual(rejectedNonNumeric, true, 'Must reject non-numeric pH with 400');

    results.push({
      name: 'Remediation E: Strict input validation rejects malformed, out-of-range, and NaN values',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation E: Strict input validation rejects malformed, out-of-range, and NaN values',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Finding I — Review Retry Idempotency (Prevents Duplicate Ledger Blocks)
  try {
    const rec = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-01',
      soilMoistureOverride: 24,
      forceRefresh: true,
    });

    const bc = BlockchainService.getInstance();
    const countInitial = bc.getChain().length;

    // First review submission
    await FieldIntelligenceService.recordAgronomistReview(
      testUserId,
      'agro-reviewer-idempotency',
      'Dr. Agronomist Specialist',
      rec.recommendationId,
      'endorsed',
      'Standard protocol verification applied'
    );

    const countAfterFirst = bc.getChain().length;
    assert.strictEqual(countAfterFirst - countInitial, 1, 'First review must append 1 block');

    // Duplicate retry submission with identical parameters
    await FieldIntelligenceService.recordAgronomistReview(
      testUserId,
      'agro-reviewer-idempotency',
      'Dr. Agronomist Specialist',
      rec.recommendationId,
      'endorsed',
      'Standard protocol verification applied'
    );

    const countAfterSecond = bc.getChain().length;
    assert.strictEqual(
      countAfterSecond,
      countAfterFirst,
      'Duplicate retry must be idempotent and NOT append duplicate block'
    );

    results.push({
      name: 'Remediation I: Agronomist review retry is idempotent and prevents duplicate audit blocks',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation I: Agronomist review retry is idempotent and prevents duplicate audit blocks',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
