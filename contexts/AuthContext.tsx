
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc,
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
  loginWithGoogleRedirect: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  loginAsGuest: () => void;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
  setOnboardingData: (role: 'student' | 'teacher', level: string) => Promise<void>;
  trackFlashcardFlip: () => void;
  trackQuizResult: (isCorrect: boolean) => void;
  logout: () => void;
}

const DUMMY_USER: User = {
  uid: 'dummy-user-id',
  name: 'Guest User',
  email: 'guest@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  role: 'student',
  level: 'Beginner',
  isGuest: true
};

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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const handleUserDoc = async (firebaseUser: any) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        const userData: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || undefined
        };
        await setDoc(userRef, {
          ...userData,
          totalMinutes: 0,
          flashcardsFlipped: 0,
          quizCorrect: 0,
          quizTotal: 0,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error handling user doc:", error);
    }
  };

  // Listen for Auth State Changes
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await handleUserDoc(result.user);
        }
      } catch (error) {
        console.error("Redirect login error:", error);
      }
    };
    checkRedirect();

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
        // If no user is logged in, we can still use the dummy user for testing if we want
        // But for a real sign-out feature, we should set it to null
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
      if (user.isGuest) {
        setStats(prev => ({ ...prev, totalMinutes: prev.totalMinutes + 1 }));
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, {
          totalMinutes: increment(1)
        }, { merge: true });
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
        console.log("Popup blocked, trying redirect...");
        await loginWithGoogleRedirect();
      } else {
        console.error("Google Sign-In Error", error);
        // Fallback to redirect for other errors that might be domain-related
        await loginWithGoogleRedirect();
      }
    }
  };

  const loginWithGoogleRedirect = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Google Redirect Error", error);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email Login Error", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateAuthProfile(result.user, { displayName: name });
      // The onAuthStateChanged listener will handle the Firestore document creation
    } catch (error) {
      console.error("Email Signup Error", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password Reset Error", error);
      throw error;
    }
  };

  const updateProfile = async (name: string, avatar?: string) => {
    if (!user) return;
    if (user.isGuest) {
      setUser(prev => prev ? { ...prev, name, avatar: avatar || prev.avatar } : null);
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { name, avatar: avatar || user.avatar });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth.currentUser);
    }
  };

  const setOnboardingData = async (role: 'student' | 'teacher', level: string) => {
    if (!user) return;
    if (user.isGuest) {
      setUser(prev => prev ? { ...prev, role, level } : null);
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { role, level });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth.currentUser);
    }
  };

  const trackFlashcardFlip = async () => {
    if (!user) return;
    if (user.isGuest) {
      setStats(prev => ({ ...prev, flashcardsFlipped: prev.flashcardsFlipped + 1 }));
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { flashcardsFlipped: increment(1) });
    } catch (error) {
      console.error("Error tracking flashcard flip", error);
    }
  };

  const trackQuizResult = async (isCorrect: boolean) => {
    if (!user) return;
    if (user.isGuest) {
      setStats(prev => ({
        ...prev,
        quizCorrect: prev.quizCorrect + (isCorrect ? 1 : 0),
        quizTotal: prev.quizTotal + 1
      }));
      return;
    }
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

  const logout = async () => {
    setUser(null);
    await signOut(auth);
  };

  const loginAsGuest = () => {
    setUser(DUMMY_USER);
    setIsLoading(false);
  };

  const setupRecaptcha = (containerId: string) => {
    if (recaptchaVerifier) return recaptchaVerifier;
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('Recaptcha resolved');
      }
    });
    setRecaptchaVerifier(verifier);
    return verifier;
  };

  const sendOtp = async (phoneNumber: string) => {
    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
    } catch (error) {
      console.error("Error sending OTP", error);
      throw error;
    }
  };

  const verifyOtp = async (otp: string) => {
    if (!confirmationResult) throw new Error("No confirmation result");
    try {
      const result = await confirmationResult.confirm(otp);
      if (result.user) {
        // Update name to phone number if no name exists
        if (!result.user.displayName) {
          await updateAuthProfile(result.user, { displayName: result.user.phoneNumber || 'User' });
        }
        await handleUserDoc(result.user);
      }
    } catch (error) {
      console.error("Error verifying OTP", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      stats, 
      isLoading, 
      loginWithGoogle, 
      loginWithGoogleRedirect,
      loginWithEmail,
      signUpWithEmail,
      resetPassword,
      sendOtp,
      verifyOtp,
      loginAsGuest,
      updateProfile, 
      setOnboardingData,
      trackFlashcardFlip, 
      trackQuizResult, 
      logout 
    }}>
      <div id="recaptcha-container"></div>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
