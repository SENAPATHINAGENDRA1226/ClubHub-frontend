import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  GraduationCap,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface TimeSeriesPoint {
  month: string;
  value: number;
}

interface BarChartPoint {
  label: string;
  value: number;
}

interface AdminDashboardData {
  total_events: number;
  total_members: number;
  total_alumni: number;
  upcoming_events_count: number;
  registrations_over_time: TimeSeriesPoint[];
  most_popular_events: BarChartPoint[];
}

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { user } = useAuth();
  const adminName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Administrator';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto p-2">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 bg-slate-800" />
          <Skeleton className="h-4 w-96 bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-3xl bg-slate-900 border border-slate-800" />
          <Skeleton className="h-80 rounded-3xl bg-slate-900 border border-slate-800" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Events',
      value: data?.total_events ?? 0,
      icon: Calendar,
      gradient: 'from-sky-500/20 via-sky-500/5 to-transparent',
      borderColor: 'border-sky-500/30',
      iconBg: 'bg-sky-500/10 text-sky-400',
      badgeText: 'All time',
    },
    {
      title: 'Student Members',
      value: data?.total_members ?? 0,
      icon: Users,
      gradient: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
      borderColor: 'border-indigo-500/30',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      badgeText: 'Active',
    },
    {
      title: 'Alumni Registered',
      value: data?.total_alumni ?? 0,
      icon: GraduationCap,
      gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
      borderColor: 'border-purple-500/30',
      iconBg: 'bg-purple-500/10 text-purple-400',
      badgeText: 'Network',
    },
    {
      title: 'Upcoming Events',
      value: data?.upcoming_events_count ?? 0,
      icon: Clock,
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      badgeText: 'Scheduled',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/60 p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Platform Analytics Overview
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Control Center</h1>
            <p className="text-slate-400 text-sm mt-1">Realtime participation, event metrics, and campus growth trends.</p>
          </div>

          {/* Admin User Profile Card */}
          <div className="shrink-0 flex items-center gap-3.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-black text-white leading-tight">{adminName}</h4>
              <p className="text-xs text-sky-400 font-semibold capitalize mt-0.5">{user?.role || 'Admin'} Access</p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Account
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className={`relative overflow-hidden rounded-2xl bg-slate-900 border ${card.borderColor} p-6 shadow-xl hover:border-slate-700 transition-all group`}
          >
            <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${card.gradient} pointer-events-none`} />
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                {card.badgeText}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-black text-white tracking-tight">{card.value.toLocaleString()}</h3>
              <p className="text-sm font-semibold text-slate-400 mt-1">{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Registration Trends</h3>
                <p className="text-xs text-slate-400">Monthly student event sign-ups</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {data?.registrations_over_time && data.registrations_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.registrations_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                  <XAxis dataKey="month" stroke={theme === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: theme === 'light' ? '#475569' : '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke={theme === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: theme === 'light' ? '#475569' : '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={theme === 'light' 
                      ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 8px 30px -4px rgba(0,0,0,0.08)' }
                      : { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }
                    }
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#regGrad)" name="Registrations" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No registration history available yet.
              </div>
            )}
          </div>
        </motion.div>

        {/* Most Popular Events Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Top Events by Turnout</h3>
                <p className="text-xs text-slate-400">Most registered campus activities</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {data?.most_popular_events && data.most_popular_events.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.most_popular_events} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                  <XAxis type="number" stroke={theme === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: theme === 'light' ? '#475569' : '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" stroke={theme === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: theme === 'light' ? '#475569' : '#94a3b8', fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={theme === 'light'
                      ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 8px 30px -4px rgba(0,0,0,0.08)' }
                      : { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }
                    }
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} name="Registrations" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No event turnout data available.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Action Banner */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Event Door Verification System</h4>
            <p className="text-xs text-slate-400">Scan student QR tickets or conduct manual attendance searches at event entrances.</p>
          </div>
        </div>
        <a
          href="/admin/verify"
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-sky-600/30"
        >
          Open QR Scanner <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};