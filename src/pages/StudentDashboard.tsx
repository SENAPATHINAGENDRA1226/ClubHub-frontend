import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import api from '../services/api';
import { Award, Calendar, Users, Trophy, Sun, Sunrise, Sunset, Moon, Clock, Maximize2, X } from 'lucide-react';

interface QuickLink {
  title: string;
  url: string;
  icon: string;
}

interface DashboardData {
  total_events: number;
  active_members_count: number;
  active_committees_count: number;
  my_registrations_count: number;
  quick_links: QuickLink[];
}

const MotionLink = motion(Link);

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      text: 'Good Morning',
      icon: Sunrise,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      gradient: 'from-amber-950/80 via-slate-900 to-orange-950/80 border-amber-800/40',
      glowColor: 'bg-amber-500/15',
      subtitle: 'Start your day with productive workshops, hackathons, and campus activities.',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      text: 'Good Afternoon',
      icon: Sun,
      iconColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      gradient: 'from-sky-950/80 via-slate-900 to-indigo-950/80 border-sky-800/40',
      glowColor: 'bg-sky-500/15',
      subtitle: 'Keep up the momentum! Check out ongoing events, registrations, and live check-ins.',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      text: 'Good Evening',
      icon: Sunset,
      iconColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      gradient: 'from-rose-950/80 via-slate-900 to-purple-950/80 border-rose-800/40',
      glowColor: 'bg-rose-500/15',
      subtitle: 'Unwind with campus cultural events, alumni showcases, and evening tech sessions.',
    };
  } else {
    return {
      text: 'Good Night',
      icon: Moon,
      iconColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      gradient: 'from-indigo-950/90 via-slate-900 to-slate-950 border-indigo-800/40',
      glowColor: 'bg-indigo-500/15',
      subtitle: 'Night owl mode active! Review your HMAC certificates and prepare for tomorrow.',
    };
  }
};

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/student');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const unsubscribe = subscribe('dashboard', (event) => {
      console.log('Received dashboard realtime update:', event);
      fetchDashboardData();
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar': return <Calendar className="w-6 h-6" />;
      case 'ticket': return <Trophy className="w-6 h-6" />;
      case 'award': return <Award className="w-6 h-6" />;
      case 'users': return <Users className="w-6 h-6" />;
      default: return <Calendar className="w-6 h-6" />;
    }
  };

  const greeting = getTimeGreeting();
  const GreetingIcon = greeting.icon;
  const firstName = user?.profile?.full_name?.split(' ')[0] || 'Student';

  const getPhotoUrl = (rawUrl?: string) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const serverBase = apiBase.replace(/\/api\/?$/, '');
    return `${serverBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Time-Aware Welcome Banner with Far-Right Student Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`p-6 md:p-8 rounded-3xl bg-gradient-to-r ${greeting.gradient} border relative overflow-hidden shadow-2xl group`}
      >
        <div className={`absolute right-0 top-0 w-96 h-96 ${greeting.glowColor} rounded-full blur-3xl group-hover:scale-110 transition-all duration-700 pointer-events-none`}></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md flex items-center gap-2 ${greeting.badgeBg}`}>
                <GreetingIcon className={`w-4 h-4 ${greeting.iconColor}`} />
                {greeting.text}, {firstName}
              </span>

              {currentTime && (
                <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-300 text-xs font-mono flex items-center gap-1.5 backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  {currentTime}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
              Ready to discover campus events & achievements?
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              {greeting.subtitle}
            </p>
          </div>

          {/* Student Profile Card - Far Right inside Banner */}
          <div
            onClick={() => setIsPhotoModalOpen(true)}
            className="shrink-0 flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 hover:border-sky-500/60 backdrop-blur-md shadow-xl cursor-pointer group/avatar transition-all duration-300 hover:scale-105"
          >
            <div className="relative w-16 h-16 rounded-2xl bg-slate-800 border-2 border-sky-500/40 overflow-hidden flex items-center justify-center text-xl font-bold text-sky-400 shadow-md shrink-0">
              {user?.profile?.profile_photo_url ? (
                <img
                  src={getPhotoUrl(user.profile.profile_photo_url)}
                  alt={firstName}
                  className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500"
                />
              ) : (
                <span className="uppercase text-2xl font-black text-sky-400">
                  {firstName.charAt(0)}
                </span>
              )}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                <Maximize2 className="w-4 h-4 text-sky-400" />
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-white leading-tight group-hover/avatar:text-sky-400 transition-colors">
                {user?.profile?.full_name || 'Student User'}
              </h4>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                {user?.profile?.branch || 'CSM'} {user?.profile?.section ? `• Sec ${user.profile.section}` : ''}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Account
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enlarged Photo Modal Lightbox */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsPhotoModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4"
            >
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white pr-8">{user?.profile?.full_name || 'Student Profile'}</h3>

              <div className="w-64 h-64 md:w-72 md:h-72 mx-auto rounded-3xl overflow-hidden border-4 border-sky-500/40 shadow-2xl bg-slate-800 flex items-center justify-center">
                {user?.profile?.profile_photo_url ? (
                  <img
                    src={getPhotoUrl(user.profile.profile_photo_url)}
                    alt={user?.profile?.full_name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-7xl font-black text-sky-400 uppercase">
                    {user?.profile?.full_name?.charAt(0) || 'S'}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-sky-400">{user?.profile?.branch} {user?.profile?.section ? `• Sec ${user.profile.section}` : ''}</p>
                <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 hover:border-sky-500/50 hover:shadow-xl transition-all duration-300"
        >
          <div className="p-4 rounded-2xl bg-sky-500/10 text-sky-400">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Events</p>
            <h3 className="text-3xl font-bold text-white">{data?.total_events || 0}</h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300"
        >
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Active Members</p>
            <h3 className="text-3xl font-bold text-white">{data?.active_members_count || 0}</h3>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300"
        >
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Active Committees</p>
            <h3 className="text-3xl font-bold text-white">{data?.active_committees_count || 0}</h3>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.quick_links.map((link, idx) => (
            <MotionLink
              key={idx}
              to={link.url}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 hover:ring-2 hover:ring-sky-500/20 hover:shadow-lg hover:shadow-sky-500/10 flex flex-col gap-3 cursor-pointer transition-all duration-300"
            >
              <div className="p-2.5 rounded-xl bg-slate-800 group-hover:bg-sky-500/20 group-hover:text-sky-400 text-slate-400 w-fit transition-colors">
                {renderIcon(link.icon)}
              </div>
              <span className="font-semibold text-slate-200 group-hover:text-white">
                {link.title}
              </span>
            </MotionLink>
          ))}
        </div>
      </div>
    </div>
  );
};
