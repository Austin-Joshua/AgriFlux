/**
 * Automated Test Suite: IoT Actuator State Machine & Acknowledgement Protocol
 * Verifies:
 * 1. Actuator command issuing (status: 'accepted', pending hardware acknowledgement)
 * 2. Does NOT claim pump is active solely because command was issued
 * 3. Physical acknowledgement protocol (POST /api/iot-data/actuator-ack)
 * 4. Diagnostic status endpoint (/api/iot-data/actuator-state)
 */
import assert from 'assert';
import { controlPump, acknowledgeActuator, getActuatorState } from '../controllers/iot.controller';

export async function runActuatorStateMachineTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Helper mock for Express response
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

  let generatedCommandId = '';

  // Test 1: Issuing command transitions to 'accepted' and pending acknowledgement
  try {
    const mockReq: any = {
      body: { pumpStatus: true },
      user: { email: 'farmer@agriflux.com', role: 'farmer' },
    };
    const mockRes = createMockRes();

    await controlPump(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 202, 'Command should return 202 Accepted');
    assert.strictEqual(mockRes.jsonPayload.success, true);
    assert.strictEqual(mockRes.jsonPayload.commandState, 'accepted');
    assert.strictEqual(mockRes.jsonPayload.actuatorState, 'pending_acknowledgement');
    assert.ok(mockRes.jsonPayload.commandId.startsWith('cmd_'));
    assert.ok(mockRes.jsonPayload.disclaimer.includes('Safety Protocol'));

    generatedCommandId = mockRes.jsonPayload.commandId;

    results.push({
      name: 'Actuator State Machine: Command queued in accepted state without premature activation claim',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Actuator State Machine: Command queued in accepted state without premature activation claim',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Checking actuator state shows active command pending acknowledgement
  try {
    const mockReq: any = {};
    const mockRes = createMockRes();

    await getActuatorState(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 200);
    assert.ok(mockRes.jsonPayload.actuator.activeCommand);
    assert.strictEqual(mockRes.jsonPayload.actuator.activeCommand.commandId, generatedCommandId);
    assert.strictEqual(mockRes.jsonPayload.actuator.activeCommand.status, 'accepted');

    results.push({
      name: 'Actuator State Machine: Diagnostics report pending command awaiting hardware relay switch',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Actuator State Machine: Diagnostics report pending command awaiting hardware relay switch',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Hardware acknowledgement transitions command to 'acknowledged' and updates pump state
  try {
    const mockReq: any = {
      body: {
        commandId: generatedCommandId,
        status: 'acknowledged',
        flowRateLpm: 12.5,
        durationSeconds: 300,
      },
    };
    const mockRes = createMockRes();

    await acknowledgeActuator(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonPayload.success, true);
    assert.strictEqual(mockRes.jsonPayload.command.status, 'acknowledged');
    assert.strictEqual(mockRes.jsonPayload.currentPumpStatus, true);
    assert.ok(mockRes.jsonPayload.command.executionMetrics.flowRateLpm === 12.5);

    results.push({
      name: 'Actuator State Machine: Hardware acknowledgement confirms physical actuation and flow metrics',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Actuator State Machine: Hardware acknowledgement confirms physical actuation and flow metrics',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Rejects missing pumpStatus parameter
  try {
    const mockReq: any = {
      body: {}, // missing pumpStatus
      user: { email: 'farmer@agriflux.com' },
    };
    const mockRes = createMockRes();

    await controlPump(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 400);
    assert.strictEqual(mockRes.jsonPayload.success, false);

    results.push({
      name: 'Actuator State Machine: Rejects invalid or missing pumpStatus parameter',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Actuator State Machine: Rejects invalid or missing pumpStatus parameter',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
