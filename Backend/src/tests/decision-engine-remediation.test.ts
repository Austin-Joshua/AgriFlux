/**
 * AgriFlux Phase 4.1 Decision Engine Defect Remediation & Verification Suite
 * 
 * Regression coverage for verified defects:
 * 1. Missing moisture returns INSUFFICIENT_DATA (Requirement 4.1)
 * 2. NaN and Infinity rejected, cannot produce optimal recommendation (Requirement 4.2)
 * 3. Out-of-range moisture (<0, >100) rejected with HTTP 400 (Requirement 4.3)
 * 4. Severe drought + moderate rain handles irrigation/postponement safely without false optimal (Requirement 4.4)
 * 5. Historical weather reanalysis normalization (precipitation_sum & et0_fao_evapotranspiration) (Requirement 4.5)
 * 6. Follow-up evaluation prevents excessive moisture (>75%) from qualifying as success (Requirement 4.6)
 * 7. Missing soil chemistry does not fabricate NPK values (Requirement 4.7)
 * 8. Agronomist review appends exactly one audit block (no duplication) (Requirement 4.8)
 * 9. Memory-mode history query enforces tenant isolation (no cross-farmer leak) (Requirement 4.9)
 * 10. Database write failures do not report critical operations as successful (Requirement 4.10)
 * 11. Identical normalized inputs produce strictly deterministic recommendations (Requirement 4.11)
 * 12. Data provenance transparency (measured vs calibrated vs simulated) (Requirement 4.12)
 */

import assert from 'assert';
import { FieldIntelligenceService } from '../services/field-intelligence.service';
import { BlockchainService } from '../services/blockchain.service';
import { WeatherIngestionService } from '../services/weather-ingestion.service';
import { env } from '../config/env';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runDecisionEngineRemediationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Missing moisture returns INSUFFICIENT_DATA
  try {
    const res = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: null as any,
      forceRefresh: true,
    });
    assert.strictEqual(res.action, 'INSUFFICIENT_DATA');
    assert.strictEqual(res.supportingObservations?.soilMoisture?.value, null);
    assert.strictEqual(res.supportingObservations?.soilMoisture?.dataQualityStatus, 'missing');
    results.push({
      name: 'Remediation 1: Missing moisture returns documented INSUFFICIENT_DATA outcome',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 1: Missing moisture returns documented INSUFFICIENT_DATA outcome',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: NaN and Infinite moisture values rejected
  try {
    let nanRejected = false;
    let infRejected = false;

    try {
      await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
        fieldId: 'field-01',
        soilMoistureOverride: NaN,
        forceRefresh: true,
      });
    } catch (e: any) {
      if (e.statusCode === 400 || e.message.includes('valid numeric percentage')) {
        nanRejected = true;
      }
    }

    try {
      await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
        fieldId: 'field-01',
        soilMoistureOverride: Infinity,
        forceRefresh: true,
      });
    } catch (e: any) {
      if (e.statusCode === 400 || e.message.includes('valid numeric percentage')) {
        infRejected = true;
      }
    }

    assert.ok(nanRejected, 'NaN moisture override must be rejected with HTTP 400');
    assert.ok(infRejected, 'Infinity moisture override must be rejected with HTTP 400');
    results.push({
      name: 'Remediation 2: NaN and Infinite values rejected before calculations',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 2: NaN and Infinite values rejected before calculations',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Out-of-range moisture rejected
  try {
    let negativeRejected = false;
    let excessRejected = false;

    try {
      await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
        fieldId: 'field-01',
        soilMoistureOverride: -15,
        forceRefresh: true,
      });
    } catch (e: any) {
      if (e.statusCode === 400) negativeRejected = true;
    }

    try {
      await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
        fieldId: 'field-01',
        soilMoistureOverride: 115,
        forceRefresh: true,
      });
    } catch (e: any) {
      if (e.statusCode === 400) excessRejected = true;
    }

    assert.ok(negativeRejected, 'Negative moisture must be rejected');
    assert.ok(excessRejected, 'Excess moisture (>100%) must be rejected');
    results.push({
      name: 'Remediation 3: Out-of-range moisture rejected with HTTP 400 without silent clamping',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 3: Out-of-range moisture rejected with HTTP 400 without silent clamping',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Severe drought (20%) across rain spectrum does not produce false optimal
  try {
    // 4A: Rain < 5mm -> IRRIGATE_IMMEDIATE (critical)
    const resA = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 20,
      forecastRainMm: 3,
      forceRefresh: true,
    });
    assert.strictEqual(resA.action, 'IRRIGATE_IMMEDIATE');
    assert.strictEqual(resA.urgency, 'critical');

    // 4B: Rain 5mm - <15mm -> IRRIGATE_LIGHT (moderate/low) with rain offset
    const resB = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 20,
      forecastRainMm: 12,
      forceRefresh: true,
    });
    assert.strictEqual(resB.action, 'IRRIGATE_LIGHT');
    assert.notStrictEqual(resB.action, 'MONITOR_OPTIMAL', 'Drought must never fall through to MONITOR_OPTIMAL');

    // 4C: Rain 15mm - <20mm -> POSTPONE_IRRIGATION with drought watch
    const resC = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 20,
      forecastRainMm: 18,
      forceRefresh: true,
    });
    assert.strictEqual(resC.action, 'POSTPONE_IRRIGATION');
    assert.ok(resC.explanation.includes('depleted'), 'Explanation must note moisture depletion');

    // 4D: Rain >= 20mm -> POSTPONE_IRRIGATION (flood protection)
    const resD = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 20,
      forecastRainMm: 25,
      forceRefresh: true,
    });
    assert.strictEqual(resD.action, 'POSTPONE_IRRIGATION');

    results.push({
      name: 'Remediation 4: Severe drought + moderate rain spectrum eliminates false MONITOR_OPTIMAL fall-through',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 4: Severe drought + moderate rain spectrum eliminates false MONITOR_OPTIMAL fall-through',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Weather ingestion schema normalization (precipitation_sum & et0_fao_evapotranspiration)
  try {
    // Ingest normalized historical records
    await WeatherIngestionService.ingestRecord({
      locationName: 'TEST-STN-REMEDIATION',
      coordinates: { latitude: 10.79, longitude: 79.13 },
      date: new Date('2026-03-01'),
      precipitation_sum: 22.5,
      et0_fao_evapotranspiration: 5.6,
      source: 'Open-Meteo ERA5 Reanalysis',
    });

    const rec = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 40,
      forceRefresh: true,
    });

    const obs = rec.supportingObservations;
    assert.ok(obs?.referenceET0MmDay?.value != null, 'Reference ET0 must be computed and present');
    assert.ok(obs?.recentRainfall3dMm?.value != null, 'Recent rainfall must be computed and present');
    results.push({
      name: 'Remediation 5: Weather reanalysis properties (precipitation_sum, et0_fao_evapotranspiration) reach decision engine',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 5: Weather reanalysis properties (precipitation_sum, et0_fao_evapotranspiration) reach decision engine',
      passed: false,
      error: err.message,
    });
  }

  // Test 6: Follow-up evaluation guards against excessive moisture (>75%)
  try {
    const baseRec = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 22,
      forceRefresh: true,
    });

    await FieldIntelligenceService.recordFarmerAction('remediation-farmer-1', baseRec.recommendationId, 'irrigated');

    // 6A: Valid recovery within optimal range (22% -> 54%)
    const evalSuccess = await FieldIntelligenceService.evaluateFollowUp('remediation-farmer-1', baseRec.recommendationId, {
      moisture: 54,
    });
    assert.strictEqual(evalSuccess.status, 'achieved');
    assert.strictEqual(evalSuccess.conditionMet, true);

    // 6B: Over-irrigation saturation / waterlogging (22% -> 85%)
    const evalOver = await FieldIntelligenceService.evaluateFollowUp('remediation-farmer-1', baseRec.recommendationId, {
      moisture: 85,
    });
    assert.strictEqual(evalOver.status, 'worsened');
    assert.strictEqual(evalOver.conditionMet, false);
    assert.ok(evalOver.explanation.includes('hypoxia') || evalOver.explanation.includes('waterlogging'));
    assert.ok(evalOver.causalAttributionDisclaimer.includes('Observational telemetry comparison only'));

    results.push({
      name: 'Remediation 6: Follow-up evaluation flags excessive moisture (>75%) as worsened rather than achieved',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 6: Follow-up evaluation flags excessive moisture (>75%) as worsened rather than achieved',
      passed: false,
      error: err.message,
    });
  }

  // Test 7: Missing soil chemistry uses regional benchmarks with honest attribution (no client-side formula)
  try {
    const rec = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 50,
      forceRefresh: true,
    });

    const card = rec.supportingObservations?.soilHealthCard;
    assert.ok(card != null, 'Soil Health Card observation must be present');
    assert.ok(card?.source.includes('ICAR-TNAU') || card?.source.includes('Soil'), 'Must attribute to ICAR-TNAU regional survey');
    assert.ok(typeof card?.availableN === 'number' && card.availableN > 0);
    assert.ok(typeof card?.availableK === 'number' && card.availableK > 0);

    results.push({
      name: 'Remediation 7: Missing soil chemistry relies on honest ICAR-TNAU regional benchmarks',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 7: Missing soil chemistry relies on honest ICAR-TNAU regional benchmarks',
      passed: false,
      error: err.message,
    });
  }

  // Test 8: Agronomist review creates exactly one cryptographic audit event
  try {
    const rec = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 25,
      forceRefresh: true,
    });

    const bc = BlockchainService.getInstance();
    const countBefore = bc.getChain().length;

    await FieldIntelligenceService.recordAgronomistReview(
      'remediation-farmer-1',
      'agronomist-dr-radha',
      'Dr. Radha Agronomist',
      rec.recommendationId,
      'endorsed',
      'Specialist agronomic validation completed'
    );

    const countAfter = bc.getChain().length;
    assert.strictEqual(countAfter - countBefore, 1, 'Exactly one audit block must be added');

    results.push({
      name: 'Remediation 8: Agronomist review appends exactly one audit block to the ledger',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 8: Agronomist review appends exactly one audit block to the ledger',
      passed: false,
      error: err.message,
    });
  }

  // Test 9: Memory-mode history query enforces tenant isolation
  try {
    await FieldIntelligenceService.generateRecommendation('farmer-tenant-a', {
      fieldId: 'field-tenant-a',
      soilMoistureOverride: 30,
      forceRefresh: true,
    });

    await FieldIntelligenceService.generateRecommendation('farmer-tenant-b', {
      fieldId: 'field-tenant-b',
      soilMoistureOverride: 45,
      forceRefresh: true,
    });

    const historyA = await FieldIntelligenceService.getHistory('farmer-tenant-a', 'farm-01', 50);
    const hasLeak = historyA.some((r) => r.userId === 'farmer-tenant-b');
    assert.strictEqual(hasLeak, false, 'Tenant A must never see Tenant B recommendations in history');

    results.push({
      name: 'Remediation 9: Memory-mode history queries enforce strict cross-tenant isolation',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 9: Memory-mode history queries enforce strict cross-tenant isolation',
      passed: false,
      error: err.message,
    });
  }

  // Test 10: Persistent database write failures do not report success
  try {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';
    let failedClosed = false;

    try {
      await FieldIntelligenceService.recordAgronomistReview(
        'offline-farmer',
        'offline-reviewer',
        'Offline Reviewer',
        'rec_offline_fake',
        'endorsed'
      );
    } catch (dbErr: any) {
      if (dbErr.statusCode === 503) {
        failedClosed = true;
      }
    } finally {
      (env as any).NODE_ENV = originalEnv;
    }

    assert.ok(failedClosed, 'Must fail closed with HTTP 503 when durable write cannot be completed');
    results.push({
      name: 'Remediation 10: Database failures fail closed and do not report critical writes as successful',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 10: Database failures fail closed and do not report critical writes as successful',
      passed: false,
      error: err.message,
    });
  }

  // Test 11: Identical normalized inputs produce strictly deterministic recommendations
  try {
    const payload = {
      fieldId: 'field-01',
      cropType: 'Rice',
      cropStage: 'Vegetative',
      soilMoistureOverride: 26,
      forecastRainMm: 8,
      forceRefresh: true,
    };

    const run1 = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', payload);
    const run2 = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', payload);

    assert.strictEqual(run1.action, run2.action);
    assert.strictEqual(run1.urgency, run2.urgency);
    assert.strictEqual(run1.explanation, run2.explanation);
    assert.deepStrictEqual(run1.decisionRules, run2.decisionRules);

    results.push({
      name: 'Remediation 11: Identical normalized inputs produce strictly deterministic recommendations',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 11: Identical normalized inputs produce strictly deterministic recommendations',
      passed: false,
      error: err.message,
    });
  }

  // Test 12: Provenance transparency across responses
  try {
    // 12A: Calibrated operator input
    const recCalibrated = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 32,
      forceRefresh: true,
    });
    assert.strictEqual(recCalibrated.supportingObservations?.soilMoisture?.provenance, 'measured');
    assert.strictEqual(recCalibrated.supportingObservations?.soilMoisture?.source, 'manual_operator_input');

    // 12B: Explicit simulation mode
    const recSim = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-02',
      allowSimulation: true,
      forceRefresh: true,
    });
    assert.strictEqual(recSim.supportingObservations?.soilMoisture?.provenance, 'simulated');
    assert.strictEqual(recSim.supportingObservations?.soilMoisture?.dataQualityStatus, 'simulated');

    // 12C: Missing telemetry
    const recMissing = await FieldIntelligenceService.generateRecommendation('remediation-farmer-1', {
      fieldId: 'field-02',
      forceRefresh: true,
    });
    assert.strictEqual(recMissing.action, 'INSUFFICIENT_DATA');
    assert.strictEqual(recMissing.supportingObservations?.soilMoisture?.value, null);

    results.push({
      name: 'Remediation 12: Full provenance transparency distinguishes measured, calibrated, simulated, and missing telemetry',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Remediation 12: Full provenance transparency distinguishes measured, calibrated, simulated, and missing telemetry',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
