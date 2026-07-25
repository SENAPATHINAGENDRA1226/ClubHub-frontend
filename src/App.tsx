import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AppLayout } from './layouts/AppLayout';
import { 
  AdminDashboardPage,
  ManageUsersPage,
  VerifyRegistrationsPage,
  ManageEventsPage,
  ManageCertificatesPage,
  ManageCommitteesPage,
  ManageAlumniPage,
  ManageGrievancesPage,
  AdminSettingsPage
} from './pages/admin';
import { 
  ProfilePage, 
  RegistrationsPage, 
  EventsPage,
  CertificatesPage,
  ResourcesPage,
  OpportunitiesPage,
  CommitteesPage,
  AlumniAchievementsPage,
  MediaPage,
  GrievancePage,
  ContactUsPage
} from './pages/student';
import { Error404Page, Error403Page } from './pages/errors';
import { AlumniJoinPage } from './pages/public';

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, role, onboardingCompleted, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'student') {
    if (!onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/alumni/join" element={<AlumniJoinPage />} />

            {/* Protected Onboarding Route */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute allowedRoles={['student']} requireOnboarding={false}>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Routes wrapped in AppLayout */}
            <Route element={<AppLayout />}>
              {/* Student Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/registrations"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <RegistrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <EventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificates"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CertificatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ResourcesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/opportunities"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <OpportunitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/committees"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CommitteesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alumni-achievements"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <AlumniAchievementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MediaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grievance"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <GrievancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contact"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ContactUsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin & Committee Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'committee']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verify"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'committee']}>
                    <VerifyRegistrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'committee']}>
                    <ManageEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/certificates"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageCertificatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/committees"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageCommitteesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/alumni"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManageAlumniPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/grievances"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'committee']}>
                    <ManageGrievancesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Error Routes */}
            <Route path="/403" element={<Error403Page />} />
            <Route path="/404" element={<Error404Page />} />
            <Route path="*" element={<Error404Page />} />
          </Routes>
        </Router>
      </RealtimeProvider>
    </AuthProvider>
  );
};

export default App;
