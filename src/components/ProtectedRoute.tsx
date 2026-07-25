import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireOnboarding = true,
}) => {
  const { isAuthenticated, role, onboardingCompleted, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'student') {
    if (requireOnboarding && !onboardingCompleted && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }

    if (location.pathname === '/onboarding' && onboardingCompleted) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
