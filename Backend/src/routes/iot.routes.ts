import { Router, Request, Response, NextFunction } from 'express';
import * as iotController from '../controllers/iot.controller';
import { auth, requireRole } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();

/**
 * IoT API Key middleware — for ESP32/hardware nodes.
 * In production: fails closed if IOT_API_KEY is missing or key does not match.
 * In development: permits configured dev key.
 */
const iotDeviceAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-iot-api-key'];
  const expectedKey =
    process.env.IOT_API_KEY || (env.NODE_ENV === 'production' ? '' : 'agriflux-iot-key-dev');

  if (apiKey && expectedKey && apiKey === expectedKey) {
    return next();
  }

  // Also allow JWT-authenticated dashboard users to push test data
  const bearer = req.headers['authorization'];
  if (bearer) return auth(req, res, next);

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: valid IoT device API key or authorization token required.',
  });
};

/**
 * POST /api/iot-data
 * Receives real-time sensor data from ESP32 nodes.
 * Requires IoT API key (hardware) or JWT Bearer (test/dashboard).
 */
router.post('/', iotDeviceAuth, iotController.postIoTData);

/**
 * POST /api/iot-data/control
 * Remote pump control from authenticated dashboard users (Farmer/Admin only).
 * Requires JWT Bearer token and records command state machine.
 */
router.post('/control', auth, requireRole('farmer', 'admin'), iotController.controlPump);

/**
 * POST /api/iot-data/actuator-ack
 * Physical acknowledgement from ESP32 hardware or simulator.
 */
router.post('/actuator-ack', iotDeviceAuth, iotController.acknowledgeActuator);

/**
 * GET /api/iot-data/actuator-state
 * Current actuator state machine status
 */
router.get('/actuator-state', iotController.getActuatorState);

/**
 * GET /api/iot-data
 * Latest sensor reading — public (used by embedded displays / mobile dashboard).
 */
router.get('/', iotController.getIoTData);
router.get('/history', iotController.getIoTHistory);

export default router;
