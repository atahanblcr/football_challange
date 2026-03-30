import * as admin from 'firebase-admin';
import { env } from './env';

export const initFirebase = () => {
  if (admin.apps.length > 0) return;

  try {
    const serviceAccountJson = env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is missing. Push notifications will not work.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
};
