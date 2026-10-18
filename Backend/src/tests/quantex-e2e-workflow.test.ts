/**
 * AgriFlux Phase 8: Full Closed-Loop End-to-End Workflow Verification Suite
 * Validates complete multi-actor flow:
 * 1. Farmer generates recommendation with calibrated measurement
 * 2. Farmer records action (irrigated)
 * 3. Farmer submits follow-up sensor telemetry
 * 4. Closed-loop evaluator analyzes outcome with causality disclaimer
 * 5. Agronomist specialist reviews and endorses recommendation
 * 6. Cryptographic blockchain ledger seals events and maintains integrity
 * 7. Tenant isolation blocks second farmer from modifying first farmer's record
 * 8. Missing telemetry correctly triggers INSUFFICIENT_DATA safety gate
 */
import assert from 'assert';
import { FieldIntelligenceService } from '../services/field-intelligence.service';
import { BlockchainService } from '../services/blockchain.service';

export async function runQuantexE2EWorkflowTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const farmer1Id = 'farmer_e2e_01';
  const farmer2Id = 'farmer_e2e_attacker_02';
  const agronomistId = 'agro_specialist_e2e';
  const fieldId = 'field-01';

  // Step 1: Generate recommendation with calibrated measurement
  let rec: any = null;
  try {
    rec = await FieldIntelligenceService.generateRecommendation(farmer1Id, {
      fieldId,
      cropType: 'Rice',
      cropStage: 'Vegetative (Tillering)',
      soilMoistureOverride: 23.0,
      forecastRainMm: 0,
      ambientTemp: 29.0,
      humidity: 50.0,
      forceRefresh: true,
    });

    assert.strictEqual(rec.action, 'IRRIGATE_IMMEDIATE');
    assert.strictEqual(rec.urgency, 'high');
    assert.strictEqual(rec.supportingObservations.soilMoisture.provenance, 'measured');
    results.push({
      name: 'E2E Step 1: Farmer generates urgent recommendation with verified ground-truth telemetry',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'E2E Step 1: Farmer generates urgent recommendation with verified ground-truth telemetry',
      passed: false,
      error: err.message,
    });
  }

  // Step 2: Farmer 1 records action taken
  try {
    const actionRes = await FieldIntelligenceService.recordFarmerAction(
      farmer1Id,
      rec.recommendationId,
      'irrigated',
      'Applied 25mm drip irrigation over parcel A',
      farmer1Id,
      'Austin Joshua'
    );
    assert.strictEqual(actionRes.farmerAction.actionTaken, 'irrigated');
    results.push({
      name: 'E2E Step 2: Farmer records executed irrigation action with actor metadata',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'E2E Step 2: Farmer records executed irrigation action with actor metadata',
      passed: false,
      error: err.message,
    });
  }

  // Step 3: Farmer 1 submits follow-up telemetry
  try {
    const evalRes = await FieldIntelligenceService.evaluateFollowUp(
      farmer1Id,
      rec.recommendationId,
      {
        moisture: 48.0,
        temperature: 27.5,
        notes: 'Post-irrigation 12h soil reading',
      }
    );
    assert.strictEqual(evalRes.conditionMet, true);
    assert.strictEqual(evalRes.status, 'achieved');
    assert.ok(
      evalRes.causalAttributionDisclaimer.includes('Observational'),
      'Must cite non-causal disclaimer'
    );
    results.push({
      name: 'E2E Step 3: Follow-up telemetry confirms condition met with honest causality disclaimer',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'E2E Step 3: Follow-up telemetry confirms condition met with honest causality disclaimer',
      passed: false,
      error: err.message,
    });
  }

  // Step 4: Agronomist reviews recommendation
  try {
    const reviewRes = await FieldIntelligenceService.recordAgronomistReview(
      farmer1Id,
      agronomistId,
      'Dr. Priya Sharma (TNAU Specialist)',
      rec.recommendationId,
      'endorsed',
      'Prescription adheres to FAO-56 tillering stage MAD protocol'
    );
    assert.strictEqual(reviewRes.agronomistReview.status, 'endorsed');
    results.push({
      name: 'E2E Step 4: Agronomist specialist reviews and endorses prescription with notes',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'E2E Step 4: Agronomist specialist reviews and endorses prescription with notes',
      passed: false,
      error: err.message,
    });
  }

  // Step 5: Verify Blockchain Ledger status
  try {
    const bc = BlockchainService.getInstance();
    const validation = bc.isChainValid();
    assert.strictEqual(validation.isValid, true);
    results.push({
      name: 'E2E Step 5: Cryptographic audit ledger maintains block links and Merkle root integrity',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'E2E Step 5: Cryptographic audit ledger maintains block links and Merkle root integrity',
      passed: false,
      error: err.message,
    });
  }

  // Step 6: Verify Tenant Isolation
  try {
    let attackBlocked = false;
    try {
      await FieldIntelligenceService.recordFarmerAction(
        farmer2Id,
        rec.recommendationId,
        'rejected',
        'Malicious unauthorized override',
        farmer2Id,
        'Attacker'
      );
    } catch (err: any) {
      if (err.statusCode === 403) attackBlocked = true;
    }
    assert.strictEqual(
      attackBlocked,
      true,
      'Unauthorized farmer mutation must be rejected with 403'
    );
    results.push({
      name: 'E2E Step 6: Tenant isolation strictly prevents cross-farmer mutation with HTTP 403',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'E2E Step 6: Tenant isolation strictly prevents cross-farmer mutation with HTTP 403',
      passed: false,
      error: err.message,
    });
  }

  // Step 7: Verify Missing Telemetry Data-Quality Gate
  try {
    const recMissing = await FieldIntelligenceService.generateRecommendation(farmer1Id, {
      fieldId: 'uninstrumented-field-99',
      cropType: 'Sugarcane',
      forceRefresh: true,
      allowSimulation: false,
    });
    assert.strictEqual(recMissing.action, 'INSUFFICIENT_DATA');
    results.push({
      name: 'E2E Step 7: Data-quality gate safely halts uninstrumented fields with INSUFFICIENT_DATA',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'E2E Step 7: Data-quality gate safely halts uninstrumented fields with INSUFFICIENT_DATA',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
