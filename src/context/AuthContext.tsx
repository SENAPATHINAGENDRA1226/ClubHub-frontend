import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { User, UserRole } from '../types/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  isLoading: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    user: User,
    role: UserRole,
    onboardingCompleted: boolean
  ) => void;
  logout: () => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          const userData: User = res.data;
          setUser(userData);
          setRole(userData.role);
          setToken(storedToken);

          if (userData.role === 'student' && userData.profile) {
            setOnboardingCompleted(userData.profile.onboarding_completed);
          } else {
            setOnboardingCompleted(true);
          }
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setRole(null);
          setToken(null);
          setOnboardingCompleted(false);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (
    accessToken: string,
    refreshToken: string,
    userData: User,
    userRole: UserRole,
    onboardingState: boolean
  ) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    setUser(userData);
    setRole(userRole);
    setOnboardingCompleted(onboardingState);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    setRole(null);
    setOnboardingCompleted(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user && !!token,
        onboardingCompleted,
        isLoading,
        login,
        logout,
        setOnboardingCompleted,
        setUser,
      }}
    >
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
