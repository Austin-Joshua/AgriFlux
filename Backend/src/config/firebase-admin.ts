import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK using environment variables
// No service account JSON file needed — uses project config directly
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // The private key env var has literal '\n' — replace them with real newlines
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
    });
}

export const adminAuth = admin.auth();
export default admin;
