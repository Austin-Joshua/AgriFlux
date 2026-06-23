import { Request, Response } from 'express';
import { io } from '../server';

/**
 * AgriFlux IoT Intelligence Controller
 * -----------------------------------
 * Manages real-time data flow from ESP32 nodes to the AgriFlux dashboard.
 */

// In-memory store for the latest sensor reading (Singleton)
let latestIoTData = {
  moisture: 0,
  temperature: 0,
  humidity: 0,
  pumpStatus: false,
  timestamp: new Date().toISOString(),
  isOnline: false,
};

/**
 * POST /api/iot-data
 * Receives data from ESP32
 */
export const postIoTData = async (req: Request, res: Response) => {
  try {
    const { moisture, temperature, humidity, pumpStatus } = req.body;

    // Validation & Sanitization
    const sanitizedMoisture = Math.min(100, Math.max(0, Number(moisture) || 0));
    const sanitizedTemp = Number(temperature) || 0;
    const sanitizedHumidity = Math.min(100, Math.max(0, Number(humidity) || 0));
    const sanitizedPumpStatus = Boolean(pumpStatus);

    // Update latest data
    latestIoTData = {
      moisture: sanitizedMoisture,
      temperature: sanitizedTemp,
      humidity: sanitizedHumidity,
      pumpStatus: sanitizedPumpStatus,
      timestamp: new Date().toISOString(),
      isOnline: true,
    };

    console.log(
      `📡 [IoT SYNC] Data received: M:${sanitizedMoisture}% T:${sanitizedTemp}C H:${sanitizedHumidity}% P:${sanitizedPumpStatus}`
    );

    // [SOCKET.IO] Emit real-time update to all connected clients
    io.emit('iot-update', latestIoTData);

    return res.status(200).json({
      success: true,
      message: 'Data synced successfully',
      receivedAt: latestIoTData.timestamp,
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
 * Sends latest data to frontend
 */
export const getIoTData = async (_req: Request, res: Response) => {
  try {
    // Check if data is stale (over 15 seconds)
    const lastUpdate = new Date(latestIoTData.timestamp).getTime();
    const now = new Date().getTime();
    const isStale = now - lastUpdate > 15000;

    return res.status(200).json({
      success: true,
      data: {
        ...latestIoTData,
        isOnline: latestIoTData.isOnline && !isStale,
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
 * POST /api/iot-data/control
 * Allows dashboard clients to toggle pump state remotely
 */
export const controlPump = async (req: Request, res: Response) => {
  try {
    const { pumpStatus } = req.body;

    latestIoTData = {
      ...latestIoTData,
      pumpStatus: Boolean(pumpStatus),
      timestamp: new Date().toISOString(),
    };

    console.log(
      `📡 [IoT CONTROL] Remote command received: Pump is now ${latestIoTData.pumpStatus ? 'ON' : 'OFF'}`
    );

    // Broadcast to all sockets (ESP32 and other frontends)
    io.emit('iot-update', latestIoTData);
    io.emit('iot-control', { pumpStatus: latestIoTData.pumpStatus });

    return res.status(200).json({
      success: true,
      message: 'Pump toggled successfully',
      pumpStatus: latestIoTData.pumpStatus,
    });
  } catch (error: any) {
    console.error('❌ [IoT CONTROL ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error toggling pump',
    });
  }
};
