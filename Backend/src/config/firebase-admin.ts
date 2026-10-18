import * as admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin SDK using the centralized env config
if (!admin.apps.length) {
  if (
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    env.FIREBASE_PRIVATE_KEY &&
    env.FIREBASE_PRIVATE_KEY.includes('PRIVATE KEY')
  ) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
    } catch (err: any) {
      console.warn('⚠️ [FIREBASE] Credential init warning:', err.message);
      admin.initializeApp({
        projectId: env.FIREBASE_PROJECT_ID || 'agriflux-demo',
      });
    }
  } else {
    // Non-blocking fallback for cloud environments without Firebase secrets configured
    admin.initializeApp({
      projectId: env.FIREBASE_PROJECT_ID || 'agriflux-demo',
    });
  }
}

export const adminAuth = admin.auth();
export default admin;
