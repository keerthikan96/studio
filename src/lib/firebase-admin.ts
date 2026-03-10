import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

type BackendProvider = 'postgres' | 'firebase';
type StorageProvider = 'azure' | 'firebase';

const authProvider = (process.env.AUTH_PROVIDER || '').toLowerCase() as BackendProvider | '';
const dataProvider = (process.env.DATA_BACKEND_PROVIDER || '').toLowerCase() as BackendProvider | '';
const storageProvider = (process.env.FILE_STORAGE_PROVIDER || '').toLowerCase() as StorageProvider | '';

function getServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
    if (parsed.private_key) {
      parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
    }
    return parsed;
  }

  if (
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PROJECT_ID
  ) {
    return {
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      projectId: process.env.FIREBASE_PROJECT_ID,
    };
  }

  return null;
}

export function isFirebaseAuthEnabled() {
  return authProvider === 'firebase';
}

export function isFirebaseDataEnabled() {
  return dataProvider === 'firebase';
}

export function isFirebaseStorageEnabled() {
  return storageProvider === 'firebase';
}

export function shouldUseFirebaseBackend() {
  return isFirebaseAuthEnabled() || isFirebaseDataEnabled() || isFirebaseStorageEnabled();
}

export function hasFirebaseAdminConfiguration() {
  return Boolean(getServiceAccountFromEnv() || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

function getFirebaseAdminApp() {
  if (!shouldUseFirebaseBackend()) {
    throw new Error('Firebase backend is not enabled.');
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = getServiceAccountFromEnv();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  return initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}