import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * All AI prediction endpoints require JWT authentication.
 * This prevents unauthenticated abuse of compute-intensive routes.
 */
router.post('/predict-yield', auth, aiController.predictYield);
router.post('/irrigation-schedule', auth, aiController.irrigationSchedule);
router.post('/soil-analysis', auth, aiController.soilAnalysis);
router.post('/climate-risk', auth, aiController.climateRisk);
router.post('/simulate-climate', auth, aiController.simulateClimate);

export default router;
