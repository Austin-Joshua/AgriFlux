import { Request, Response } from 'express';
import { FieldIntelligenceService } from '../services/field-intelligence.service';

/**
 * GET /api/field-intelligence/context
 * Phase 2: Retrieves unified field context and data-quality status
 */
export const getFieldContext = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'demo-farmer';
    const fieldId = (req.query.fieldId as string) || undefined;
    const cropType = (req.query.cropType as string) || undefined;
    const cropStage = (req.query.cropStage as string) || undefined;
    const moistureOverride =
      req.query.moistureOverride !== undefined ? Number(req.query.moistureOverride) : undefined;

    const context = await FieldIntelligenceService.getFieldContext(userId, {
      fieldId,
      cropType,
      cropStage,
      soilMoistureOverride: moistureOverride,
    });

    return res.status(200).json({
      success: true,
      data: context,
    });
  } catch (error: any) {
    console.error('❌ [FIELD INTELLIGENCE CONTEXT ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching unified field context',
    });
  }
};

/**
 * POST /api/field-intelligence/recommend
 * Phase 3: Generates an evidence-based recommendation for a field
 */
export const getRecommendation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'demo-farmer';
    const context = req.body || {};

    const recommendation = await FieldIntelligenceService.generateRecommendation(userId, context);

    return res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error: any) {
    console.error('❌ [FIELD INTELLIGENCE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating field recommendation',
    });
  }
};

/**
 * POST /api/field-intelligence/action
 * Phase 4: Records the farmer's response to an actionable recommendation
 */
export const recordAction = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user || {};
    const userId = user.id || 'demo-farmer';
    const actorName = user.name || (user.role === 'farmer' ? 'Farmer' : 'Farm Operator');
    const { recommendationId, actionTaken, notes } = req.body;

    if (!recommendationId || !actionTaken) {
      return res.status(400).json({
        success: false,
        message: 'recommendationId and actionTaken are required.',
      });
    }

    const validActions = [
      'irrigated',
      'postponed',
      'inspected',
      'dismissed',
      'accepted',
      'rejected',
      'requested_review',
    ];
    if (!validActions.includes(actionTaken)) {
      return res.status(400).json({
        success: false,
        message: `Invalid actionTaken. Must be one of: ${validActions.join(', ')}.`,
      });
    }

    const updated = await FieldIntelligenceService.recordFarmerAction(
      userId,
      recommendationId,
      actionTaken,
      notes,
      user.id,
      actorName
    );

    return res.status(200).json({
      success: true,
      message: `Farmer action '${actionTaken}' recorded successfully.`,
      data: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error recording farmer action',
    });
  }
};

/**
 * POST /api/field-intelligence/evaluate
 * Phase 5: Evaluates the follow-up sensor reading against the expected agronomic condition
 */
export const evaluateFollowUp = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'demo-farmer';
    const { recommendationId, subsequentTelemetry } = req.body;

    if (!recommendationId || !subsequentTelemetry || subsequentTelemetry.moisture === undefined) {
      return res.status(400).json({
        success: false,
        message: 'recommendationId and subsequentTelemetry.moisture are required.',
      });
    }

    const evaluation = await FieldIntelligenceService.evaluateFollowUp(
      userId,
      recommendationId,
      subsequentTelemetry
    );

    return res.status(200).json({
      success: true,
      message: 'Closed-loop follow-up evaluation completed.',
      data: evaluation,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error evaluating follow-up outcome',
    });
  }
};

/**
 * GET /api/field-intelligence/timeline/:fieldId?
 * Phase 4: Retrieves chronological audit timeline of recommendations, actions, and outcomes
 */
export const getFieldTimeline = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.id || 'demo-farmer';
    const isSpecialist = user?.role === 'agronomist' || user?.role === 'admin';
    const fieldIdParam = req.params.fieldId;
    const fieldIdQuery = req.query.fieldId;
    const fieldId =
      typeof fieldIdParam === 'string'
        ? fieldIdParam
        : typeof fieldIdQuery === 'string'
          ? fieldIdQuery
          : undefined;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));

    const timeline = await FieldIntelligenceService.getFieldTimeline(
      userId,
      fieldId,
      limit,
      isSpecialist
    );

    return res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching field timeline',
    });
  }
};

/**
 * POST /api/field-intelligence/review
 * Phase 7: Agronomist review workflow
 */
export const recordAgronomistReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user || {};
    const reviewerId = user.id || 'agronomist-01';
    const reviewerName = user.name || 'Specialist Agronomist';
    const { recommendationId, status, notes } = req.body;

    if (!recommendationId || !status) {
      return res.status(400).json({
        success: false,
        message: 'recommendationId and status are required.',
      });
    }

    const validStatuses = ['endorsed', 'revision_requested', 'inspection_required'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid review status. Must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const updated = await FieldIntelligenceService.recordAgronomistReview(
      user.id,
      reviewerId,
      reviewerName,
      recommendationId,
      status,
      notes
    );

    return res.status(200).json({
      success: true,
      message: `Agronomist review '${status}' recorded successfully.`,
      data: updated,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error recording agronomist review',
    });
  }
};

/**
 * GET /api/field-intelligence/reviews
 * Phase 7: Retrieves pending reviews for agronomists
 */
export const getPendingReviews = async (req: Request, res: Response) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const reviews = await FieldIntelligenceService.getPendingReviews(limit);

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pending reviews',
    });
  }
};

/**
 * GET /api/field-intelligence/history
 * Returns historical recommendations and closed-loop actions
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'demo-farmer';
    const farmId = (req.query.farmId as string) || 'farm-01';
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

    const history = await FieldIntelligenceService.getHistory(userId, farmId, limit);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching recommendation history',
    });
  }
};
