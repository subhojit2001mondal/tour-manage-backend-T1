import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase applet configuration
let firebaseConfig: any = {};
try {
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e: any) {
  console.warn('[Firebase Admin] Could not read firebase-applet-config.json:', e.message);
}

const targetProjectId = firebaseConfig.projectId || 'polynomial-path-2vxch';
const targetDatabaseId = firebaseConfig.firestoreDatabaseId || 'ai-studio-dae5c51a-b0ae-407b-aafd-5180425e30e1';

console.log(`[Firebase Admin] Target Project ID: "${targetProjectId}"`);
console.log(`[Firebase Admin] Target Database ID: "${targetDatabaseId}" (not defaulting to "(default)")`);

// Determine credentials
let credential: any = undefined;
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountEnv) {
  try {
    const raw = serviceAccountEnv.trim();
    let serviceAccount: any;
    if (raw.startsWith('{')) {
      serviceAccount = JSON.parse(raw);
    } else if (fs.existsSync(raw)) {
      serviceAccount = JSON.parse(fs.readFileSync(raw, 'utf8'));
    } else {
      serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
    credential = cert(serviceAccount);
    console.log(`[Firebase Admin] Successfully initialized credential from FIREBASE_SERVICE_ACCOUNT (client_email: ${serviceAccount.client_email}, project_id: ${serviceAccount.project_id})`);
  } catch (err: any) {
    console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', err.message);
  }
} else {
  // Check for local service account files
  const possiblePaths = [
    path.resolve(__dirname, '../service-account.json'),
    path.resolve(__dirname, '../firebase-service-account.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const sa = JSON.parse(fs.readFileSync(p, 'utf8'));
        credential = cert(sa);
        console.log(`[Firebase Admin] Initialized credential from local file ${p} (${sa.client_email})`);
        break;
      } catch (err: any) {
        console.error(`[Firebase Admin] Failed to parse ${p}:`, err.message);
      }
    }
  }

  if (!credential) {
    console.warn('[Firebase Admin] WARNING: No FIREBASE_SERVICE_ACCOUNT environment variable configured.');
    console.warn('[Firebase Admin] WARNING: Using Application Default Credentials (ADC). If ADC is from a different GCP project, calls to Firestore or Auth will fail with "7 PERMISSION_DENIED".');
  }
}

// Internal instances that can be re-initialized at runtime
let appInstance: App = getApps().length
  ? getApp()
  : initializeApp({
      projectId: targetProjectId,
      storageBucket: firebaseConfig.storageBucket,
      ...(credential ? { credential } : {}),
    });

let currentDb = targetDatabaseId
  ? getFirestore(appInstance, targetDatabaseId)
  : getFirestore(appInstance);

let currentAuth = getAuth(appInstance);
let currentStorage = getStorage(appInstance);

export function updateFirebaseAdminCredentials(serviceAccount: any) {
  try {
    const newCred = cert(serviceAccount);
    // Initialize a new specific app instance with timestamp suffix or recreate
    const appName = `admin-app-${Date.now()}`;
    const newApp = initializeApp({
      projectId: serviceAccount.project_id || targetProjectId,
      storageBucket: firebaseConfig.storageBucket,
      credential: newCred,
    }, appName);

    currentDb = targetDatabaseId
      ? getFirestore(newApp, targetDatabaseId)
      : getFirestore(newApp);

    currentAuth = getAuth(newApp);
    currentStorage = getStorage(newApp);

    console.log(`[Firebase Admin] Dynamic credentials reloaded successfully for ${serviceAccount.client_email}`);
    return { success: true, email: serviceAccount.client_email };
  } catch (err: any) {
    console.error('[Firebase Admin] Error reloading dynamic credentials:', err.message);
    throw err;
  }
}

// Proxies so all consumers get the updated instances seamlessly
export const adminDb = new Proxy({} as any, {
  get(_target, prop) {
    const val = (currentDb as any)[prop];
    return typeof val === 'function' ? val.bind(currentDb) : val;
  },
});

export const adminAuth = new Proxy({} as any, {
  get(_target, prop) {
    const val = (currentAuth as any)[prop];
    return typeof val === 'function' ? val.bind(currentAuth) : val;
  },
});

export const adminStorage = new Proxy({} as any, {
  get(_target, prop) {
    const val = (currentStorage as any)[prop];
    return typeof val === 'function' ? val.bind(currentStorage) : val;
  },
});

export { FieldValue, Timestamp };
export { targetProjectId, targetDatabaseId };
