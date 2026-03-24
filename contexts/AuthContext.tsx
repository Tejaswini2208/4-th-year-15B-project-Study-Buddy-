
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, currentUser?: any) {
  const user = currentUser || auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo: user?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserStats {
  totalMinutes: number;
  flashcardsFlipped: number;
  quizCorrect: number;
  quizTotal: number;
}

interface AuthContextType {
  user: User | null;
  stats: UserStats;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
  setOnboardingData: (role: 'student' | 'teacher', level: string) => Promise<void>;
  trackFlashcardFlip: () => void;
  trackQuizResult: (isCorrect: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_STATS: UserStats = {
  totalMinutes: 0,
  flashcardsFlipped: 0,
  quizCorrect: 0,
  quizTotal: 0,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || undefined
        };
        setUser(userData);
        
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userData: User = {
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'User',
              email: data.email || firebaseUser.email || '',
              avatar: data.avatar || firebaseUser.photoURL || undefined,
              role: data.role,
              level: data.level
            };
            setUser(userData);
            setStats({
              totalMinutes: data.totalMinutes || 0,
              flashcardsFlipped: data.flashcardsFlipped || 0,
              quizCorrect: data.quizCorrect || 0,
              quizTotal: data.quizTotal || 0,
            });
          } else {
            // New user initialization
            const userData: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || undefined
            };
            setUser(userData);
            setDoc(userRef, {
              ...userData,
              totalMinutes: 0,
              flashcardsFlipped: 0,
              quizCorrect: 0,
              quizTotal: 0
            }, { merge: true });
          }
          setIsLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`, firebaseUser);
          setIsLoading(false);
        });

        return () => unsubscribeUser();
      } else {
        setUser(null);
        setStats(INITIAL_STATS);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Track session time (increments every minute)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          totalMinutes: increment(1)
        });
      } catch (error: any) {
        console.error("Error updating minutes", error);
        // If the document is too large, we need to fix it
        if (error.message?.includes('exceeds the maximum allowed size')) {
          console.warn("User document is too large. Attempting to clear avatar to restore functionality.");
          try {
            await updateDoc(userRef, { avatar: '' });
          } catch (e) {
            console.error("Failed to clear large avatar", e);
          }
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup was closed by the user.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Sign-in request was cancelled.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("The sign-in popup was blocked by your browser. Please enable popups for this site.");
      } else {
        console.error("Google Sign-In Error", error);
      }
    }
  };

  const updateProfile = async (name: string, avatar?: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { name, avatar: avatar || user.avatar });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth.currentUser);
    }
  };

  const setOnboardingData = async (role: 'student' | 'teacher', level: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { role, level });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth.currentUser);
    }
  };

  const trackFlashcardFlip = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { flashcardsFlipped: increment(1) });
    } catch (error) {
      console.error("Error tracking flashcard flip", error);
    }
  };

  const trackQuizResult = async (isCorrect: boolean) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        quizCorrect: increment(isCorrect ? 1 : 0),
        quizTotal: increment(1)
      });
    } catch (error) {
      console.error("Error tracking quiz result", error);
    }
  };

  const logout = () => {
    signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      stats, 
      isLoading, 
      loginWithGoogle, 
      updateProfile, 
      setOnboardingData,
      trackFlashcardFlip, 
      trackQuizResult, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
