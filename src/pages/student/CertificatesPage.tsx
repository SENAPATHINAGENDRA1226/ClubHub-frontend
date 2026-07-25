import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Award, Download, FileCheck, Trophy, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ManageableGrid } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface Registration {
  id: string;
  event: {
    title: string;
  };
  achievement_position: string;
  computed_certificate_url?: string;
  verified_at?: string;
}

export const CertificatesPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin manages certificates through Event/Registrations page now.
  const canManage = false;

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/registrations/me');
      // Filter only those verified and have a certificate link or are verified (default to pattern if applicable)
      const verified = (res.data.items || []).filter((r: any) => r.status === 'verified' && r.computed_certificate_url);
      setRegistrations(verified);
    } catch (err) {
      console.error('Failed to fetch certificates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);


  const getBadgeDetails = (type: string) => {
    switch (type) {
      case 'winner':
        return { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
      case 'runner_up':
        return { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' };
      default:
        return { icon: FileCheck, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' };
    }
  };

  const handleDownload = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <ManageableGrid
        title={canManage ? "All Certificates" : "My Certificates"}
        description={canManage ? "Manage issued event certificates." : "View and download your earned event certificates."}
        icon={Award}
        iconColorClass="text-indigo-400"
        iconBgClass="bg-indigo-500/10"
        canManage={canManage}
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-64">
                <div className="flex-1 space-y-4">
                  <Skeleton variant="circular" className="w-12 h-12" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-full mt-6" />
              </div>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Certificates Yet"
            description="Participate in events and hackathons to earn your first certificate."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {registrations.map((reg) => {
                const badge = getBadgeDetails(reg.achievement_position || 'participation');
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={reg.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 hover:shadow-2xl transition-all flex flex-col group"
                  >
                    <div className="flex-1 space-y-4 pr-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${badge.bg} ${badge.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.bg} ${badge.color}`}>
                          {!reg.achievement_position || reg.achievement_position === 'none' ? 'participation' : reg.achievement_position.replace('_', ' ')}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-3 leading-tight group-hover:text-indigo-400 transition-colors">
                          {reg.event?.title || 'Unknown Event'}
                        </h3>
                      </div>
                      
                      <p className="text-xs font-mono text-slate-500">
                        Issued: {reg.verified_at ? new Date(reg.verified_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(reg.computed_certificate_url)}
                      className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> View Certificate
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ManageableGrid>

    </>
  );
};
