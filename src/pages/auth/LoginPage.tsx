import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { UserRole } from '../../types/auth';
import { Award, Lock, Mail, QrCode, Shield, Sparkles, UserCheck, Users, AlertTriangle, UserX, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupModal, setPopupModal] = useState<'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' | null>(null);

  const handleTabChange = (tab: UserRole) => {
    setActiveTab(tab);
    setPopupModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPopupModal(null);

    try {
      if (activeTab === 'student') {
        const res = await api.post('/auth/student/login', { email, password });
        const { access_token, refresh_token, is_first_login, onboarding_completed } = res.data;

        // Fetch /me with header or construct user from login payload
        let userData = {
          id: res.data.user_id,
          email: res.data.email,
          role: 'student' as UserRole,
          is_active: true,
          is_first_login: is_first_login ?? false,
        };

        try {
          const meRes = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          userData = meRes.data;
        } catch (meErr) {
          // Fallback to token payload if /auth/me fails
        }

        login(access_token, refresh_token, userData, 'student', onboarding_completed ?? false);

        if (is_first_login || !onboarding_completed) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else if (activeTab === 'admin') {
        const res = await api.post('/auth/admin/login', { email, password });
        const { access_token, refresh_token } = res.data;

        let userData = {
          id: res.data.user_id,
          email: res.data.email,
          role: 'admin' as UserRole,
          is_active: true,
          is_first_login: false,
        };

        try {
          const meRes = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          userData = meRes.data;
        } catch (meErr) {
          // Fallback to token payload
        }

        login(access_token, refresh_token, userData, 'admin', true);
        navigate('/admin/dashboard');
      } else if (activeTab === 'committee') {
        const res = await api.post('/auth/committee/login', { email, password });
        const { access_token, refresh_token } = res.data;

        let userData = {
          id: res.data.user_id,
          email: res.data.email,
          role: 'committee' as UserRole,
          is_active: true,
          is_first_login: false,
        };

        try {
          const meRes = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          userData = meRes.data;
        } catch (meErr) {
          // Fallback to token payload
        }

        login(access_token, refresh_token, userData, 'committee', true);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const errData = err.response.data;
        const detailStr = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);

        if (
          status === 404 ||
          errData.code === 'ACCOUNT_NOT_FOUND' ||
          detailStr?.includes('ACCOUNT_NOT_FOUND')
        ) {
          setPopupModal('ACCOUNT_NOT_FOUND');
        } else if (
          status === 401 ||
          errData.code === 'INVALID_CREDENTIALS' ||
          detailStr?.includes('INVALID_CREDENTIALS') ||
          detailStr?.includes('Invalid')
        ) {
          setPopupModal('INVALID_CREDENTIALS');
        } else {
          setPopupModal('INVALID_CREDENTIALS');
        }
      } else {
        setPopupModal('INVALID_CREDENTIALS');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans selection:bg-sky-500 selection:text-white">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-12 flex-col justify-between border-r border-slate-800/80">
        {/* Glow Effects */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">ClubHub</span>
            <span className="block text-xs font-semibold text-sky-400 uppercase tracking-widest">Campus Community</span>
          </div>
        </div>

        {/* Middle Tagline & Features */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/50 text-sky-300 text-xs font-medium mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Empowering Student Builders
          </div>

          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200">builders</span> meet.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            An all-in-one campus ecosystem for hackathons, event check-ins, HMAC digital certificates, and committee collaboration.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-sky-950 border border-sky-800/50 text-sky-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Instant QR Code Check-ins</h4>
                <p className="text-xs text-slate-400">Tamper-proof HMAC digital event verification</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800/50 text-indigo-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Verifiable Certificates</h4>
                <p className="text-xs text-slate-400">PDF streaming & bulk ZIP certificate generation</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-800/50 text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Realtime Committee Workspaces</h4>
                <p className="text-xs text-slate-400">Live WebSockets event synchronization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-6">
          <span>&copy; 2026 ClubHub Platform</span>
          <span className="font-mono text-slate-400">v1.0.0 Stable</span>
        </div>
      </div>

      {/* Right Login Card Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header Mobile / Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex lg:hidden items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500 text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-2xl font-extrabold text-white">ClubHub</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="text-sm text-slate-400">Select your access role to sign in</p>
          </div>

          {/* 3-Way Pill Toggle */}
          <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Student
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('committee')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'committee'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Committee
            </button>
          </div>

          {/* Main Card Container */}
          <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activeTab === 'admin'
                        ? 'admin@clubhub.com'
                        : activeTab === 'committee'
                        ? 'committee@clubhub.com'
                        : 'student@example.com'
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign in as {activeTab === 'student' ? 'Student' : activeTab === 'admin' ? 'System Admin' : 'Committee Lead'}
                  </>
                )}
              </button>
            </form>

            {/* Bottom link for student */}
            {activeTab === 'student' && (
              <div className="text-center pt-2 border-t border-slate-800/80">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Modal for Account Not Found & Invalid Credentials */}
      <AnimatePresence>
        {popupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setPopupModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {popupModal === 'ACCOUNT_NOT_FOUND' ? (
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                    <UserX className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Account Not Found</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      No registered account was found for <strong className="text-sky-400">{email}</strong>. Please sign up to create your account.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPopupModal(null);
                        navigate(`/signup?email=${encodeURIComponent(email)}`);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
                    >
                      Sign Up Now <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopupModal(null)}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                    >
                      Try Another Email
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Invalid Credentials</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      The password or email address you entered is incorrect. Please check your details and try again.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setPopupModal(null)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-rose-600/30"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
