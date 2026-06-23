import { Request, Response } from 'express';
import Consultation from '../../../Database/Models/Consultation';
import { isDBConnected } from '../config/db';

interface MockUser {
  id: string;
  name: string;
  farmName?: string;
  location?: string;
}

interface MockConsultation {
  _id: string;
  userId: string | MockUser;
  expertId: string;
  expertName: string;
  specialization: string;
  date: string;
  time: string;
  query: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

const tempConsultations: MockConsultation[] = [
  {
    _id: 'mock-consultation-1',
    userId: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Demo Farmer',
      farmName: 'Green Valley Farm',
      location: 'Karnataka, India',
    },
    expertId: 'exp1',
    expertName: 'Dr. Ramesh Chandra',
    specialization: 'Soil Science',
    date: '2026-06-25',
    time: '10:30',
    query: 'Requesting soil analysis advisory for my upcoming maize crop cultivation.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000),
  },
];

export const bookConsultation = async (req: Request, res: Response) => {
  try {
    const { expertId, expertName, specialization, date, time, query } = req.body;
    const userId = (req as any).user?.id || req.body.userId;

    if (!expertId || !date || !time || !query) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (query.length < 10) {
      return res
        .status(400)
        .json({ message: 'Query description must be at least 10 characters long.' });
    }

    if (query.length > 500) {
      return res.status(400).json({ message: 'Query description cannot exceed 500 characters.' });
    }

    if (!isDBConnected) {
      const newConsultation: MockConsultation = {
        _id: 'mock-' + Math.random().toString(36).substring(2, 9),
        userId: {
          id: userId || '11111111-1111-4111-8111-111111111111',
          name: 'Demo Farmer',
          farmName: 'Green Valley Farm',
          location: 'Karnataka, India',
        },
        expertId,
        expertName,
        specialization,
        date,
        time,
        query,
        status: 'pending',
        createdAt: new Date(),
      };
      tempConsultations.unshift(newConsultation);
      return res.status(201).json({
        success: true,
        data: newConsultation,
      });
    }

    const newConsultation = await Consultation.create({
      userId,
      expertId,
      expertName,
      specialization,
      date,
      time,
      query,
    });

    res.status(201).json({
      success: true,
      data: newConsultation,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserConsultations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.query.userId;

    if (!isDBConnected) {
      const list = tempConsultations.filter((c) => {
        const cUid = typeof c.userId === 'object' ? c.userId.id : c.userId;
        return cUid === userId;
      });
      return res.json({ success: true, data: list });
    }

    const consultations = await Consultation.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: consultations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllConsultations = async (_req: Request, res: Response) => {
  try {
    if (!isDBConnected) {
      return res.json({ success: true, data: tempConsultations });
    }

    const consultations = await Consultation.find({})
      .populate('userId', 'name farmName location')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: consultations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateConsultationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (!isDBConnected) {
      const consultation = tempConsultations.find((c) => c._id === id);
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }
      consultation.status = status as any;
      return res.json({
        success: true,
        message: `Consultation status updated to ${status}`,
        data: consultation,
      });
    }

    const consultation = await Consultation.findByIdAndUpdate(id, { status }, { new: true });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    res.json({
      success: true,
      message: `Consultation status updated to ${status}`,
      data: consultation,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
