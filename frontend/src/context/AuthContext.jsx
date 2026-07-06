import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('studyai_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Verify session on backend via authService
          const response = await authService.getSession(token);
          setUser(response.data.user);
        } catch (error) {
          console.error("Token verification failed, resetting auth states:", error);
          // If using development mock-token, let's preserve it to bypass server setup
          if (token === "mock-token-123") {
            setUser({
              uid: "dev_user_123",
              email: "student@studyai.edu",
              name: "Dev Student",
              is_mock: true
            });
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Call mock login endpoint directly via authService
      const response = await authService.loginMock(email, password);
      
      const { token: userToken, user: userData } = response.data;
      localStorage.setItem('studyai_token', userToken);
      setToken(userToken);
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('studyai_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
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
