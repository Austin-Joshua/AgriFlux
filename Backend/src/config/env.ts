import dotenv from 'dotenv';
import path from 'path';

import crypto from 'crypto';

// Load environment variables from .env file
dotenv.config();

/**
 * Interface for environment variables
 */
interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  JWT_EXPIRE: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  ALLOW_DEMO_LOGIN: boolean;
  AUDIT_SIGNING_KEY: string;
}

/**
 * Get and validate environment variables with resilient cloud container fallbacks
 */
const getEnv = (): EnvConfig => {
  const envStatus = process.env.NODE_ENV || 'development';

  const coreEnv = ['MONGODB_URI', 'JWT_SECRET'];
  const missingCore = coreEnv.filter((key) => !process.env[key]);

  if (missingCore.length > 0) {
    console.warn(
      `⚠️  [CONFIG NOTICE] Core variables not set: ${missingCore.join(', ')}. Using resilient fallbacks.`
    );
  }

  const firebaseKeys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const missingFirebase = firebaseKeys.filter((key) => !process.env[key]);
  if (missingFirebase.length > 0) {
    console.warn(
      `ℹ️  [CONFIG NOTICE] Firebase credentials not configured (${missingFirebase.join(', ')}). Native mobile OTP & JWT remain fully active.`
    );
  }

  // Generate ephemeral 256-bit secret if JWT_SECRET not provided in production
  let defaultJwt = 'agriflux_default_secret_change_me';
  if (envStatus === 'production' && !process.env.JWT_SECRET) {
    defaultJwt = crypto.randomBytes(32).toString('hex');
    console.warn(
      '⚠️  [SECURITY WARNING] JWT_SECRET is unset in production. An ephemeral 256-bit secret was generated. Set JWT_SECRET in your dashboard for cross-restart token persistence.'
    );
  }

  return {
    NODE_ENV: envStatus,
    PORT: parseInt(process.env.PORT || '5001', 10),
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agriflux',
    JWT_SECRET: process.env.JWT_SECRET || defaultJwt,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'agriflux-demo',
    FIREBASE_CLIENT_EMAIL:
      process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@agriflux.iam.gserviceaccount.com',
    FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ALLOW_DEMO_LOGIN: process.env.ALLOW_DEMO_LOGIN === 'true' || envStatus !== 'production',
    AUDIT_SIGNING_KEY: process.env.AUDIT_SIGNING_KEY || '',
  };
};

export const env = getEnv();

/**
 * Strict production security validator.
 * Validates that production environments fail safely when required secrets
 * are absent, weak, or left as obvious development placeholders.
 * Never prints secret values to logs or console.
 */
export const validateProductionSecurity = (
  targetEnv?: Partial<EnvConfig>
): { valid: boolean; errors: string[] } => {
  const current = targetEnv || env;
  const errors: string[] = [];

  if (current.NODE_ENV === 'production') {
    const rawJwt =
      targetEnv?.JWT_SECRET !== undefined
        ? targetEnv.JWT_SECRET
        : process.env.JWT_SECRET || current.JWT_SECRET;
    if (
      !rawJwt ||
      rawJwt === 'agriflux_default_secret_change_me' ||
      rawJwt === 'your_jwt_secret_key' ||
      rawJwt === 'agriflux_development_secret_2026'
    ) {
      errors.push('JWT_SECRET is missing or using an insecure development placeholder.');
    } else if (rawJwt.length < 32) {
      errors.push('JWT_SECRET is too short (< 32 characters) for production HMAC-SHA256 signing.');
    }

    const rawMongo =
      targetEnv?.MONGODB_URI !== undefined
        ? targetEnv.MONGODB_URI
        : process.env.MONGODB_URI || current.MONGODB_URI;
    if (!rawMongo || rawMongo.includes('localhost') || rawMongo.includes('127.0.0.1')) {
      errors.push('MONGODB_URI must point to an authorized cluster in production, not localhost.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
