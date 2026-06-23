import { Router } from 'express';
import * as consultationController from '../controllers/consultation.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/book', auth, consultationController.bookConsultation);
router.get('/my-bookings', auth, consultationController.getUserConsultations);
router.get('/all', auth, consultationController.getAllConsultations);
router.patch('/:id/status', auth, consultationController.updateConsultationStatus);

export default router;
