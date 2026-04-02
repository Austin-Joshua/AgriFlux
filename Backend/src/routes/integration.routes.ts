import { Router } from 'express';
import * as integrationController from '../controllers/integration.controller';

const router = Router();

/**
 * Route: GET /api/integration/farmer-stats/:identifier
 * Access: Private (Requires X-Integration-Key header)
 */
router.get('/farmer-stats/:identifier', integrationController.getFarmerStats);

export default router;
