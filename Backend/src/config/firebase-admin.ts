import * as admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin SDK using the centralized env config
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
    });
}

export const adminAuth = admin.auth();
export default admin;
