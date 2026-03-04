import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';

const router = Router();

router.post('/predict-yield', aiController.predictYield);
router.post('/irrigation-schedule', aiController.irrigationSchedule);
router.post('/soil-analysis', aiController.soilAnalysis);
router.post('/climate-risk', aiController.climateRisk);
router.post('/simulate-climate', aiController.simulateClimate);

export default router;
