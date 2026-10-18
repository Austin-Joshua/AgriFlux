import { Router } from 'express';
import * as consultationController from '../controllers/consultation.controller';
import { auth, requireRole } from '../middleware/auth';

const router = Router();

// Farmer: book a consultation
router.post('/book', auth, consultationController.bookConsultation);

// Farmer: view their own bookings
router.get('/my-bookings', auth, consultationController.getUserConsultations);

// Agronomist / Admin: view ALL bookings
router.get(
  '/all',
  auth,
  requireRole('agronomist', 'admin'),
  consultationController.getAllConsultations
);

// Agronomist / Admin / Farmer: update booking status (farmers can only cancel own booking)
router.patch(
  '/:id/status',
  auth,
  requireRole('agronomist', 'admin', 'farmer'),
  consultationController.updateConsultationStatus
);

export default router;
