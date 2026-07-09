import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('studyai_token'));
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth state changes automatically
  useEffect(() => {
    if (!auth) {
      const localToken = localStorage.getItem('studyai_token');
      if (localToken === "mock-token-123") {
        setUser({
          uid: "dev_user_123",
          email: "student@studyai.edu",
          name: "Dev Student",
          is_mock: true
        });
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken(true);
          localStorage.setItem('studyai_token', idToken);
          setToken(idToken);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Student',
            photoURL: firebaseUser.photoURL,
            is_mock: false
          });
        } catch (error) {
          console.error("Error fetching Firebase ID Token:", error);
          logout();
        }
      } else {
        // If not authenticated by Firebase, verify if we have a dev mock-token bypass active
        const localToken = localStorage.getItem('studyai_token');
        if (localToken === "mock-token-123") {
          setUser({
            uid: "dev_user_123",
            email: "student@studyai.edu",
            name: "Dev Student",
            is_mock: true
          });
        } else {
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) {
      const errMsg = "Authentication is currently unavailable. Firebase configuration is incomplete.";
      console.error(errMsg);
      alert(errMsg);
      throw new Error(errMsg);
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      localStorage.setItem('studyai_token', idToken);
      setToken(idToken);
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || 'Student',
        photoURL: result.user.photoURL,
        is_mock: false
      };
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginMock = (email = "student@studyai.edu") => {
    const mockToken = "mock-token-123";
    const mockUser = {
      uid: "dev_user_123",
      email: email,
      name: "Dev Student",
      is_mock: true
    };
    localStorage.setItem('studyai_token', mockToken);
    setToken(mockToken);
    setUser(mockUser);
    return mockUser;
  };

  const logout = async () => {
    setLoading(true);
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out from Firebase:", error);
      }
    }
    localStorage.removeItem('studyai_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, loginMock, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
