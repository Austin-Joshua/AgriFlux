import { Request, Response } from 'express';
import Consultation from '../../../Database/Models/Consultation';
import { isDBConnected } from '../config/db';
import { env } from '../config/env';

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
    // Strictly bind consultation to authenticated user to prevent BOLA/IDOR
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: valid session token required to book consultation.',
      });
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
      if (env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          message:
            'Service Unavailable: Database connection required to book consultations in production. Please retry shortly.',
        });
      }

      // Concurrency check: prevent overlapping active bookings for the same expert and slot
      const isSlotConflict = tempConsultations.some(
        (c) =>
          c.expertId === expertId && c.date === date && c.time === time && c.status !== 'cancelled'
      );
      if (isSlotConflict) {
        return res.status(409).json({
          success: false,
          message:
            'The selected agronomist is already booked for this date and time slot. Please choose another slot.',
        });
      }

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

    // DBMS Concurrency Defense: atomic check for duplicate slot booking
    const isSlotConflict = await Consultation.findOne({
      expertId,
      date,
      time,
      status: { $ne: 'cancelled' },
    });
    if (isSlotConflict) {
      return res.status(409).json({
        success: false,
        message:
          'The selected agronomist is already booked for this date and time slot. Please choose another slot.',
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
    const authUser = (req as any).user;
    if (!authUser?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: session token missing.',
      });
    }

    // Role-governed access: Only agronomists and admins can inspect arbitrary farmer bookings via ?userId=
    const isElevated = ['agronomist', 'admin'].includes(authUser.role);
    const userId = isElevated && req.query.userId ? String(req.query.userId) : authUser.id;

    if (!isDBConnected) {
      const list = tempConsultations.filter((c) => {
        const cUid = typeof c.userId === 'object' ? c.userId.id : c.userId;
        return cUid === userId;
      });
      return res.json({ success: true, data: list });
    }

    const safeLimit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const consultations = await Consultation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(safeLimit);
    res.json({ success: true, data: consultations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllConsultations = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = Math.max(0, Number(req.query.skip) || 0);

    if (!isDBConnected) {
      return res.json({ success: true, data: tempConsultations.slice(skip, skip + limit) });
    }

    let consultations;
    try {
      consultations = await Consultation.find({})
        .populate('userId', 'name farmName location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch {
      consultations = await Consultation.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
    }
    res.json({ success: true, data: consultations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateConsultationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: session token missing.',
      });
    }

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (!isDBConnected) {
      if (env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          message:
            'Service Unavailable: Database connection required to update consultation status in production.',
        });
      }

      const consultation = tempConsultations.find((c) => c._id === id);
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }

      const cUid =
        typeof consultation.userId === 'object' ? consultation.userId.id : consultation.userId;

      // Ownership enforcement
      if (authUser.role === 'farmer') {
        if (cUid !== authUser.id) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You cannot alter another user's appointment.",
          });
        }
        if (status !== 'cancelled') {
          return res.status(403).json({
            success: false,
            message: 'Farmers are only permitted to cancel appointments.',
          });
        }
      } else if (authUser.role === 'agronomist') {
        if (
          consultation.expertId !== authUser.id &&
          consultation.expertName !== authUser.name &&
          authUser.role !== 'admin'
        ) {
          return res.status(403).json({
            success: false,
            message:
              'Access denied: You are not authorized to manage consultations assigned to another expert.',
          });
        }
      }

      consultation.status = status as any;
      return res.json({
        success: true,
        message: `Consultation status updated to ${status}`,
        data: consultation,
      });
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Ownership enforcement for persistent database
    const ownerIdStr = String(consultation.userId);
    if (authUser.role === 'farmer') {
      if (ownerIdStr !== String(authUser.id) && ownerIdStr !== String(authUser._id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: You cannot alter another user's appointment.",
        });
      }
      if (status !== 'cancelled') {
        return res
          .status(403)
          .json({ success: false, message: 'Farmers are only permitted to cancel appointments.' });
      }
    } else if (authUser.role === 'agronomist') {
      if (
        consultation.expertId !== authUser.id &&
        consultation.expertName !== authUser.name &&
        authUser.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied: You are not authorized to manage consultations assigned to another expert.',
        });
      }
    }

    consultation.status = status as 'pending' | 'confirmed' | 'cancelled';
    await consultation.save();

    res.json({
      success: true,
      message: `Consultation status updated to ${status}`,
      data: consultation,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
