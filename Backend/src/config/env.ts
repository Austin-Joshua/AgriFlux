import dotenv from 'dotenv';
import path from 'path';

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
}

/**
 * Get and validate environment variables
 */
const getEnv = (): EnvConfig => {
    const envStatus = process.env.NODE_ENV || 'development';
    
    // Required variables
    const requiredEnv = [
        'MONGODB_URI', 
        'JWT_SECRET', 
        'FIREBASE_PROJECT_ID', 
        'FIREBASE_CLIENT_EMAIL', 
        'FIREBASE_PRIVATE_KEY'
    ];
    
    for (const key of requiredEnv) {
        if (!process.env[key]) {
            console.warn(`⚠️  [SECURITY WARNING] Missing environment variable: ${key}. Setting a fallback for development.`);
            if (envStatus === 'production') {
                throw new Error(`💥 [CRITICAL ERROR] Fatal: ${key} MUST be defined in production environment.`);
            }
        }
    }

    return {
        NODE_ENV: envStatus,
        PORT: parseInt(process.env.PORT || '5001', 10),
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agriflux',
        JWT_SECRET: process.env.JWT_SECRET || 'agriflux_default_secret_change_me',
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
        JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'agriflux-demo',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@agriflux.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    };
};

export const env = getEnv();
