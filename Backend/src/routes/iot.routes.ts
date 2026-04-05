import { Router } from 'express';
import * as iotController from '../controllers/iot.controller';

const router = Router();

/**
 * Route: POST /api/iot-data
 * Receives real-time sensor data from ESP32 nodes
 */
router.post('/', iotController.postIoTData);

/**
 * Route: GET /api/iot-data
 * Sends latest sensor data to frontend
 */
router.get('/', iotController.getIoTData);

export default router;
