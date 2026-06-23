import { Router } from 'express';
import * as integrationController from '../controllers/integration.controller';

const router = Router();

/**
 * Route: GET /api/integration/status
 * Access: Public/Semi-Private (Returns authorization status info)
 */
router.get('/status', integrationController.getIntegrationStatus);

/**
 * Route: GET /api/integration/farmer-stats/:identifier
 * Access: Private (Requires X-Integration-Key header)
 */
router.get('/farmer-stats/:identifier', integrationController.getFarmerStats);

export default router;
