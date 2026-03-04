import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';

export const predictYield = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AIService.predictYield(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const irrigationSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AIService.getIrrigationSchedule(req.body);
        res.status(200).json({ schedule: result });
    } catch (error) {
        next(error);
    }
};

export const soilAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AIService.analyzeSoil(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const climateRisk = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AIService.evaluateClimateRisk(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const simulateClimate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AIService.simulateClimate(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
