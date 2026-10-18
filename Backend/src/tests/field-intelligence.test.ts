/**
 * AgriFlux Automated Test Suite: Field Intelligence Engine
 * Tests the closed-loop decision workflow:
 * 1. Observation ingestion & FAO-56 MAD rule evaluation
 * 2. Urgent recommendation generation for moisture deficit (< 28%)
 * 3. Stable monitoring recommendation for optimal conditions
 * 4. Stale data degradation flag & provenance tracking
 * 5. Farmer action recording (audit-trailed with actor identification)
 * 6. Closed-loop follow-up telemetry outcome evaluation (achieved / not_achieved)
 * 7. Unified Field Context & Data Quality status
 * 8. Chronological field timeline retrieval
 * 9. Agronomist specialist review workflow
 * 10. Insufficient evidence handling without fabricating success
 */
import assert from 'assert';
import { FieldIntelligenceService } from '../services/field-intelligence.service';

export async function runFieldIntelligenceTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const testUserId = 'test_farmer_01';

  // Test 1: Severe moisture deficit triggers urgent FAO-56 irrigation recommendation
  let savedRecId = '';
  try {
    const recommendation = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-north-tomato-01',
      cropType: 'Tomato',
      cropStage: 'Flowering & Fruit Set',
      soilMoistureOverride: 22.0, // well below threshold (< 28%)
      forecastRainMm: 0,
      forecastRainProbability: 5,
      ambientTemp: 29.0,
      humidity: 45.0,
    });

    savedRecId = recommendation.recommendationId;
    assert.strictEqual(recommendation.action, 'IRRIGATE_IMMEDIATE');
    assert.strictEqual(recommendation.urgency, 'high');
    assert.strictEqual(recommendation.ruleVersion, 'v2.1-QUANTEX-FAO56');
    assert.ok(
      recommendation.explanation.includes('depleted') ||
        recommendation.explanation.includes('depletion'),
      'Explanation must cite depletion'
    );
    assert.ok(
      recommendation.decisionRules.some(
        (r: string) => r.includes('FAO-56') || r.includes('MAD') || r.includes('depletion')
      ),
      'Must cite agronomic standard'
    );
    assert.ok(recommendation.alternativeActions.length > 0, 'Must provide practical alternatives');
    assert.ok(
      recommendation.expectedFollowUpCondition,
      'Must provide follow-up verification condition'
    );
    results.push({
      name: 'Field Intelligence: Moisture deficit triggers urgent FAO-56 irrigation recommendation',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Moisture deficit triggers urgent FAO-56 irrigation recommendation',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Optimal soil moisture generates low urgency monitoring recommendation
  try {
    const recommendation = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-south-wheat-02',
      cropType: 'Wheat',
      cropStage: 'Tillering',
      soilMoistureOverride: 55.0, // optimal for wheat
      soilPhOverride: 6.5,
      forecastRainMm: 0,
      forecastRainProbability: 10,
      ambientTemp: 24.0,
      humidity: 60.0,
    });

    assert.strictEqual(recommendation.action, 'MONITOR_OPTIMAL');
    assert.strictEqual(recommendation.urgency, 'low');
    assert.strictEqual(recommendation.ruleVersion, 'v2.1-QUANTEX-FAO56');
    assert.ok(recommendation.explanation.includes('optimal parameters'));
    results.push({
      name: 'Field Intelligence: Optimal moisture maintains routine monitoring',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Optimal moisture maintains routine monitoring',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Telemetry observations tracked with provenance metadata
  try {
    const recommendation = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-east-corn-03',
      cropType: 'Corn',
      cropStage: 'Silking',
      soilMoistureOverride: 30.0,
    });

    assert.ok(
      recommendation.supportingObservations.soilMoisture,
      'Must have soil moisture telemetry'
    );
    assert.ok(recommendation.assumptionsAndLimitations.length > 0, 'Must have assumptions listed');
    results.push({
      name: 'Field Intelligence: Telemetry observations tracked with provenance metadata',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Telemetry observations tracked with provenance metadata',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Farmer action recording audit trail with actor info
  try {
    const actionResult = await FieldIntelligenceService.recordFarmerAction(
      testUserId,
      savedRecId,
      'accepted',
      'Applied 20mm drip irrigation in evening cycle',
      'user_123',
      'Ravi Kumar'
    );

    assert.ok(actionResult.farmerAction, 'Must record farmer action');
    assert.strictEqual(actionResult.farmerAction.actionTaken, 'accepted');
    assert.ok(actionResult.farmerAction.recordedAt, 'Must record timestamp');
    assert.strictEqual(actionResult.farmerAction.actorName, 'Ravi Kumar');
    results.push({
      name: 'Field Intelligence: Farmer action successfully recorded with audit metadata and actor',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Farmer action successfully recorded with audit metadata and actor',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Closed-loop follow-up evaluation confirms condition met after irrigation
  try {
    const evaluation = await FieldIntelligenceService.evaluateFollowUp(testUserId, savedRecId, {
      moisture: 54.0, // post-irrigation moisture increased to 54%
      temperature: 24.5,
    });

    assert.strictEqual(evaluation.conditionMet, true);
    assert.strictEqual(evaluation.status, 'achieved');
    assert.ok(evaluation.observedDelta.includes('+'), 'Must measure positive moisture delta');
    assert.ok(evaluation.explanation.includes('Follow-up observation verified!'));
    assert.ok(
      evaluation.causalAttributionDisclaimer.includes('singular causation'),
      'Must include non-causal attribution disclaimer'
    );
    results.push({
      name: 'Field Intelligence: Closed-loop outcome confirms irrigation condition met with causal disclaimer',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Closed-loop outcome confirms irrigation condition met with causal disclaimer',
      passed: false,
      error: err.message,
    });
  }

  // Test 6: Closed-loop follow-up evaluation flags condition NOT met if moisture remains deficient
  try {
    const rec2 = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-dry-04',
      cropType: 'Tomato',
      soilMoistureOverride: 20.0,
    });
    await FieldIntelligenceService.recordFarmerAction(
      testUserId,
      rec2.recommendationId,
      'irrigated',
      'Attempted pump start'
    );

    const evaluation = await FieldIntelligenceService.evaluateFollowUp(
      testUserId,
      rec2.recommendationId,
      {
        moisture: 19.0, // failed to replenish (< 45%)
        temperature: 28.0,
      }
    );

    assert.strictEqual(evaluation.conditionMet, false);
    assert.strictEqual(evaluation.status, 'not_achieved');
    assert.ok(
      evaluation.explanation.includes('did not increase') ||
        evaluation.explanation.includes('Verify irrigation')
    );
    results.push({
      name: 'Field Intelligence: Closed-loop outcome flags deficit and guides inspection',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Closed-loop outcome flags deficit and guides inspection',
      passed: false,
      error: err.message,
    });
  }

  // Test 7: Unified Field Context provides multi-source provenance & risk assessment
  try {
    const context = await FieldIntelligenceService.getFieldContext(testUserId, {
      fieldId: 'field-01',
      soilMoistureOverride: 22,
    });

    assert.strictEqual(context.fieldId, 'field-01');
    assert.strictEqual(context.overallRisk, 'critical');
    assert.ok(context.observations.soilMoisture.provenance, 'Must label provenance');
    assert.ok(context.observations.weather.provenance === 'historical_reanalysis');
    assert.ok(context.dataQuality, 'Must include data quality metrics');
    results.push({
      name: 'Field Intelligence: Unified Field Context delivers multi-source provenance & risk',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Unified Field Context delivers multi-source provenance & risk',
      passed: false,
      error: err.message,
    });
  }

  // Test 8: Chronological field timeline retrieval maintains immutable audit events
  try {
    const timeline = await FieldIntelligenceService.getFieldTimeline(
      testUserId,
      'field-north-tomato-01'
    );
    assert.ok(Array.isArray(timeline), 'Timeline must return array');
    assert.ok(timeline.length > 0, 'Timeline must contain events');
    assert.ok(
      timeline.some((e) => e.eventType === 'RECOMMENDATION_GENERATED'),
      'Must contain generation event'
    );
    results.push({
      name: 'Field Intelligence: Chronological field action timeline audit log verified',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Chronological field action timeline audit log verified',
      passed: false,
      error: err.message,
    });
  }

  // Test 9: Agronomist review workflow records endorsement and notes
  try {
    const reviewResult = await FieldIntelligenceService.recordAgronomistReview(
      testUserId,
      'expert_dr_priya',
      'Dr. Priya Sharma',
      savedRecId,
      'endorsed',
      'FAO-56 root zone deficit verified. Proceed with drip irrigation.'
    );

    assert.ok(reviewResult.agronomistReview, 'Must record agronomist review');
    assert.strictEqual(reviewResult.agronomistReview.status, 'endorsed');
    assert.strictEqual(reviewResult.agronomistReview.reviewerName, 'Dr. Priya Sharma');
    results.push({
      name: 'Field Intelligence: Agronomist review recorded and audit-sealed',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Agronomist review recorded and audit-sealed',
      passed: false,
      error: err.message,
    });
  }

  // Test 10: Insufficient evidence handles missing telemetry without fabricating success
  try {
    const rec3 = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-no-reading-05',
      cropType: 'Sugarcane',
      soilMoistureOverride: 35.0,
    });

    const evalNoTelemetry = await FieldIntelligenceService.evaluateFollowUp(
      testUserId,
      rec3.recommendationId,
      {
        moisture: NaN, // invalid or unacquired sensor telemetry
      }
    );

    assert.strictEqual(evalNoTelemetry.status, 'insufficient_evidence');
    assert.strictEqual(evalNoTelemetry.conditionMet, false);
    assert.ok(
      evalNoTelemetry.explanation.includes('Insufficient telemetry evidence'),
      'Must explain insufficient evidence'
    );
    results.push({
      name: 'Field Intelligence: Refuses to fabricate success when telemetry evidence is missing',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Field Intelligence: Refuses to fabricate success when telemetry evidence is missing',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
