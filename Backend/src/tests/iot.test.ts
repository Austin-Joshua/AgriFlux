/**
 * AgriFlux Automated Test Suite: IoT Telemetry Ingestion & Validation
 * Verifies strict validation of physical sensor bounds, rejection of missing data
 * (no silent coercion to zero), freshness thresholds, and history retrieval.
 */
import assert from 'assert';
import { Request, Response } from 'express';
import { postIoTData, getIoTData, getIoTHistory } from '../controllers/iot.controller';

export async function runIoTTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function createMockRes() {
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  }

  // Test 1: Ingestion rejects missing moisture (does NOT silently coerce to 0)
  try {
    const req: Partial<Request> = {
      body: {
        temperature: 25.0,
        humidity: 60.0,
        // missing moisture
      },
    };
    const res = createMockRes();
    await postIoTData(req as Request, res as Response);

    assert.strictEqual(res.statusCode, 400, 'Missing moisture must return 400');
    assert.strictEqual(res.jsonData.success, false, 'Payload must indicate failure');
    assert.ok(res.jsonData.message.includes('moisture'), 'Error must specify moisture requirement');
    results.push({
      name: 'IoT ingestion rejects missing moisture (no silent coercion to 0)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'IoT ingestion rejects missing moisture (no silent coercion to 0)',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Ingestion rejects moisture out of physical range (> 100%)
  try {
    const req: Partial<Request> = {
      body: {
        moisture: 145.0,
        temperature: 25.0,
        humidity: 60.0,
      },
    };
    const res = createMockRes();
    await postIoTData(req as Request, res as Response);

    assert.strictEqual(res.statusCode, 400, 'Moisture > 100% must return 400');
    assert.strictEqual(res.jsonData.success, false);
    assert.ok(res.jsonData.message.includes('out of physical range'), 'Must flag range violation');
    results.push({
      name: 'IoT ingestion rejects out-of-bounds soil moisture (145%)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'IoT ingestion rejects out-of-bounds soil moisture (145%)',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Ingestion rejects unphysical temperature (< -10°C or > 60°C)
  try {
    const req: Partial<Request> = {
      body: {
        moisture: 45.0,
        temperature: 85.0, // unphysical ambient temp
        humidity: 60.0,
      },
    };
    const res = createMockRes();
    await postIoTData(req as Request, res as Response);

    assert.strictEqual(res.statusCode, 400, 'Temperature > 60C must return 400');
    assert.ok(res.jsonData.message.includes('out of plausible range'));
    results.push({ name: 'IoT ingestion rejects implausible temperature (85°C)', passed: true });
  } catch (err: any) {
    results.push({
      name: 'IoT ingestion rejects implausible temperature (85°C)',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Ingestion accepts valid physical telemetry and updates state
  try {
    const req: Partial<Request> = {
      body: {
        deviceId: 'esp32-field-unit-01',
        moisture: 38.5,
        temperature: 26.2,
        humidity: 55.0,
        pumpStatus: false,
        isSimulated: true,
      },
    };
    const res = createMockRes();
    await postIoTData(req as Request, res as Response);

    assert.strictEqual(res.statusCode, 200, 'Valid telemetry must return 200');
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.data.moisture, 38.5);
    assert.strictEqual(res.jsonData.data.temperature, 26.2);
    assert.strictEqual(
      res.jsonData.data.status,
      'warning',
      '38.5% moisture triggers warning status'
    );
    results.push({
      name: 'IoT ingestion accepts valid telemetry with calibrated status',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'IoT ingestion accepts valid telemetry with calibrated status',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: getIoTData provides real-time state with freshness metadata
  try {
    const req: Partial<Request> = {};
    const res = createMockRes();
    await getIoTData(req as Request, res as Response);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.ok(res.jsonData.data.timestamp, 'Timestamp must exist');
    assert.strictEqual(typeof res.jsonData.data.isStale, 'boolean', 'isStale must be boolean');
    results.push({
      name: 'getIoTData returns real-time telemetry with freshness flags',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'getIoTData returns real-time telemetry with freshness flags',
      passed: false,
      error: err.message,
    });
  }

  // Test 6: getIoTHistory retrieves buffered history without crashes
  try {
    const req: Partial<Request> = {
      query: { limit: '10' },
    };
    const res = createMockRes();
    await getIoTHistory(req as Request, res as Response);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.ok(Array.isArray(res.jsonData.data), 'History data must be an array');
    assert.ok(res.jsonData.data.length > 0, 'History should contain buffered records');
    results.push({ name: 'getIoTHistory returns telemetry series for charting', passed: true });
  } catch (err: any) {
    results.push({
      name: 'getIoTHistory returns telemetry series for charting',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
