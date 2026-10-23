import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { syncAppUserProfile } from './firestoreService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOutFirebase: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  loading: true,
  signInWithGoogle: async () => {},
  logOutFirebase: async () => {},
  authError: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setLoading(false);
      if (user) {
        try {
          await syncAppUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
        } catch (e) {
          console.warn('Could not sync user profile to Firestore:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncAppUserProfile({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
      }
    } catch (err: unknown) {
      console.error('Firebase Google Sign-In Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setAuthError(msg);
      throw err;
    }
  };

  const logOutFirebase = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      console.error('Firebase Sign-Out Error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        loading,
        signInWithGoogle,
        logOutFirebase,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => useContext(AuthContext);
