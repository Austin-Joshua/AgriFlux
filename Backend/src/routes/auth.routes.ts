import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { auth, requireRole } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();

// Password & verification rate limiter (lenient in development, strict in production)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 10 : 200,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP dispatch rate limiter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 5 : 100,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Social login rate limiter
const socialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 30 : 200,
  message: { success: false, message: 'Too many social login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Credibility Verification Endpoints
router.post('/send-otp', otpLimiter, authController.sendOtp);
router.post('/verify-otp', authLimiter, authController.verifyOtp);

// Core Authentication Endpoints
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/social-login', socialLimiter, authController.socialLogin);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/logout', authController.logout);

// Administrative role elevation: strictly requires valid admin token
router.patch('/users/:userId/role', auth, requireRole('admin'), authController.updateUserRole);

export default router;
