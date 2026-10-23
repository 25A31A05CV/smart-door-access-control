import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { CollegeUser, AccessLog, AdminCredential } from '../types';

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'accessLogs';
const APP_USERS_COLLECTION = 'appUsers';
const ADMINS_COLLECTION = 'adminCredentials';

/**
 * Sync authenticated Firebase user metadata to Firestore
 */
export async function syncAppUserProfile(firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const path = `${APP_USERS_COLLECTION}/${firebaseUser.uid}`;
  try {
    const userDocRef = doc(db, APP_USERS_COLLECTION, firebaseUser.uid);
    await setDoc(
      userDocRef,
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Authorized User',
        photoURL: firebaseUser.photoURL || '',
        role: 'Verified Operator',
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Real-time subscription to college users (students/faculty)
 */
export function subscribeToCollegeUsers(
  onSuccess: (users: CollegeUser[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = USERS_COLLECTION;
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const users: CollegeUser[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as CollegeUser);
        });
        onSuccess(users);
      },
      (error) => {
        console.warn('Firestore users subscription status:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save or update a College User profile in Firestore
 */
export async function saveCollegeUserToFirestore(user: CollegeUser): Promise<void> {
  const path = `${USERS_COLLECTION}/${user.id}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete a College User from Firestore
 */
export async function deleteCollegeUserFromFirestore(userId: string): Promise<void> {
  const path = `${USERS_COLLECTION}/${userId}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Real-time subscription to access logs
 */
export function subscribeToAccessLogs(
  onSuccess: (logs: AccessLog[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = LOGS_COLLECTION;
  try {
    const logsRef = collection(db, LOGS_COLLECTION);
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(150));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs: AccessLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push(docSnap.data() as AccessLog);
        });
        onSuccess(logs);
      },
      (error) => {
        console.warn('Firestore logs subscription status:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save an access log transaction to Firestore
 */
export async function saveAccessLogToFirestore(log: AccessLog): Promise<void> {
  const path = `${LOGS_COLLECTION}/${log.id}`;
  try {
    const docRef = doc(db, LOGS_COLLECTION, log.id);
    await setDoc(docRef, log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Real-time subscription to Administrator credentials
 */
export function subscribeToAdmins(
  onSuccess: (admins: AdminCredential[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = ADMINS_COLLECTION;
  try {
    const adminsRef = collection(db, ADMINS_COLLECTION);
    const unsubscribe = onSnapshot(
      adminsRef,
      (snapshot) => {
        const admins: AdminCredential[] = [];
        snapshot.forEach((docSnap) => {
          admins.push(docSnap.data() as AdminCredential);
        });
        onSuccess(admins);
      },
      (error) => {
        console.warn('Firestore admins subscription status:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save or update an Administrator Credential in Firestore
 */
export async function saveAdminToFirestore(admin: AdminCredential): Promise<void> {
  const path = `${ADMINS_COLLECTION}/${admin.username.toLowerCase()}`;
  try {
    const docRef = doc(db, ADMINS_COLLECTION, admin.username.toLowerCase());
    await setDoc(docRef, admin, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete an Administrator from Firestore
 */
export async function deleteAdminFromFirestore(username: string): Promise<void> {
  const path = `${ADMINS_COLLECTION}/${username.toLowerCase()}`;
  try {
    const docRef = doc(db, ADMINS_COLLECTION, username.toLowerCase());
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Save full list of Admins to Firestore
 */
export async function saveAllAdminsToFirestore(admins: AdminCredential[]): Promise<void> {
  for (const admin of admins) {
    await saveAdminToFirestore(admin);
  }
}

/**
 * Sync entire current dataset (admins, users, logs) directly to Firestore
 */
export async function syncAllDataToFirestore(
  admins: AdminCredential[],
  users: CollegeUser[],
  logs: AccessLog[]
): Promise<{ success: boolean; syncedAdmins: number; syncedUsers: number; syncedLogs: number; error?: string }> {
  try {
    for (const a of admins) {
      await setDoc(doc(db, ADMINS_COLLECTION, a.username.toLowerCase()), a, { merge: true });
    }
    for (const u of users) {
      await setDoc(doc(db, USERS_COLLECTION, u.id), u, { merge: true });
    }
    for (const l of logs) {
      await setDoc(doc(db, LOGS_COLLECTION, l.id), l, { merge: true });
    }
    return {
      success: true,
      syncedAdmins: admins.length,
      syncedUsers: users.length,
      syncedLogs: logs.length,
    };
  } catch (err) {
    console.error('Error syncing complete dataset to Firestore:', err);
    return {
      success: false,
      syncedAdmins: 0,
      syncedUsers: 0,
      syncedLogs: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Seed initial students, faculty, and admins if database collection is empty
 */
export async function seedInitialDataIfEmpty(
  initialUsers: CollegeUser[],
  initialLogs: AccessLog[],
  initialAdmins?: AdminCredential[]
): Promise<void> {
  try {
    if (initialAdmins && initialAdmins.length > 0) {
      const adminsSnapshot = await getDocs(collection(db, ADMINS_COLLECTION));
      if (adminsSnapshot.empty) {
        console.log('Seeding initial administrator credentials into Firestore...');
        for (const a of initialAdmins) {
          await setDoc(doc(db, ADMINS_COLLECTION, a.username.toLowerCase()), a);
        }
      }
    }

    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    if (usersSnapshot.empty && initialUsers.length > 0) {
      console.log('Seeding initial college students and faculty into Firestore...');
      for (const u of initialUsers) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), u);
      }
    }

    const logsSnapshot = await getDocs(collection(db, LOGS_COLLECTION));
    if (logsSnapshot.empty && initialLogs.length > 0) {
      console.log('Seeding initial attendance logs into Firestore...');
      for (const l of initialLogs) {
        await setDoc(doc(db, LOGS_COLLECTION, l.id), l);
      }
    }
  } catch (err) {
    console.warn('Initial seeding check skipped or deferred:', err);
  }
}
