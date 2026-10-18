import assert from 'assert';
import { FieldIntelligenceService } from '../services/field-intelligence.service';
import { AIService } from '../services/ai.service';
import { BlockchainService } from '../services/blockchain.service';

interface TestResult {
  id: number;
  scenario: string;
  inputDescription: string;
  actualAction: string;
  actualUrgency: string;
  actualExplanation: string;
  expectedBehavior: string;
  status: 'PASS' | 'FAIL' | 'REQUIRES_DOMAIN_REVIEW';
  reasoning: string;
}

async function runAuditMatrix() {
  const results: TestResult[] = [];
  console.log('===============================================================');
  console.log('       AGRIFLUX DECISION ENGINE AUDIT TEST MATRIX EXECUTION    ');
  console.log('===============================================================\n');

  // Scenario 1: Normal field conditions
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-02',
      cropType: 'Rice',
      cropStage: 'Vegetative',
      soilMoistureOverride: 55,
      ambientTemp: 28,
      humidity: 60,
      forecastRainMm: 0,
      forecastRainProbability: 0,
      forceRefresh: true,
    });
    const pass = res.action === 'MONITOR_OPTIMAL' && res.urgency === 'low';
    results.push({
      id: 1,
      scenario: 'Normal field conditions',
      inputDescription: 'Moisture: 55%, Temp: 28°C, Humidity: 60%, Rain: 0mm',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 80) + '...',
      expectedBehavior: 'MONITOR_OPTIMAL / low urgency',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Within optimal moisture (45-60%) and climate targets.',
    });
  } catch (err: any) {
    results.push({
      id: 1,
      scenario: 'Normal field conditions',
      inputDescription: 'Moisture: 55%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'MONITOR_OPTIMAL',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 2: Moisture below configured irrigation threshold (Critical Deficit)
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      cropType: 'Rice',
      cropStage: 'Tillering',
      soilMoistureOverride: 18,
      ambientTemp: 30,
      humidity: 50,
      forecastRainMm: 0,
      forceRefresh: true,
    });
    const pass = res.action === 'IRRIGATE_IMMEDIATE' && res.urgency === 'critical';
    results.push({
      id: 2,
      scenario: 'Moisture below configured irrigation threshold (<20%)',
      inputDescription: 'Moisture: 18%, Rain: 0mm',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 80) + '...',
      expectedBehavior: 'IRRIGATE_IMMEDIATE / critical urgency',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Critical root-zone depletion below 20% triggers critical urgency.',
    });
  } catch (err: any) {
    results.push({
      id: 2,
      scenario: 'Moisture below configured irrigation threshold',
      inputDescription: 'Moisture: 18%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'IRRIGATE_IMMEDIATE',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 3: Moisture near decision boundary (27.9% vs 28.1%)
  try {
    const resBelow = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      cropType: 'Rice',
      soilMoistureOverride: 27.9,
      forecastRainMm: 0,
      forceRefresh: true,
    });
    const resAbove = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      cropType: 'Rice',
      soilMoistureOverride: 28.1,
      forecastRainMm: 0,
      forceRefresh: true,
    });
    const pass = resBelow.action === 'IRRIGATE_IMMEDIATE' && resAbove.action === 'IRRIGATE_LIGHT';
    results.push({
      id: 3,
      scenario: 'Moisture near the decision boundary (27.9% vs 28.1%)',
      inputDescription: 'Moisture: 27.9% vs 28.1%',
      actualAction: `${resBelow.action} vs ${resAbove.action}`,
      actualUrgency: `${resBelow.urgency} vs ${resAbove.urgency}`,
      actualExplanation: `27.9% -> ${resBelow.action}, 28.1% -> ${resAbove.action}`,
      expectedBehavior: '27.9% -> IRRIGATE_IMMEDIATE, 28.1% -> IRRIGATE_LIGHT',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Hard boundary transition at exactly 28% without hysteresis buffer.',
    });
  } catch (err: any) {
    results.push({
      id: 3,
      scenario: 'Moisture near the decision boundary',
      inputDescription: '27.9% vs 28.1%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Boundary transition',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 4: Moisture above configured threshold (Optimal upper bound 58%)
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-02',
      cropType: 'Rice',
      soilMoistureOverride: 58,
      ambientTemp: 26,
      forecastRainMm: 0,
      forceRefresh: true,
    });
    const pass = res.action === 'MONITOR_OPTIMAL' && res.urgency === 'low';
    results.push({
      id: 4,
      scenario: 'Moisture above configured threshold (58%)',
      inputDescription: 'Moisture: 58%',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 80) + '...',
      expectedBehavior: 'MONITOR_OPTIMAL / low',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Moisture in optimal 45-60% band without nutrient/heat stress.',
    });
  } catch (err: any) {
    results.push({
      id: 4,
      scenario: 'Moisture above configured threshold',
      inputDescription: '58%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'MONITOR_OPTIMAL',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 5: Excessively high moisture (>75%)
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-03',
      cropType: 'Rice',
      soilMoistureOverride: 85,
      forceRefresh: true,
    });
    const pass = res.action === 'POSTPONE_IRRIGATION' && res.urgency === 'high';
    results.push({
      id: 5,
      scenario: 'Excessively high moisture (85%)',
      inputDescription: 'Moisture: 85%',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 80) + '...',
      expectedBehavior: 'POSTPONE_IRRIGATION / high urgency',
      status: pass ? 'PASS' : 'FAIL',
      reasoning:
        'Moisture > 82% triggers POSTPONE_IRRIGATION with high urgency due to hypoxia risk.',
    });
  } catch (err: any) {
    results.push({
      id: 5,
      scenario: 'Excessively high moisture',
      inputDescription: '85%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'POSTPONE_IRRIGATION',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 6: Missing root-zone moisture (Explicit null override)
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: null as any,
      forceRefresh: true,
    });
    const pass = res.action === 'INSUFFICIENT_DATA';
    results.push({
      id: 6,
      scenario: 'Missing root-zone moisture (explicit null)',
      inputDescription: 'soilMoistureOverride: null',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 80) + '...',
      expectedBehavior: 'INSUFFICIENT_DATA',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Data quality gate triggers when sensor reading is null.',
    });
  } catch (err: any) {
    results.push({
      id: 6,
      scenario: 'Missing root-zone moisture',
      inputDescription: 'null',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'INSUFFICIENT_DATA',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 7: Missing or stale weather data
  try {
    // When weather query returns empty or default
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 35,
      forceRefresh: true,
    });
    const hasWeatherSource = !!res.supportingObservations?.recentRainfall3dMm;
    results.push({
      id: 7,
      scenario: 'Missing or stale weather data handling',
      inputDescription: 'Default weather integration',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: `Weather source: ${res.supportingObservations?.recentRainfall3dMm?.source}`,
      expectedBehavior: 'Graceful fallback with explicit provenance label',
      status: hasWeatherSource ? 'PASS' : 'FAIL',
      reasoning: 'Fallbacks to ERA5 reanalysis defaults (4.2 mm/day ET0, 0mm rain).',
    });
  } catch (err: any) {
    results.push({
      id: 7,
      scenario: 'Missing or stale weather data',
      inputDescription: 'default',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Fallback',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 8: Invalid or physically implausible values (Moisture = NaN / "invalid")
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      cropType: 'Rice',
      soilMoistureOverride: NaN,
      forceRefresh: true,
    });
    // Expected behavior: NaN should reject or trigger INSUFFICIENT_DATA
    const pass = res.action === 'INSUFFICIENT_DATA';
    results.push({
      id: 8,
      scenario: 'Invalid or physically implausible values (Moisture = NaN)',
      inputDescription: 'soilMoistureOverride: NaN',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 80) + '...',
      expectedBehavior: 'INSUFFICIENT_DATA or input rejection',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: pass
        ? 'Safely caught NaN'
        : `DEFECT: NaN moisture fell through to ${res.action} with explanation: "${res.explanation}"`,
    });
  } catch (err: any) {
    results.push({
      id: 8,
      scenario: 'Invalid or physically implausible values',
      inputDescription: 'NaN',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Rejection or INSUFFICIENT_DATA',
      status: 'PASS',
      reasoning: 'Rejected with error: ' + err.message,
    });
  }

  // Scenario 9: Missing soil properties needed for calculation
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 50,
      soilPhOverride: undefined,
      nitrogenOverride: undefined,
      forceRefresh: true,
    });
    const hasBenchmark =
      res.supportingObservations?.soilHealthCard?.source?.includes('ICAR-TNAU') ||
      res.supportingObservations?.soilHealthCard?.source?.includes('Soil');
    results.push({
      id: 9,
      scenario: 'Missing soil properties (relies on Soil Health Card benchmark)',
      inputDescription: 'No soil override provided',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: `Soil Source: ${res.supportingObservations?.soilHealthCard?.source}`,
      expectedBehavior: 'Uses regional Soil Health Card benchmark with explicit attribution',
      status: hasBenchmark ? 'PASS' : 'FAIL',
      reasoning: 'Attributed to ICAR-TNAU Soil Health Card baseline.',
    });
  } catch (err: any) {
    results.push({
      id: 9,
      scenario: 'Missing soil properties',
      inputDescription: 'undefined',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Benchmark attribution',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 10: Invalid units or inconsistent input representations (Moisture = -50 or 150)
  try {
    const resNegative = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: -50,
      forceRefresh: true,
    });
    const resExcess = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 150,
      forceRefresh: true,
    });
    const negValue = resNegative.supportingObservations?.soilMoisture?.value;
    const excessValue = resExcess.supportingObservations?.soilMoisture?.value;
    // Current code clamps -50 to 0 and 150 to 100
    results.push({
      id: 10,
      scenario: 'Invalid units or out-of-range input (-50% and 150%)',
      inputDescription: '-50% and 150%',
      actualAction: `${resNegative.action} (-50% clamped to ${negValue}%) vs ${resExcess.action} (150% clamped to ${excessValue}%)`,
      actualUrgency: `${resNegative.urgency} vs ${resExcess.urgency}`,
      actualExplanation: `Clamped to [0, 100] instead of rejecting unphysical sensor input.`,
      expectedBehavior: 'Reject unphysical input or flag calibration fault',
      status: 'REQUIRES_DOMAIN_REVIEW',
      reasoning: 'Silent clamping of -50% to 0% and 150% to 100% hides sensor hardware faults.',
    });
  } catch (err: any) {
    results.push({
      id: 10,
      scenario: 'Invalid units or out-of-range input',
      inputDescription: '-50%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Rejection',
      status: 'PASS',
      reasoning: err.message,
    });
  }

  // Scenario 11: Conflicting signals (Low moisture 20% vs Inbound heavy rain 25mm)
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      cropType: 'Rice',
      soilMoistureOverride: 20,
      forecastRainMm: 25,
      forecastRainProbability: 80,
      forceRefresh: true,
    });
    const pass = res.action === 'POSTPONE_IRRIGATION';
    results.push({
      id: 11,
      scenario: 'Conflicting signals (Low moisture 20% vs Inbound heavy rain 25mm/80%)',
      inputDescription: 'Moisture: 20%, Rain: 25mm @ 80%',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 100) + '...',
      expectedBehavior: 'POSTPONE_IRRIGATION (Rule 1 takes precedence over Rule 2)',
      status: pass ? 'PASS' : 'FAIL',
      reasoning:
        'Rain protection correctly takes precedence over irrigation to prevent flood runoff.',
    });
  } catch (err: any) {
    results.push({
      id: 11,
      scenario: 'Conflicting signals',
      inputDescription: '20% + 25mm rain',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'POSTPONE_IRRIGATION',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 12: Conflicting signals (Low moisture 20% vs Moderate inbound rain 12mm)
  try {
    const res = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      cropType: 'Rice',
      soilMoistureOverride: 20,
      forecastRainMm: 12,
      forecastRainProbability: 50,
      forceRefresh: true,
    });
    // Let's see what happens here!
    const isDefect = res.action === 'MONITOR_OPTIMAL';
    results.push({
      id: 12,
      scenario: 'Conflicting signals (Low moisture 20% vs Moderate rain 12mm)',
      inputDescription: 'Moisture: 20%, Forecast Rain: 12mm',
      actualAction: res.action,
      actualUrgency: res.urgency,
      actualExplanation: res.explanation.substring(0, 100) + '...',
      expectedBehavior: 'IRRIGATE_LIGHT or POSTPONE_IRRIGATION with drought warning (NOT optimal)',
      status: isDefect ? 'FAIL' : 'PASS',
      reasoning: isDefect
        ? 'DEFECT: Falls through to MONITOR_OPTIMAL claiming 20% soil moisture is optimal!'
        : 'Handled correctly.',
    });
  } catch (err: any) {
    results.push({
      id: 12,
      scenario: 'Conflicting signals (20% + 12mm)',
      inputDescription: '20% + 12mm',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Not optimal',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 13: Field with simulated telemetry (explicit simulation flag required)
  try {
    const resNoSim = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-02',
      forceRefresh: true,
    });
    const resSim = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-02',
      allowSimulation: true,
      forceRefresh: true,
    });
    const provenance = resSim.supportingObservations?.soilMoisture?.dataQualityStatus;
    const safeMissing = resNoSim.action === 'INSUFFICIENT_DATA';
    const pass = safeMissing && provenance === 'simulated';
    results.push({
      id: 13,
      scenario: 'Simulated telemetry isolation (prohibited implicitly, permitted with flag)',
      inputDescription: 'No flag -> INSUFFICIENT_DATA; allowSimulation: true -> simulated',
      actualAction: `No flag: ${resNoSim.action} | With flag: ${resSim.action}`,
      actualUrgency: resSim.urgency,
      actualExplanation: `Quality Status: ${provenance}, Source: ${resSim.supportingObservations?.soilMoisture?.source}`,
      expectedBehavior: 'Explicitly labeled as simulated telemetry only when requested',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Correctly prevented implicit simulation and tagged explicit simulation mode.',
    });
  } catch (err: any) {
    results.push({
      id: 13,
      scenario: 'Field with simulated telemetry',
      inputDescription: 'field-02',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'simulated label',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 14: Repeated identical inputs (Determinism & Idempotency)
  try {
    const input = {
      fieldId: 'field-01',
      cropType: 'Rice',
      cropStage: 'Vegetative',
      soilMoistureOverride: 22,
      forecastRainMm: 0,
      forceRefresh: true,
    };
    const res1 = await FieldIntelligenceService.generateRecommendation('audit-user-1', input);
    const res2 = await FieldIntelligenceService.generateRecommendation('audit-user-1', input);
    const deterministic =
      res1.action === res2.action &&
      res1.urgency === res2.urgency &&
      res1.explanation === res2.explanation;
    results.push({
      id: 14,
      scenario: 'Repeated identical inputs (Determinism)',
      inputDescription: '2 consecutive runs with identical inputs',
      actualAction: `${res1.action} == ${res2.action}`,
      actualUrgency: `${res1.urgency} == ${res2.urgency}`,
      actualExplanation: 'Identical decision outcome and explanation generated.',
      expectedBehavior: 'Identical recommendation, action, and urgency',
      status: deterministic ? 'PASS' : 'FAIL',
      reasoning: 'Engine calculations are deterministic for normalized inputs.',
    });
  } catch (err: any) {
    results.push({
      id: 14,
      scenario: 'Repeated identical inputs',
      inputDescription: 'Identical input',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Determinism',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 15: Small input changes around decision thresholds (41.9% vs 42.1%)
  try {
    const resBelow = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 41.9,
      forecastRainMm: 0,
      forceRefresh: true,
    });
    const resAbove = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 42.1,
      forecastRainMm: 0,
      forceRefresh: true,
    });
    const pass = resBelow.action === 'IRRIGATE_LIGHT' && resAbove.action === 'MONITOR_OPTIMAL';
    results.push({
      id: 15,
      scenario: 'Threshold boundary transition (41.9% vs 42.1%)',
      inputDescription: '41.9% vs 42.1%',
      actualAction: `${resBelow.action} vs ${resAbove.action}`,
      actualUrgency: `${resBelow.urgency} vs ${resAbove.urgency}`,
      actualExplanation: `41.9% -> ${resBelow.action}, 42.1% -> ${resAbove.action}`,
      expectedBehavior: '41.9% -> IRRIGATE_LIGHT, 42.1% -> MONITOR_OPTIMAL',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Transition boundary at 42% operates as coded.',
    });
  } catch (err: any) {
    results.push({
      id: 15,
      scenario: 'Threshold boundary transition',
      inputDescription: '41.9% vs 42.1%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Transition',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 16: Follow-up evaluation with missing post-action evidence
  try {
    const rec = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 20,
      forceRefresh: true,
    });
    const evalRes = await FieldIntelligenceService.evaluateFollowUp(
      'audit-user-1',
      rec.recommendationId,
      {
        moisture: NaN,
      }
    );
    const pass = evalRes.status === 'insufficient_evidence' && !evalRes.conditionMet;
    results.push({
      id: 16,
      scenario: 'Follow-up evaluation with missing post-action telemetry (moisture: NaN)',
      inputDescription: 'subsequentTelemetry: { moisture: NaN }',
      actualAction: evalRes.status,
      actualUrgency: 'N/A',
      actualExplanation: evalRes.explanation.substring(0, 80) + '...',
      expectedBehavior: 'status: insufficient_evidence, conditionMet: false',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Refuses to fabricate success when empirical telemetry is invalid.',
    });
  } catch (err: any) {
    results.push({
      id: 16,
      scenario: 'Follow-up evaluation with missing telemetry',
      inputDescription: 'NaN',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'insufficient_evidence',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 17: Follow-up evaluation with excessive over-irrigation (Moisture 20% -> 85%)
  try {
    const rec = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 20,
      forceRefresh: true,
    });
    await FieldIntelligenceService.recordFarmerAction(
      'audit-user-1',
      rec.recommendationId,
      'irrigated'
    );
    const evalRes = await FieldIntelligenceService.evaluateFollowUp(
      'audit-user-1',
      rec.recommendationId,
      {
        moisture: 88,
      }
    );
    // If it says 'achieved' when 88% is severely waterlogged, that's an agronomic issue!
    const isWaterlogged = evalRes.status === 'achieved';
    results.push({
      id: 17,
      scenario: 'Follow-up evaluation after extreme over-irrigation (20% -> 88%)',
      inputDescription: 'Baseline 20%, follow-up 88% (hypoxic waterlogging)',
      actualAction: evalRes.status,
      actualUrgency: 'N/A',
      actualExplanation: evalRes.explanation.substring(0, 90) + '...',
      expectedBehavior: 'Flag over-saturation / waterlogging risk instead of unreserved success',
      status: isWaterlogged ? 'FAIL' : 'PASS',
      reasoning: isWaterlogged
        ? 'DEFECT: Marks 88% moisture as 100% "achieved" despite exceeding field capacity (hypoxia risk).'
        : 'Correctly flagged.',
    });
  } catch (err: any) {
    results.push({
      id: 17,
      scenario: 'Follow-up evaluation over-irrigation',
      inputDescription: '88%',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Waterlogging warning',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 18: Unauthorized access to another farmer's recommendation
  try {
    const rec = await FieldIntelligenceService.generateRecommendation('farmer-alice', {
      fieldId: 'field-01',
      soilMoistureOverride: 25,
      forceRefresh: true,
    });
    let blocked = false;
    try {
      await FieldIntelligenceService.recordFarmerAction(
        'farmer-mallory',
        rec.recommendationId,
        'irrigated'
      );
    } catch (authErr: any) {
      if (authErr.statusCode === 403 || authErr.message.includes('Access denied')) {
        blocked = true;
      }
    }
    results.push({
      id: 18,
      scenario: "Unauthorized access to another farmer's recommendation",
      inputDescription: 'farmer-mallory acts on farmer-alice recommendation',
      actualAction: blocked ? 'BLOCKED (403 Forbidden)' : 'ALLOWED (Security Leak)',
      actualUrgency: 'N/A',
      actualExplanation: blocked ? 'Ownership isolation enforced.' : 'Cross-tenant action allowed.',
      expectedBehavior: '403 Forbidden / Access denied',
      status: blocked ? 'PASS' : 'FAIL',
      reasoning: blocked
        ? 'Tenant isolation successfully enforced.'
        : 'DEFECT: Cross-farmer action permitted.',
    });
  } catch (err: any) {
    results.push({
      id: 18,
      scenario: 'Unauthorized access',
      inputDescription: 'Cross-tenant',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: '403 Forbidden',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 19: AI Yield Prediction bounds handling (AIService.predictYield with negative/extreme NPK)
  try {
    const yieldRes = await AIService.predictYield({
      cropType: 'Rice',
      nitrogen: -100,
      phosphorus: 9999,
      potassium: -50,
      soilPh: 1.5,
    });
    const pass = yieldRes.predicted > 0 && yieldRes.risk === 'High';
    results.push({
      id: 19,
      scenario: 'AI Yield Prediction with extreme out-of-range NPK & pH',
      inputDescription: 'N: -100, P: 9999, K: -50, pH: 1.5',
      actualAction: `Predicted: ${yieldRes.predicted} kg/ha, Risk: ${yieldRes.risk}`,
      actualUrgency: yieldRes.risk,
      actualExplanation: `Clamped safely, suggestions: ${yieldRes.suggestions.length}`,
      expectedBehavior: 'Clamped NPK & pH bounds, non-negative yield, High risk',
      status: pass ? 'PASS' : 'FAIL',
      reasoning: 'Input clamping protects against NaN and negative yield.',
    });
  } catch (err: any) {
    results.push({
      id: 19,
      scenario: 'AI Yield Prediction extreme inputs',
      inputDescription: 'Out of bounds',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: 'Clamped output',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Scenario 20: Duplicate blockchain block append during Agronomist Review
  try {
    const rec = await FieldIntelligenceService.generateRecommendation('audit-user-1', {
      fieldId: 'field-01',
      soilMoistureOverride: 24,
      forceRefresh: true,
    });
    const bc = BlockchainService.getInstance();
    const countBefore = bc.getChain().length;
    await FieldIntelligenceService.recordAgronomistReview(
      'audit-user-1',
      'agronomist-01',
      'Dr. Test',
      rec.recommendationId,
      'endorsed',
      'Test review'
    );
    const countAfter = bc.getChain().length;
    const blocksAdded = countAfter - countBefore;
    results.push({
      id: 20,
      scenario: 'Cryptographic Audit Block append on Agronomist Review',
      inputDescription: '1 agronomist review record',
      actualAction: `${blocksAdded} block(s) appended`,
      actualUrgency: 'N/A',
      actualExplanation: `Chain grew by ${blocksAdded} block(s) (expected exactly 1).`,
      expectedBehavior: 'Exactly 1 PRESCRIPTION_AUDIT block appended',
      status: blocksAdded === 1 ? 'PASS' : 'FAIL',
      reasoning:
        blocksAdded === 1
          ? 'Exactly 1 block added.'
          : `DEFECT: Added ${blocksAdded} blocks due to double call in recordAgronomistReview.`,
    });
  } catch (err: any) {
    results.push({
      id: 20,
      scenario: 'Cryptographic Audit Block append',
      inputDescription: '1 review',
      actualAction: 'ERROR',
      actualUrgency: 'ERROR',
      actualExplanation: err.message,
      expectedBehavior: '1 block',
      status: 'FAIL',
      reasoning: err.message,
    });
  }

  // Print Summary Table
  console.log('| ID | Scenario | Status | Actual Action / Result | Reasoning |');
  console.log('|---|---|---|---|---|');
  for (const r of results) {
    console.log(
      `| ${r.id} | ${r.scenario} | **${r.status}** | ${r.actualAction} | ${r.reasoning} |`
    );
  }

  console.log('\n===============================================================');
  const passes = results.filter((r) => r.status === 'PASS').length;
  const fails = results.filter((r) => r.status === 'FAIL').length;
  const reviews = results.filter((r) => r.status === 'REQUIRES_DOMAIN_REVIEW').length;
  console.log(
    `Total: ${results.length} | Passed: ${passes} | Failed: ${fails} | Domain Review: ${reviews}`
  );
  console.log('===============================================================');
}

runAuditMatrix().catch(console.error);
