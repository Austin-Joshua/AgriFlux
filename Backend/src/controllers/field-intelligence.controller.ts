import { Request, Response } from 'express';
import { FieldIntelligenceService } from '../services/field-intelligence.service';

/**
 * POST /api/field-intelligence/recommend
 * Generates an evidence-based recommendation for a field
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
 * Records the farmer's response to an actionable recommendation
 */
export const recordAction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'demo-farmer';
    const { recommendationId, actionTaken, notes } = req.body;

    if (!recommendationId || !actionTaken) {
      return res.status(400).json({
        success: false,
        message: 'recommendationId and actionTaken are required.',
      });
    }

    if (!['irrigated', 'postponed', 'inspected', 'dismissed'].includes(actionTaken)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid actionTaken. Must be: irrigated, postponed, inspected, or dismissed.',
      });
    }

    const updated = await FieldIntelligenceService.recordFarmerAction(
      userId,
      recommendationId,
      actionTaken,
      notes
    );

    return res.status(200).json({
      success: true,
      message: `Farmer action '${actionTaken}' recorded successfully.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error recording farmer action',
    });
  }
};

/**
 * POST /api/field-intelligence/evaluate
 * Evaluates the follow-up sensor reading against the expected agronomic condition
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
    return res.status(500).json({
      success: false,
      message: error.message || 'Error evaluating follow-up outcome',
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
    const limit = Number(req.query.limit) || 10;

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
