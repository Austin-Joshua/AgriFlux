import { Router, Request, Response, NextFunction } from 'express';
import * as consultationController from '../controllers/consultation.controller';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * Role-based access control middleware.
 * Restricts route access to specified roles only.
 */
const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions.' });
    }
    next();
};

// Farmer: book a consultation
router.post('/book', auth, consultationController.bookConsultation);

// Farmer: view their own bookings
router.get('/my-bookings', auth, consultationController.getUserConsultations);

// Agronomist / Admin: view ALL bookings
router.get('/all', auth, requireRole('agronomist', 'admin'), consultationController.getAllConsultations);

// Agronomist / Admin: update booking status (approve/reject)
router.patch('/:id/status', auth, requireRole('agronomist', 'admin'), consultationController.updateConsultationStatus);

export default router;
