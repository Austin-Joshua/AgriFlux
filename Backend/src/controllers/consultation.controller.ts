import { Request, Response } from 'express';
import Consultation from '../../../Database/Models/Consultation';

export const bookConsultation = async (req: Request, res: Response) => {
    try {
        const { expertId, expertName, specialization, date, time, query } = req.body;
        const userId = (req as any).user?.id; // Assuming auth middleware attaches user

        if (!expertId || !date || !time || !query) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const newConsultation = await Consultation.create({
            userId: userId || req.body.userId, // Fallback if no auth middleware yet
            expertId,
            expertName,
            specialization,
            date,
            time,
            query
        });

        res.status(201).json({
            success: true,
            data: newConsultation
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserConsultations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || req.query.userId;
        const consultations = await Consultation.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: consultations });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
