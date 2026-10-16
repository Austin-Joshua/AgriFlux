import { Router } from 'express';
import * as fieldIntelligenceController from '../controllers/field-intelligence.controller';
import { auth } from '../middleware/auth';

const router = Router();

// Field Intelligence endpoints require authentication
router.post('/recommend', auth, fieldIntelligenceController.getRecommendation);
router.post('/action', auth, fieldIntelligenceController.recordAction);
router.post('/evaluate', auth, fieldIntelligenceController.evaluateFollowUp);
router.get('/history', auth, fieldIntelligenceController.getHistory);

export default router;
