import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import api from '../services/api';
import { Award, Calendar, Users, Trophy, Sun, Sunrise, Sunset, Moon, Clock, Maximize2, X, BarChart3, Sparkles, Activity, ArrowUpRight, LineChart as LineChartIcon, Layers, ShieldCheck, Flame } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';

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
  monthly_activity?: any[];
  live_metrics?: {
    total_registrations: number;
    total_certificates: number;
    active_members: number;
    my_registrations: number;
  };
}

const tradeBarColors = [
  '#38bdf8', // sky
  '#818cf8', // indigo
  '#c084fc', // purple
  '#f472b6', // pink
  '#fb7185', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1">
        <p className="font-bold text-white mb-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          {label} Activity Report
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 font-mono">
            <span className="flex items-center gap-1.5 capitalize" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}:
            </span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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

  const dynamicTradeMetrics = [
    {
      label: 'Event Registrations',
      value: data?.live_metrics?.total_registrations ?? 0,
      subText: 'Live DB Records',
      change: '',
      barWidth: `${Math.min(100, (data?.live_metrics?.total_registrations ?? 0) * 5)}%`,
      color: 'from-sky-500 to-cyan-400',
      icon: Calendar,
    },
    {
      label: 'Certificates Issued',
      value: data?.live_metrics?.total_certificates ?? 0,
      subText: 'Database Records',
      change: '',
      barWidth: `${Math.min(100, (data?.live_metrics?.total_certificates ?? 0) * 5)}%`,
      color: 'from-emerald-500 to-teal-400',
      icon: ShieldCheck,
    },
    {
      label: 'Active Members',
      value: data?.live_metrics?.active_members ?? data?.active_members_count ?? 0,
      subText: 'Registered Profiles',
      change: '',
      barWidth: `${Math.min(100, (data?.live_metrics?.active_members ?? data?.active_members_count ?? 0) * 5)}%`,
      color: 'from-purple-500 to-indigo-500',
      icon: Flame,
    },
    {
      label: 'My Registrations',
      value: data?.live_metrics?.my_registrations ?? data?.my_registrations_count ?? 0,
      subText: 'Enrolled Events',
      change: '',
      barWidth: `${Math.min(100, (data?.live_metrics?.my_registrations ?? data?.my_registrations_count ?? 0) * 10)}%`,
      color: 'from-pink-500 to-rose-500',
      icon: Users,
    },
  ];

  const activeChartData = data?.monthly_activity && data.monthly_activity.length > 0
    ? data.monthly_activity
    : [];

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
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${greeting.badgeBg} shadow-sm`}>
                <GreetingIcon className={`w-4 h-4 ${greeting.iconColor}`} />
                {greeting.text}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700/60 font-mono">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {currentTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">{firstName}</span>! 👋
            </h1>

            <p className="text-slate-300 text-sm font-medium leading-relaxed">
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

      {/* Colorful Analytics & Reports Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Campus Activity Reports & Insights
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 font-medium">Real-time statistics across events, workshops, and achievements.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full w-fit">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            Live Analytics Mode
          </div>
        </div>

        {/* Live Performance Trade Bars Ticker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {dynamicTradeMetrics.map((tm, idx) => {
            const IconComponent = tm.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <IconComponent className="w-3.5 h-3.5 text-sky-400" />
                    {tm.label}
                  </span>
                  <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                    <ArrowUpRight className="w-3 h-3" />
                    {tm.change}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono">{tm.value}</span>
                  <span className="text-[10px] text-slate-500">{tm.subText}</span>
                </div>
                {/* Trade Volume Fill Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: tm.barWidth }}
                    transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                    className={`h-full bg-gradient-to-r ${tm.color} rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Area Graph: Monthly Growth Trend */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-sky-400" />
                  Activity & Certificate Growth Chart
                </h4>
                <p className="text-xs text-slate-400">Cumulative monthly event registrations vs certificates issued.</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold font-mono">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Registrations
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Certificates
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="certGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="registrations" name="registrations" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#regGradient)" />
                  <Area type="monotone" dataKey="certificates" name="certificates" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#certGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trade Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Monthly Trade Volume Bars
              </h4>
              <p className="text-xs text-slate-400">Total student check-ins per month.</p>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="checkins" name="Check-ins" radius={[6, 6, 0, 0]}>
                    {activeChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={tradeBarColors[index % tradeBarColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-medium">
              <span>Peak Month: <strong className="text-emerald-400 font-bold">Aug</strong></span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Live Sync</span>
            </div>
          </div>
        </div>
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
