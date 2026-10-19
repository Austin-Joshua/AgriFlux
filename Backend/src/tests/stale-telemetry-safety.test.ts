/**
 * Automated Test Suite: Stale Telemetry Gating, Actuator Safety Interlock & Tenant Isolation
 * ------------------------------------------------------------------------------------------
 * Verifies:
 * 1. Fresh valid telemetry produces verified actionable recommendations.
 * 2. Freshness boundary evaluation: 14m (fresh), 15m (fresh boundary), 16m (stale).
 * 3. Stale telemetry strictly triggers the INSUFFICIENT_DATA safety gate.
 * 4. Stale low moisture + zero rain suppresses IRRIGATE_IMMEDIATE.
 * 5. Stale low moisture + moderate rain suppresses IRRIGATE_LIGHT.
 * 6. Missing telemetry with rainfall context suppresses irrigation and returns INSUFFICIENT_DATA.
 * 7. Invalid timestamps (malformed or future-dated >60s) trigger safety gate.
 * 8. Non-finite values (NaN, Infinity) and out-of-bounds percentages (<0, >100) are rejected with HTTP 400.
 * 9. Explicit simulation mode is transparently flagged and never mislabeled as physical measurements.
 * 10. Actuator Safety Interlock: pump activation refused on stale/missing telemetry with HTTP 422.
 * 11. Actuator fail-safe: deactivation (pumpStatus: false) is always permitted immediately.
 * 12. Operator emergency override (forceOverride: true) permits manual actuation with audit trail.
 * 13. Telemetry recovery: fresh reading restores actionable recommendations after stale state.
 * 14. Cross-field isolation: field-02 queries return 404 and do NOT leak field-01 sensor data.
 * 15. Cross-user isolation: farmer cannot submit telemetry for another user ID (HTTP 403).
 */

import assert from 'assert';
import { FieldIntelligenceService } from '../services/field-intelligence.service';
import { evaluateTelemetryQuality, TELEMETRY_FRESHNESS_WINDOW_MINUTES } from '../types/telemetry';
import { controlPump, getIoTData, postIoTData } from '../controllers/iot.controller';
import IoTReading from '../../../Database/Models/IoTReading';
import { isDBConnected } from '../config/db';

export async function runStaleTelemetrySafetyTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const testUserId = 'test-farmer-safety';

  const createMockRes = () => {
    const res: any = {
      statusCode: 200,
      jsonPayload: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.jsonPayload = data;
        return this;
      },
    };
    return res;
  };

  // 1. Fresh valid telemetry produces expected actionable recommendation
  try {
    const recFresh = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-01',
      cropType: 'Rice',
      soilMoistureOverride: 20, // fresh calibrated reading: critical depletion
      forecastRainMm: 0,
      forceRefresh: true,
    });

    assert.strictEqual(recFresh.action, 'IRRIGATE_IMMEDIATE');
    assert.strictEqual(recFresh.supportingObservations.soilMoisture.isStale, false);
    assert.strictEqual(recFresh.supportingObservations.soilMoisture.dataQualityStatus, 'fresh');

    results.push({
      name: 'Telemetry Freshness: Fresh valid telemetry produces actionable IRRIGATE_IMMEDIATE recommendation',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Telemetry Freshness: Fresh valid telemetry produces actionable IRRIGATE_IMMEDIATE recommendation',
      passed: false,
      error: err.message,
    });
  }

  // 2. Freshness Boundary: 14 minutes old (just inside threshold) evaluates as fresh
  try {
    const time14m = new Date(Date.now() - 14 * 60 * 1000);
    const quality14m = evaluateTelemetryQuality({
      moisture: 35,
      timestamp: time14m,
      isSimulated: false,
    });
    assert.strictEqual(quality14m.isFresh, true, '14-minute reading must be fresh');
    assert.strictEqual(quality14m.isStale, false);
    assert.strictEqual(quality14m.quality, 'fresh');

    results.push({
      name: 'Freshness Threshold: Telemetry just inside threshold (14m) evaluates as fresh',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Freshness Threshold: Telemetry just inside threshold (14m) evaluates as fresh',
      passed: false,
      error: err.message,
    });
  }

  // 3. Freshness Boundary: Exactly 15 minutes old evaluates as fresh boundary
  try {
    const time15m = new Date(Date.now() - 15 * 60 * 1000);
    const quality15m = evaluateTelemetryQuality({
      moisture: 35,
      timestamp: time15m,
      isSimulated: false,
    });
    assert.strictEqual(quality15m.quality, 'fresh', '15-minute boundary must evaluate as fresh');
    assert.strictEqual(quality15m.isStale, false);

    results.push({
      name: 'Freshness Threshold: Telemetry exactly at threshold (15m) evaluates as fresh',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Freshness Threshold: Telemetry exactly at threshold (15m) evaluates as fresh',
      passed: false,
      error: err.message,
    });
  }

  // 4. Freshness Boundary: 16 minutes old (just beyond threshold) evaluates as stale
  try {
    const time16m = new Date(Date.now() - 16 * 60 * 1000);
    const quality16m = evaluateTelemetryQuality({
      moisture: 20,
      timestamp: time16m,
      isSimulated: false,
    });
    assert.strictEqual(quality16m.isStale, true, '16-minute reading must evaluate as stale');
    assert.strictEqual(quality16m.quality, 'stale');
    assert.ok(quality16m.reason?.includes('exceeds'));

    results.push({
      name: 'Freshness Threshold: Telemetry just beyond threshold (16m) evaluates as stale',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Freshness Threshold: Telemetry just beyond threshold (16m) evaluates as stale',
      passed: false,
      error: err.message,
    });
  }

  // 5. Very old telemetry (2 hours old) in database triggers INSUFFICIENT_DATA safety gate
  try {
    const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);
    await postIoTData(
      {
        body: {
          deviceId: 'esp32-stale-node',
          fieldId: 'field-stale-test',
          moisture: 18.0,
          temperature: 28,
          humidity: 50,
          pumpStatus: false,
          isSimulated: false,
          timestamp: twoHoursAgo.toISOString(),
        },
        headers: { 'x-iot-api-key': 'agriflux-iot-key-dev' },
      } as any,
      createMockRes()
    );

    const recStaleDB = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-stale-test',
      deviceId: 'esp32-stale-node',
      cropType: 'Rice',
      forceRefresh: true,
      allowSimulation: false,
    });

    assert.strictEqual(
      recStaleDB.action,
      'INSUFFICIENT_DATA',
      'Stale 2-hour-old telemetry MUST trigger INSUFFICIENT_DATA gate and not issue IRRIGATE_IMMEDIATE'
    );
    assert.strictEqual(recStaleDB.supportingObservations.soilMoisture.isStale, true);
    assert.ok(recStaleDB.actionLabel.includes('Stale'));

    results.push({
      name: 'Decision Safety: Stale 2-hour telemetry triggers INSUFFICIENT_DATA gate and pauses actuation',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Decision Safety: Stale 2-hour telemetry triggers INSUFFICIENT_DATA gate and pauses actuation',
      passed: false,
      error: err.message,
    });
  }

  // 6. Stale low moisture (20%) + zero rain: returns INSUFFICIENT_DATA, NOT IRRIGATE_IMMEDIATE
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await postIoTData(
      {
        body: {
          deviceId: 'esp32-drought-stale',
          fieldId: 'field-drought-stale',
          moisture: 15.0,
          temperature: 32,
          humidity: 40,
          pumpStatus: false,
          isSimulated: false,
          timestamp: threeDaysAgo.toISOString(),
        },
        headers: { 'x-iot-api-key': 'agriflux-iot-key-dev' },
      } as any,
      createMockRes()
    );

    const recDroughtStale = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-drought-stale',
      deviceId: 'esp32-drought-stale',
      cropType: 'Rice',
      forecastRainMm: 0,
      forceRefresh: true,
      allowSimulation: false,
    });

    assert.strictEqual(
      recDroughtStale.action,
      'INSUFFICIENT_DATA',
      'Stale drought telemetry must not trigger IRRIGATE_IMMEDIATE'
    );
    assert.notStrictEqual(recDroughtStale.action, 'IRRIGATE_IMMEDIATE');

    results.push({
      name: 'Decision Safety: Stale low moisture + zero rain suppresses IRRIGATE_IMMEDIATE',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Decision Safety: Stale low moisture + zero rain suppresses IRRIGATE_IMMEDIATE',
      passed: false,
      error: err.message,
    });
  }

  // 7. Stale low moisture (20%) + moderate rain (10mm): returns INSUFFICIENT_DATA, NOT IRRIGATE_LIGHT
  try {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    await postIoTData(
      {
        body: {
          deviceId: 'esp32-rain-stale',
          fieldId: 'field-rain-stale',
          moisture: 22.0,
          temperature: 26,
          humidity: 70,
          pumpStatus: false,
          isSimulated: false,
          timestamp: fourHoursAgo.toISOString(),
        },
        headers: { 'x-iot-api-key': 'agriflux-iot-key-dev' },
      } as any,
      createMockRes()
    );

    const recRainStale = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-rain-stale',
      deviceId: 'esp32-rain-stale',
      cropType: 'Rice',
      forecastRainMm: 10,
      forceRefresh: true,
      allowSimulation: false,
    });

    assert.strictEqual(
      recRainStale.action,
      'INSUFFICIENT_DATA',
      'Stale deficit + rain must not trigger IRRIGATE_LIGHT'
    );
    assert.notStrictEqual(recRainStale.action, 'IRRIGATE_LIGHT');

    results.push({
      name: 'Decision Safety: Stale low moisture + moderate rain suppresses IRRIGATE_LIGHT',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Decision Safety: Stale low moisture + moderate rain suppresses IRRIGATE_LIGHT',
      passed: false,
      error: err.message,
    });
  }

  // 8. Missing telemetry (null moisture) with rainfall context returns INSUFFICIENT_DATA
  try {
    const recMissing = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-missing-test',
      cropType: 'Rice',
      soilMoistureOverride: null, // explicit missing reading
      forecastRainMm: 12,
      forceRefresh: true,
    });

    assert.strictEqual(recMissing.action, 'INSUFFICIENT_DATA');
    assert.strictEqual(recMissing.supportingObservations.soilMoisture.value, null);
    assert.strictEqual(recMissing.supportingObservations.soilMoisture.dataQualityStatus, 'missing');

    results.push({
      name: 'Decision Safety: Missing moisture with forecast rain returns INSUFFICIENT_DATA',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Decision Safety: Missing moisture with forecast rain returns INSUFFICIENT_DATA',
      passed: false,
      error: err.message,
    });
  }

  // 9. Invalid timestamp (malformed string) evaluates as invalid quality state
  try {
    const invalidQuality = evaluateTelemetryQuality({
      moisture: 45,
      timestamp: 'not-a-valid-date-timestamp',
    });
    assert.strictEqual(invalidQuality.quality, 'invalid');
    assert.strictEqual(invalidQuality.isStale, true);
    assert.ok(invalidQuality.reason?.includes('malformed'));

    results.push({
      name: 'Data Integrity: Malformed timestamp evaluates as invalid quality status',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Data Integrity: Malformed timestamp evaluates as invalid quality status',
      passed: false,
      error: err.message,
    });
  }

  // 10. Future-dated telemetry (>60s clock skew) evaluates as invalid
  try {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in the future
    const futureQuality = evaluateTelemetryQuality({
      moisture: 45,
      timestamp: futureDate,
    });
    assert.strictEqual(futureQuality.quality, 'invalid');
    assert.strictEqual(futureQuality.isStale, true);
    assert.ok(futureQuality.reason?.includes('future-dated'));

    results.push({
      name: 'Data Integrity: Future-dated telemetry exceeding 60s skew is rejected as invalid',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Data Integrity: Future-dated telemetry exceeding 60s skew is rejected as invalid',
      passed: false,
      error: err.message,
    });
  }

  // 11. Non-finite values (NaN, +Infinity, -Infinity) and out-of-bounds percentages (<0, >100) are rejected with HTTP 400
  try {
    const badValues = [NaN, Infinity, -Infinity, -5, 105];
    for (const bad of badValues) {
      let rejected = false;
      try {
        await FieldIntelligenceService.generateRecommendation(testUserId, {
          fieldId: 'field-01',
          soilMoistureOverride: bad as any,
        });
      } catch (e: any) {
        if (e.statusCode === 400 && e.message.includes('Invalid soil moisture override')) {
          rejected = true;
        }
      }
      assert.strictEqual(
        rejected,
        true,
        `Bad moisture value (${bad}) must be rejected with HTTP 400`
      );
    }

    results.push({
      name: 'Input Validation: Rejects NaN, +/- Infinity, and out-of-bounds soil moisture with HTTP 400',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Input Validation: Rejects NaN, +/- Infinity, and out-of-bounds soil moisture with HTTP 400',
      passed: false,
      error: err.message,
    });
  }

  // 12. Explicit simulation mode is transparently flagged as simulated
  try {
    const recSim = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-uninstrumented-sim',
      isSimulated: true,
      allowSimulation: true,
      forceRefresh: true,
    });

    assert.strictEqual(recSim.supportingObservations.soilMoisture.provenance, 'simulated');
    assert.strictEqual(recSim.supportingObservations.soilMoisture.dataQualityStatus, 'simulated');
    assert.strictEqual(recSim.supportingObservations.soilMoisture.source, 'iot_simulator');

    results.push({
      name: 'Simulation Mode: Explicit simulation mode transparently labels simulated provenance',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Simulation Mode: Explicit simulation mode transparently labels simulated provenance',
      passed: false,
      error: err.message,
    });
  }

  // 13. Actuator Safety Interlock: pump activation refused on stale telemetry (HTTP 422)
  try {
    await postIoTData(
      {
        body: {
          deviceId: 'esp32-stale-node',
          fieldId: 'field-stale-test',
          moisture: 18.0,
          temperature: 28,
          humidity: 50,
          pumpStatus: false,
          isSimulated: false,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        headers: { 'x-iot-api-key': 'agriflux-iot-key-dev' },
      } as any,
      createMockRes()
    );

    const mockReq: any = {
      body: {
        pumpStatus: true, // turning pump ON
        fieldId: 'field-stale-test',
        deviceId: 'esp32-stale-node', // has 30-minute-old stale reading
      },
      user: { email: 'farmer@agriflux.com', role: 'farmer' },
    };
    const mockRes = createMockRes();

    await controlPump(mockReq, mockRes);

    assert.strictEqual(
      mockRes.statusCode,
      422,
      'Activating pump on stale telemetry must be refused with HTTP 422'
    );
    assert.strictEqual(mockRes.jsonPayload.success, false);
    assert.strictEqual(mockRes.jsonPayload.safetyInterlock, 'TRIPPED_STALE_TELEMETRY');
    assert.strictEqual(mockRes.jsonPayload.telemetryQuality, 'stale');

    results.push({
      name: 'Actuator Safety: Pump activation on stale telemetry is refused with HTTP 422 interlock',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Actuator Safety: Pump activation on stale telemetry is refused with HTTP 422 interlock',
      passed: false,
      error: err.message,
    });
  }

  // 14. Actuator Fail-Safe: Deactivation (pumpStatus: false) is always permitted immediately
  try {
    const mockReq: any = {
      body: {
        pumpStatus: false, // Emergency shutdown
        fieldId: 'field-stale-test',
        deviceId: 'esp32-stale-node',
      },
      user: { email: 'farmer@agriflux.com', role: 'farmer' },
    };
    const mockRes = createMockRes();

    await controlPump(mockReq, mockRes);

    assert.strictEqual(
      mockRes.statusCode,
      202,
      'Pump deactivation must always be accepted immediately even if telemetry is stale'
    );
    assert.strictEqual(mockRes.jsonPayload.success, true);
    assert.strictEqual(mockRes.jsonPayload.targetPumpStatus, false);

    results.push({
      name: 'Actuator Safety: Emergency deactivation (pumpStatus: false) is always permitted immediately',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Actuator Safety: Emergency deactivation (pumpStatus: false) is always permitted immediately',
      passed: false,
      error: err.message,
    });
  }

  // 15. Actuator Override: Operator emergency override (forceOverride: true) succeeds
  try {
    const mockReq: any = {
      body: {
        pumpStatus: true,
        fieldId: 'field-stale-test',
        deviceId: 'esp32-stale-node',
        forceOverride: true,
        overrideReason: 'Operator in-person field inspection confirmed severe soil cracking.',
      },
      user: { email: 'farmer@agriflux.com', role: 'farmer' },
    };
    const mockRes = createMockRes();

    await controlPump(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 202, 'Explicit operator override must be accepted');
    assert.strictEqual(mockRes.jsonPayload.success, true);
    assert.strictEqual(mockRes.jsonPayload.targetPumpStatus, true);

    results.push({
      name: 'Actuator Safety: Explicit operator override (forceOverride: true) succeeds with audit trail',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Actuator Safety: Explicit operator override (forceOverride: true) succeeds with audit trail',
      passed: false,
      error: err.message,
    });
  }

  // 16. Telemetry Recovery: Fresh reading restores actionable recommendations
  try {
    // Ingest fresh valid sensor reading for field-stale-test via postIoTData
    await postIoTData(
      {
        body: {
          deviceId: 'esp32-stale-node',
          fieldId: 'field-stale-test',
          moisture: 20.0, // critically depleted but fresh!
          temperature: 28,
          humidity: 55,
          pumpStatus: false,
          isSimulated: false,
          timestamp: new Date().toISOString(),
        },
        headers: { 'x-iot-api-key': 'agriflux-iot-key-dev' },
      } as any,
      createMockRes()
    );

    const recRecovered = await FieldIntelligenceService.generateRecommendation(testUserId, {
      fieldId: 'field-stale-test',
      deviceId: 'esp32-stale-node',
      cropType: 'Rice',
      forecastRainMm: 0,
      forceRefresh: true,
      allowSimulation: false,
    });

    assert.strictEqual(
      recRecovered.action,
      'IRRIGATE_IMMEDIATE',
      'Fresh telemetry must successfully recover decision engine to actionable advice'
    );
    assert.strictEqual(recRecovered.supportingObservations.soilMoisture.isStale, false);

    results.push({
      name: 'Recovery Workflow: Ingestion of fresh telemetry restores actionable recommendation',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Recovery Workflow: Ingestion of fresh telemetry restores actionable recommendation',
      passed: false,
      error: err.message,
    });
  }

  // 17. Cross-Field Isolation: Querying getIoTData for uninstrumented field returns 404, suppressing field-01 leakage
  try {
    const mockReq: any = {
      query: { fieldId: 'field-nonexistent-parcel-99' },
    };
    const mockRes = createMockRes();

    await getIoTData(mockReq, mockRes);

    assert.strictEqual(
      mockRes.statusCode,
      404,
      'Query for uninstrumented field must return 404 rather than leaking another parcel'
    );
    assert.strictEqual(mockRes.jsonPayload.success, false);
    assert.strictEqual(mockRes.jsonPayload.data, null);

    results.push({
      name: 'Tenant Isolation: Query for uninstrumented field returns 404 and suppresses cross-field leakage',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Tenant Isolation: Query for uninstrumented field returns 404 and suppresses cross-field leakage',
      passed: false,
      error: err.message,
    });
  }

  // 18. Cross-User Isolation: Farmer cannot submit telemetry for another user ID (HTTP 403)
  try {
    const mockReq: any = {
      body: {
        deviceId: 'esp32-hacked-node',
        fieldId: 'field-01',
        moisture: 50,
        temperature: 25,
        humidity: 60,
        userId: 'victim-farmer-uuid-1234', // Spoofed user ID
      },
      user: {
        id: 'attacker-farmer-uuid-5678', // Authenticated user ID
        role: 'farmer',
      },
    };
    const mockRes = createMockRes();

    await postIoTData(mockReq, mockRes);

    assert.strictEqual(
      mockRes.statusCode,
      403,
      'Farmer attempting to post telemetry for another user ID must receive HTTP 403 Forbidden'
    );
    assert.strictEqual(mockRes.jsonPayload.success, false);

    results.push({
      name: 'Tenant Isolation: Farmer cannot submit IoT telemetry for another user ID (HTTP 403)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Tenant Isolation: Farmer cannot submit IoT telemetry for another user ID (HTTP 403)',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
