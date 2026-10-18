import { Router } from 'express';
import * as fieldIntelligenceController from '../controllers/field-intelligence.controller';
import { auth, requireRole } from '../middleware/auth';

const router = Router();

// Phase 2: Unified Field Context and Data Quality
router.get('/context', auth, fieldIntelligenceController.getFieldContext);

// Phase 3: Explainable Agricultural Decision Engine
router.post('/recommend', auth, fieldIntelligenceController.getRecommendation);

// Phase 4: Persisted Farmer Action Timeline
router.post('/action', auth, fieldIntelligenceController.recordAction);
router.get('/timeline/:fieldId', auth, fieldIntelligenceController.getFieldTimeline);
router.get('/timeline', auth, fieldIntelligenceController.getFieldTimeline);

// Phase 5: Outcome Evaluation Loop
router.post('/evaluate', auth, fieldIntelligenceController.evaluateFollowUp);

// Phase 7: Agronomist Review Workflow (Agronomist/Admin only)
router.post(
  '/review',
  auth,
  requireRole('agronomist', 'admin'),
  fieldIntelligenceController.recordAgronomistReview
);
router.get(
  '/reviews',
  auth,
  requireRole('agronomist', 'admin'),
  fieldIntelligenceController.getPendingReviews
);

// Historical records
router.get('/history', auth, fieldIntelligenceController.getHistory);

export default router;
