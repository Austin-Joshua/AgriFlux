import { Router, Request, Response, NextFunction } from 'express';
import * as iotController from '../controllers/iot.controller';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * IoT API Key middleware — for ESP32/hardware nodes.
 * Hardware devices send a static API key in the 'x-iot-api-key' header.
 * Frontend dashboard commands use JWT Bearer auth instead (see /control route).
 */
const iotDeviceAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-iot-api-key'];
  if (apiKey && apiKey === (process.env.IOT_API_KEY || 'agriflux-iot-key-dev')) {
    return next();
  }
  // Also allow JWT-authenticated dashboard users to push test data
  const bearer = req.headers['authorization'];
  if (bearer) return auth(req, res, next);

  return res.status(401).json({ success: false, message: 'IoT API key required.' });
};

/**
 * POST /api/iot-data
 * Receives real-time sensor data from ESP32 nodes.
 * Requires IoT API key (hardware) or JWT Bearer (test/dashboard).
 */
router.post('/', iotDeviceAuth, iotController.postIoTData);

/**
 * POST /api/iot-data/control
 * Remote pump control from authenticated dashboard users.
 * Requires JWT Bearer token.
 */
router.post('/control', auth, iotController.controlPump);

/**
 * GET /api/iot-data
 * Latest sensor reading — public (used by embedded displays / mobile dashboard).
 * Authenticated on frontend via JWT already.
 */
router.get('/', iotController.getIoTData);

export default router;
