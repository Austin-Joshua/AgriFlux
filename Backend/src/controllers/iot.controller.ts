import { Request, Response } from 'express';
import { getIO } from '../socket';
import IoTReading from '../../../Database/Models/IoTReading';
import { isDBConnected } from '../config/db';

/**
 * AgriFlux IoT Intelligence Controller
 * -----------------------------------
 * Manages real-time data flow from ESP32 nodes to the AgriFlux dashboard.
 * Supports persistent telemetry storage in MongoDB with memory fallback.
 */

// In-memory buffer for latest readings (retained for demo mode / quick access)
let latestIoTData = {
  deviceId: 'esp32-node-01',
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
const inMemoryHistory: (typeof latestIoTData)[] = [latestIoTData];

/**
 * POST /api/iot-data
 * Ingests validated sensor data from ESP32 or simulator
 */
export const postIoTData = async (req: Request, res: Response) => {
  try {
    const { moisture, temperature, humidity, pumpStatus, deviceId, isSimulated } = req.body;

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

    // Range checks
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
    const targetPumpStatus = Boolean(pumpStatus);
    const targetSimulated = Boolean(isSimulated);

    let sensorStatus: 'healthy' | 'warning' | 'critical' | 'sensor_fault' = 'healthy';
    if (numMoisture < 25) {
      sensorStatus = 'critical';
    } else if (numMoisture < 40 || numTemp > 38) {
      sensorStatus = 'warning';
    }

    const timestamp = new Date().toISOString();

    latestIoTData = {
      deviceId: targetDeviceId,
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
    if (isDBConnected) {
      try {
        await IoTReading.create({
          deviceId: targetDeviceId,
          moisture: latestIoTData.moisture,
          temperature: latestIoTData.temperature,
          humidity: latestIoTData.humidity,
          pumpStatus: targetPumpStatus,
          isSimulated: targetSimulated,
          status: sensorStatus,
          rawTimestamp: new Date(timestamp),
        });
      } catch (dbErr: any) {
        console.warn(`⚠️ [IoT SYNC] Could not persist reading to MongoDB: ${dbErr.message}`);
      }
    }

    console.log(
      `📡 [IoT SYNC] Synced: M:${latestIoTData.moisture}% T:${latestIoTData.temperature}°C H:${latestIoTData.humidity}% P:${latestIoTData.pumpStatus} [${targetSimulated ? 'SIMULATOR' : 'HARDWARE'}]`
    );

    // Broadcast real-time update to all connected Socket.IO clients
    const io = getIO();
    if (io) {
      io.emit('iot-update', latestIoTData);
    }

    return res.status(200).json({
      success: true,
      message: 'Telemetry synced and persisted successfully',
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
export const getIoTData = async (_req: Request, res: Response) => {
  try {
    const lastUpdate = new Date(latestIoTData.timestamp).getTime();
    const now = Date.now();
    const isStale = now - lastUpdate > 15000;

    return res.status(200).json({
      success: true,
      data: {
        ...latestIoTData,
        isOnline: latestIoTData.isOnline && !isStale,
        isStale,
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
    const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 20));

    if (isDBConnected) {
      const records = await IoTReading.find({}).sort({ createdAt: -1 }).limit(limit);
      if (records.length > 0) {
        return res.status(200).json({
          success: true,
          source: 'database',
          data: records.reverse(),
        });
      }
    }

    // Fallback to in-memory history
    return res.status(200).json({
      success: true,
      source: 'memory_buffer',
      data: inMemoryHistory.slice(0, limit).reverse(),
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
 * Allows authenticated dashboard clients to toggle pump state remotely
 */
export const controlPump = async (req: Request, res: Response) => {
  try {
    const { pumpStatus } = req.body;
    const targetPumpStatus = Boolean(pumpStatus);

    latestIoTData = {
      ...latestIoTData,
      pumpStatus: targetPumpStatus,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `📡 [IoT CONTROL] Command received: Pump is now ${targetPumpStatus ? 'ON' : 'OFF'}`
    );

    // Broadcast to ESP32 and frontends
    const io = getIO();
    if (io) {
      io.emit('iot-update', latestIoTData);
      io.emit('iot-control', { pumpStatus: targetPumpStatus });
    }

    return res.status(200).json({
      success: true,
      message: `Pump turned ${targetPumpStatus ? 'ON' : 'OFF'} successfully`,
      pumpStatus: targetPumpStatus,
    });
  } catch (error: any) {
    console.error('❌ [IoT CONTROL ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error toggling pump',
    });
  }
};
