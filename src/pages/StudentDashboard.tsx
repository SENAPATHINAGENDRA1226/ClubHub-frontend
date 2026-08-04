import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import api from '../services/api';
import { Award, Calendar, Users, Trophy } from 'lucide-react';

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

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-800/40 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="px-3 py-1 rounded-full bg-sky-900/80 border border-sky-700/50 text-sky-300 text-xs font-semibold uppercase tracking-wider inline-block">
            Welcome Back, {user?.profile?.full_name?.split(' ')[0] || 'Student'}
          </span>
          <h2 className="text-3xl font-black text-white">
            Ready to explore upcoming campus hackathons & events?
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Register for events, claim HMAC verifiable certificates, and track live check-ins.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-sky-500/10 text-sky-400">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Events</p>
            <h3 className="text-3xl font-bold text-white">{data?.total_events || 0}</h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Active Members</p>
            <h3 className="text-3xl font-bold text-white">{data?.active_members_count || 0}</h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Active Committees</p>
            <h3 className="text-3xl font-bold text-white">{data?.active_committees_count || 0}</h3>
          </div>
        </div>
      </div>

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
