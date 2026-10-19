import { Request, Response } from 'express';
import crypto from 'crypto';
import { getIO } from '../socket';
import IoTReading from '../../../Database/Models/IoTReading';
import { isDBConnected } from '../config/db';
import { evaluateTelemetryQuality } from '../types/telemetry';

/**
 * AgriFlux IoT Intelligence Controller
 * -----------------------------------
 * Manages real-time data flow from ESP32 nodes to the AgriFlux dashboard.
 * Supports persistent telemetry storage in MongoDB with memory fallback.
 */

export interface IoTReadingData {
  deviceId: string;
  fieldId?: string;
  farmId?: string;
  userId?: string;
  moisture: number;
  temperature: number;
  humidity: number;
  pumpStatus: boolean;
  isSimulated: boolean;
  status: 'healthy' | 'warning' | 'critical' | 'sensor_fault';
  timestamp: string;
  isOnline: boolean;
}

// In-memory buffer for latest readings (retained for demo mode / quick access)
let latestIoTData: IoTReadingData = {
  deviceId: 'esp32-node-01',
  fieldId: 'field-01',
  moisture: 45.0,
  temperature: 24.5,
  humidity: 62.0,
  pumpStatus: false,
  isSimulated: false,
  status: 'healthy',
  timestamp: new Date().toISOString(),
  isOnline: true,
};

// In-memory historical ring buffer (last 50 readings for fallback)
const inMemoryHistory: IoTReadingData[] = [latestIoTData];

/**
 * Field-scoped in-memory reading accessor for memory-mode and unit test environments.
 * Strictly enforces field scoping: returns null if no reading matches the requested field.
 */
export const getInMemoryIoTReading = (
  fieldId?: string,
  deviceId?: string
): IoTReadingData | null => {
  if (!fieldId && !deviceId) return latestIoTData;
  const match = inMemoryHistory.find(
    (r) =>
      (fieldId && (r.fieldId === fieldId || r.deviceId === fieldId)) ||
      (deviceId && r.deviceId === deviceId)
  );
  return match || null;
};

// Actuator command state machine
export interface ActuatorCommand {
  commandId: string;
  deviceId: string;
  action: 'ACTIVATE_PUMP' | 'DEACTIVATE_PUMP';
  targetPumpStatus: boolean;
  issuedAt: string;
  issuedBy: string;
  status: 'requested' | 'accepted' | 'acknowledged' | 'failed' | 'timed_out';
  acknowledgedAt?: string;
  executionMetrics?: {
    flowRateLpm?: number;
    durationSeconds?: number;
  };
  failureReason?: string;
}

let activeActuatorCommand: ActuatorCommand | null = null;
const commandHistory: ActuatorCommand[] = [];

/**
 * POST /api/iot-data
 * Ingests validated sensor data from ESP32 or simulator
 */
export const postIoTData = async (req: Request, res: Response) => {
  try {
    const {
      moisture,
      temperature,
      humidity,
      pumpStatus,
      deviceId,
      fieldId,
      farmId,
      userId,
      isSimulated,
    } = req.body;

    // Strict validation: missing fields must NOT silently coerce to zero
    if (moisture === undefined || moisture === null || isNaN(Number(moisture))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sensor payload: numeric moisture (0-100%) is required.',
      });
    }

    if (temperature === undefined || temperature === null || isNaN(Number(temperature))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sensor payload: numeric temperature in Celsius is required.',
      });
    }

    if (humidity === undefined || humidity === null || isNaN(Number(humidity))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sensor payload: numeric humidity (0-100%) is required.',
      });
    }

    const numMoisture = Number(moisture);
    const numTemp = Number(temperature);
    const numHumidity = Number(humidity);

    // Physical range checks
    if (numMoisture < 0 || numMoisture > 100) {
      return res.status(400).json({
        success: false,
        message: `Soil moisture value ${numMoisture}% out of physical range [0, 100].`,
      });
    }

    if (numTemp < -10 || numTemp > 60) {
      return res.status(400).json({
        success: false,
        message: `Temperature value ${numTemp}°C out of plausible range [-10, 60].`,
      });
    }

    if (numHumidity < 0 || numHumidity > 100) {
      return res.status(400).json({
        success: false,
        message: `Humidity value ${numHumidity}% out of physical range [0, 100].`,
      });
    }

    const targetDeviceId = String(deviceId || 'esp32-node-01');
    const targetFieldId = fieldId
      ? String(fieldId)
      : targetDeviceId === 'esp32-node-01'
        ? 'field-01'
        : undefined;
    const targetFarmId = farmId ? String(farmId) : undefined;
    const targetPumpStatus = Boolean(pumpStatus);
    const targetSimulated = Boolean(isSimulated);

    // Identity binding: if JWT authenticated, bind userId and reject cross-user farm spoofing
    const authUser = (req as any).user;
    let targetUserId = userId ? String(userId) : undefined;
    if (authUser) {
      if (authUser.role === 'farmer' && targetUserId && targetUserId !== authUser.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot submit IoT telemetry for an unauthorized user ID.',
        });
      }
      targetUserId = authUser.id || targetUserId;
    }

    let sensorStatus: 'healthy' | 'warning' | 'critical' | 'sensor_fault' = 'healthy';
    if (numMoisture < 25) {
      sensorStatus = 'critical';
    } else if (numMoisture < 40 || numTemp > 38) {
      sensorStatus = 'warning';
    }

    let timestamp = new Date().toISOString();
    if (req.body.timestamp) {
      const parsedTime = new Date(req.body.timestamp).getTime();
      if (isNaN(parsedTime)) {
        return res.status(400).json({
          success: false,
          message: `Malformed sensor timestamp: "${req.body.timestamp}".`,
        });
      }
      if (parsedTime > Date.now() + 60000) {
        return res.status(400).json({
          success: false,
          message: `Future-dated sensor timestamp rejected: "${req.body.timestamp}". Clock skew must not exceed 60 seconds.`,
        });
      }
      timestamp = new Date(parsedTime).toISOString();
    }

    latestIoTData = {
      deviceId: targetDeviceId,
      fieldId: targetFieldId,
      farmId: targetFarmId,
      userId: targetUserId,
      moisture: Math.round(numMoisture * 10) / 10,
      temperature: Math.round(numTemp * 10) / 10,
      humidity: Math.round(numHumidity * 10) / 10,
      pumpStatus: targetPumpStatus,
      isSimulated: targetSimulated,
      status: sensorStatus,
      timestamp,
      isOnline: true,
    };

    inMemoryHistory.unshift(latestIoTData);
    if (inMemoryHistory.length > 50) {
      inMemoryHistory.pop();
    }

    // Persist to MongoDB if connected
    let storageDurable = false;
    if (isDBConnected) {
      try {
        await IoTReading.create({
          deviceId: targetDeviceId,
          fieldId: targetFieldId,
          farmId: targetFarmId,
          userId: targetUserId,
          moisture: latestIoTData.moisture,
          temperature: latestIoTData.temperature,
          humidity: latestIoTData.humidity,
          pumpStatus: targetPumpStatus,
          isSimulated: targetSimulated,
          status: sensorStatus,
          rawTimestamp: new Date(timestamp),
        });
        storageDurable = true;
      } catch (dbErr: any) {
        console.warn(`⚠️ [IoT SYNC] Could not persist reading to MongoDB: ${dbErr.message}`);
        storageDurable = false;
      }
    }

    console.log(
      `📡 [IoT SYNC] Synced: M:${latestIoTData.moisture}% T:${latestIoTData.temperature}°C H:${latestIoTData.humidity}% P:${latestIoTData.pumpStatus} [${targetSimulated ? 'SIMULATOR' : 'HARDWARE'}] [Field: ${targetFieldId || 'unscoped'}] [Durable: ${storageDurable}]`
    );

    // Broadcast real-time update to all connected Socket.IO clients
    const io = getIO();
    if (io) {
      io.emit('iot-update', { ...latestIoTData, storageDurable });
    }

    return res.status(200).json({
      success: true,
      message: 'Telemetry processed successfully',
      storageDurable,
      storageMode: storageDurable ? 'mongodb_persisted' : 'in_memory_buffer',
      isSimulated: targetSimulated,
      receivedAt: timestamp,
      data: latestIoTData,
    });
  } catch (error: any) {
    console.error('❌ [IoT SYNC ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing IoT data',
    });
  }
};

/**
 * GET /api/iot-data
 * Sends latest sensor reading to frontend
 */
export const getIoTData = async (req: Request, res: Response) => {
  try {
    const fieldId = req.query?.fieldId ? String(req.query.fieldId) : undefined;
    const deviceId = req.query?.deviceId ? String(req.query.deviceId) : undefined;

    if (fieldId || deviceId) {
      let dbRec: any = null;
      if (isDBConnected) {
        const filter: any = {};
        if (fieldId) {
          filter.$or = [{ fieldId }, { deviceId: fieldId }];
        } else if (deviceId) {
          filter.deviceId = deviceId;
        }
        dbRec = await IoTReading.findOne(filter).sort({ createdAt: -1 });
      }

      const targetRec = dbRec
        ? {
            deviceId: dbRec.deviceId,
            fieldId: dbRec.fieldId,
            moisture: dbRec.moisture,
            temperature: dbRec.temperature,
            humidity: dbRec.humidity,
            pumpStatus: dbRec.pumpStatus,
            isSimulated: dbRec.isSimulated,
            status: dbRec.status,
            timestamp: new Date(dbRec.createdAt || dbRec.rawTimestamp).toISOString(),
          }
        : inMemoryHistory.find(
            (r: any) =>
              (fieldId && (r.fieldId === fieldId || r.deviceId === fieldId)) ||
              (deviceId && r.deviceId === deviceId)
          );

      if (!targetRec) {
        return res.status(404).json({
          success: false,
          message: `No telemetry reading found for requested field "${fieldId || deviceId}". Cross-field fallback suppressed.`,
          data: null,
        });
      }

      const quality = evaluateTelemetryQuality(targetRec);
      const lastUpdate = new Date(targetRec.timestamp).getTime();
      const isOnline = Date.now() - lastUpdate < 30000;

      return res.status(200).json({
        success: true,
        data: {
          ...targetRec,
          isOnline,
          isStale: quality.isStale,
          telemetryQuality: quality.quality,
          freshnessMinutes: quality.freshnessMinutes,
        },
      });
    }

    // Unscoped request: return latest default node telemetry
    const quality = evaluateTelemetryQuality(latestIoTData);
    const lastUpdate = new Date(latestIoTData.timestamp).getTime();
    const isOnline = Date.now() - lastUpdate < 30000;

    return res.status(200).json({
      success: true,
      data: {
        ...latestIoTData,
        isOnline,
        isStale: quality.isStale,
        telemetryQuality: quality.quality,
        freshnessMinutes: quality.freshnessMinutes,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching IoT data',
    });
  }
};

/**
 * GET /api/iot-data/history
 * Returns historical sensor readings for real-time charting
 */
export const getIoTHistory = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(5, Number(req.query?.limit) || 20));
    const fieldId = req.query?.fieldId ? String(req.query.fieldId) : undefined;
    const deviceId = req.query?.deviceId ? String(req.query.deviceId) : undefined;

    const filter: any = {};
    if (fieldId) {
      filter.$or = [{ fieldId }, { deviceId: fieldId }];
    } else if (deviceId) {
      filter.deviceId = deviceId;
    }

    if (isDBConnected) {
      const records = await IoTReading.find(filter).sort({ createdAt: -1 }).limit(limit);
      if (records.length > 0) {
        return res.status(200).json({
          success: true,
          source: 'database',
          data: records.reverse(),
        });
      }
    }

    // Fallback to in-memory history matching requested field/device
    const filteredMem = inMemoryHistory.filter(
      (r: any) =>
        (!fieldId && !deviceId) ||
        (fieldId && (r.fieldId === fieldId || r.deviceId === fieldId)) ||
        (deviceId && r.deviceId === deviceId)
    );
    return res.status(200).json({
      success: true,
      source: 'memory_buffer',
      data: filteredMem.slice(0, limit).reverse(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching IoT history',
    });
  }
};

/**
 * POST /api/iot-data/control
 * Allows authenticated dashboard clients to issue actuator commands.
 * Creates an ActuatorCommand with status 'accepted'.
 * DOES NOT falsely claim the pump is physically active until hardware acknowledges.
 */
export const controlPump = async (req: Request, res: Response) => {
  try {
    const { pumpStatus } = req.body;
    if (pumpStatus === undefined || pumpStatus === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required boolean parameter: pumpStatus (true = ON, false = OFF)',
      });
    }

    const targetPumpStatus = Boolean(pumpStatus);
    const targetDeviceId = req.body.deviceId ? String(req.body.deviceId) : 'esp32-node-01';
    const targetFieldId = req.body.fieldId
      ? String(req.body.fieldId)
      : targetDeviceId === 'esp32-node-01'
        ? 'field-01'
        : undefined;

    // Actuator Safety Interlock:
    // If activating pump (targetPumpStatus === true), root-zone telemetry must be fresh (<15m).
    // Stale or missing telemetry trips the interlock to prevent accidental over-irrigation.
    // Deactivation (targetPumpStatus === false) is ALWAYS permitted immediately as a fail-safe shutdown.
    if (targetPumpStatus === true) {
      let relevantReading: any = null;
      if (isDBConnected && (targetFieldId || targetDeviceId)) {
        try {
          const filter: any = {};
          if (targetFieldId) filter.$or = [{ fieldId: targetFieldId }, { deviceId: targetFieldId }];
          else filter.deviceId = targetDeviceId;
          relevantReading = await IoTReading.findOne(filter).sort({ createdAt: -1 });
        } catch {
          relevantReading = null;
        }
      }
      if (!relevantReading) {
        relevantReading = inMemoryHistory.find(
          (r: any) =>
            (targetFieldId && (r.fieldId === targetFieldId || r.deviceId === targetFieldId)) ||
            (targetDeviceId && r.deviceId === targetDeviceId)
        );
        if (!relevantReading && (!targetFieldId || targetFieldId === 'field-01')) {
          relevantReading = latestIoTData;
        }
      }

      const quality = evaluateTelemetryQuality(relevantReading);
      const allowOverride =
        req.body.forceOverride === true || req.body.bypassSafetyInterlock === true;

      if (
        !allowOverride &&
        (quality.isStale ||
          quality.quality === 'stale' ||
          quality.quality === 'missing' ||
          quality.quality === 'invalid')
      ) {
        return res.status(422).json({
          success: false,
          safetyInterlock: 'TRIPPED_STALE_TELEMETRY',
          message: `Actuator Safety Interlock: Pump activation refused. Root-zone telemetry for field "${targetFieldId || targetDeviceId}" is ${quality.quality} (${quality.freshnessMinutes >= 0 ? quality.freshnessMinutes + 'm old' : 'no reading'}). Fresh measurement (<15m) required before initiating irrigation.`,
          telemetryQuality: quality.quality,
          freshnessMinutes: quality.freshnessMinutes,
          requiredAction:
            'Verify field sensors, allow reading sync, or supply explicit operator emergency override (forceOverride: true).',
        });
      }
    }

    const commandId = 'cmd_' + crypto.randomUUID().substring(0, 10);
    const issuedBy = (req as any).user?.email || (req as any).user?.id || 'authenticated_operator';
    const issuedAt = new Date().toISOString();

    const command: ActuatorCommand = {
      commandId,
      deviceId: targetDeviceId,
      action: targetPumpStatus ? 'ACTIVATE_PUMP' : 'DEACTIVATE_PUMP',
      targetPumpStatus,
      issuedAt,
      issuedBy,
      status: 'accepted',
    };

    activeActuatorCommand = command;
    commandHistory.unshift(command);
    if (commandHistory.length > 50) commandHistory.pop();

    console.log(
      `📡 [IoT ACTUATOR] Command issued: ${command.action} (${commandId}) by ${issuedBy}. Pending hardware ACK.`
    );

    // Broadcast actuator command to ESP32 hardware and listening dashboard clients
    const io = getIO();
    if (io) {
      io.emit('iot-control', {
        commandId,
        action: command.action,
        targetPumpStatus,
        issuedAt,
      });
    }

    return res.status(202).json({
      success: true,
      message: `Actuator command transmitted to field gateway (${command.action}). Physical state pending hardware acknowledgement.`,
      commandId,
      commandState: 'accepted',
      actuatorState: 'pending_acknowledgement',
      targetPumpStatus,
      disclaimer:
        'Safety Protocol: Actuator command has been queued. AgriFlux does NOT assume physical water flow until the ESP32 node confirms switch contact.',
    });
  } catch (error: any) {
    console.error('❌ [IoT CONTROL ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error issuing actuator control command',
    });
  }
};

/**
 * POST /api/iot-data/actuator-ack
 * Allows ESP32 or simulator to explicitly confirm physical relay activation.
 */
export const acknowledgeActuator = async (req: Request, res: Response) => {
  try {
    const { commandId, status, failureReason, flowRateLpm, durationSeconds } = req.body;

    if (!commandId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: commandId',
      });
    }

    const targetCommand =
      activeActuatorCommand && activeActuatorCommand.commandId === commandId
        ? activeActuatorCommand
        : commandHistory.find((c) => c.commandId === commandId);

    if (!targetCommand) {
      return res.status(404).json({
        success: false,
        message: `Command ID ${commandId} not found or expired.`,
      });
    }

    if (
      targetCommand.status === 'acknowledged' ||
      targetCommand.status === 'failed' ||
      targetCommand.status === 'timed_out'
    ) {
      return res.status(409).json({
        success: false,
        message: `Command ${commandId} was already processed with status: ${targetCommand.status}. Duplicate acknowledgements rejected.`,
        command: targetCommand,
      });
    }

    const ackTime = new Date().toISOString();
    const finalStatus: ActuatorCommand['status'] = status === 'failed' ? 'failed' : 'acknowledged';

    // Update target command (handles both the latest active command and in-flight historical commands)
    targetCommand.status = finalStatus;
    targetCommand.acknowledgedAt = ackTime;
    if (failureReason) targetCommand.failureReason = failureReason;
    if (flowRateLpm !== undefined || durationSeconds !== undefined) {
      targetCommand.executionMetrics = {
        flowRateLpm: Math.max(0, Math.min(1000, Number(flowRateLpm) || 0)),
        durationSeconds: Math.max(0, Math.min(86400, Number(durationSeconds) || 0)),
      };
    }

    // Also sync activeActuatorCommand if it matches the acknowledged command
    if (activeActuatorCommand && activeActuatorCommand.commandId === commandId) {
      activeActuatorCommand.status = finalStatus;
      activeActuatorCommand.acknowledgedAt = ackTime;
      if (failureReason) activeActuatorCommand.failureReason = failureReason;
      if (targetCommand.executionMetrics) {
        activeActuatorCommand.executionMetrics = targetCommand.executionMetrics;
      }
    }

    // Update confirmed telemetry pump state if confirmed
    if (finalStatus === 'acknowledged') {
      latestIoTData = {
        ...latestIoTData,
        pumpStatus: targetCommand.targetPumpStatus,
        timestamp: ackTime,
      };
    }

    console.log(
      `🔌 [IoT ACTUATOR ACK] Command ${commandId} transitioned to ${finalStatus.toUpperCase()} at ${ackTime}`
    );

    // Broadcast confirmation to dashboard clients
    const io = getIO();
    if (io) {
      io.emit('iot-actuator-ack', {
        commandId,
        status: finalStatus,
        pumpStatus: latestIoTData.pumpStatus,
        acknowledgedAt: ackTime,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Actuator confirmation received: ${finalStatus}`,
      command: targetCommand,
      currentPumpStatus: latestIoTData.pumpStatus,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process actuator acknowledgement',
    });
  }
};

/**
 * GET /api/iot-data/actuator-state
 * Returns real-time actuator state machine diagnostic
 */
export const getActuatorState = async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    // Auto-timeout check (if command pending > 15s without ack)
    if (
      activeActuatorCommand &&
      activeActuatorCommand.status === 'accepted' &&
      now - new Date(activeActuatorCommand.issuedAt).getTime() > 15000
    ) {
      activeActuatorCommand.status = 'timed_out';
      activeActuatorCommand.failureReason =
        'No acknowledgement received from ESP32 field gateway within 15s timeout window.';
    }

    return res.status(200).json({
      success: true,
      actuator: {
        physicalPumpStatus: latestIoTData.pumpStatus,
        isHardwareOnline: latestIoTData.isOnline,
        lastSeenAt: latestIoTData.timestamp,
        activeCommand: activeActuatorCommand,
        recentCommandsCount: commandHistory.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching actuator state',
    });
  }
};
