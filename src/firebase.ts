import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';

// Hardcoded Firebase configuration for 100% stability across Web & Android Capacitor APK
export const firebaseConfig = {
  projectId: "gen-lang-client-0070276181",
  appId: "1:102036041427:web:b529b4f75e36c4c474ae26",
  apiKey: "AIzaSyDpMF1zkqFQcrnKDQY0sX6mDFvLAhhX058",
  authDomain: "gen-lang-client-0070276181.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-goldledger-cb8d516c-58ce-4163-b0ec-161ff1e550f6",
  storageBucket: "gen-lang-client-0070276181.firebasestorage.app",
  messagingSenderId: "102036041427",
  measurementId: "",
  oAuthClientId: "102036041427-7pkavua1h50sp3lcr1u786fa5sbg8roi.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Ensure auth session persists on this device in localStorage / IndexedDB until user explicitly logs out
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase persistence warning:', err);
  });
} catch (e) {
  console.warn('Error configuring local persistence:', e);
}

// Error handling conforming strictly to the Firestore skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore as mandated by the skill
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    const fetchPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 2500)
    );
    await Promise.race([fetchPromise, timeoutPromise]);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('unavailable') || error.message.includes('timeout')) {
        console.warn('Firebase connection: operating in offline mode or initializing.');
      }
    }
    return false;
  }
}

// Auth helpers: Google Sign-In
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

// Auth helpers: Email & Password Sign-In
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  } catch (error) {
    console.error('Email sign-in failed:', error);
    throw error;
  }
}

// Auth helpers: Email & Password Registration
export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && displayName.trim()) {
      try {
        await updateProfile(res.user, { displayName: displayName.trim() });
      } catch (profileErr) {
        console.warn('Failed to update displayName:', profileErr);
      }
    }
    return res.user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

// Auth helpers: Password Reset
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
}

// Auth helpers: Sign Out
export async function logOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
}
export { onAuthStateChanged };
export type { User };

