import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api, { getErrorMessage } from '../../services/api';
import { Lock, Mail, Sparkles, User, UserCheck, Compass, Code } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/student/signup', {
        name,
        email,
        password,
        confirm_password: confirmPassword,
      });

      const { access_token, refresh_token } = res.data;

      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      login(access_token, refresh_token, meRes.data, 'student', false);
      navigate('/onboarding');
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err, 'Signup failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen font-sans selection:bg-sky-500 selection:text-white ${theme === 'light' ? 'auth-page-bg' : 'bg-slate-950'}`}>
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-12 flex-col justify-between border-r border-slate-800/80">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl overflow-hidden bg-slate-900/40 border border-slate-800 shadow-lg shrink-0">
            <img src="/logo.png" alt="DLIDES Student Club Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">DLIDES CLUB</span>
            <span className="block text-xs font-semibold text-sky-400 uppercase tracking-widest">Department Of CSMD</span>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/50 text-sky-300 text-xs font-semibold mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Learn. Build. Lead.
          </div>

          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Learn. Build. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200">Lead.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            A student-driven community for coding, innovation, and growth. Explore events, track your progress, earn certificates, and unlock opportunities — all in one place.
          </p>

          <div className="space-y-4">
            <motion.div
              whileHover={{ x: 8, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md hover:border-sky-500 hover:ring-2 hover:ring-sky-500/20 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer transition-all duration-300"
            >
              <div className="p-2 rounded-xl bg-sky-950 border border-sky-800/50 text-sky-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Login to Portal</h4>
                <p className="text-xs text-slate-400">Access student and admin features, events, and registrations.</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 8, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md hover:border-sky-500 hover:ring-2 hover:ring-sky-500/20 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer transition-all duration-300"
            >
              <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800/50 text-indigo-400 shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Explore the Club</h4>
                <p className="text-xs text-slate-400">Join hackathons, workshops, coding contests, and projects.</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 8, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md hover:border-sky-500 hover:ring-2 hover:ring-sky-500/20 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer transition-all duration-300"
            >
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-800/50 text-purple-400 shrink-0">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">About the Club</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Coding Club empowers students through hands-on workshops, competitive programming, hackathons, and real-world projects. Whether you are beginning your journey or refining your expertise, this is the space to grow, collaborate, and stand out.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-6">
          <span>&copy; 2026 CSMD DLIDES CLUB Platform</span>
          <span className="font-mono text-slate-400">v1.0.0 Stable</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Create Student Account</h2>
            <p className="text-sm text-slate-400">Fill in your details to get started</p>
          </div>

          <div className={`p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6 ${theme === 'light' ? 'auth-card' : 'bg-slate-900/90 border border-slate-800'}`}>
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0"></span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

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
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password (Min 8 chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Create Account & Proceed to Onboarding'
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
