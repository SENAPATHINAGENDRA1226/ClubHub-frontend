import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Award, Download, FileCheck, Trophy, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ManageableGrid } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface CertificateItem {
  id: string;
  event_title: string;
  achievement_position: string;
  certificate_url: string;
  issued_at?: string;
}

export const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin manages certificates through Event/Registrations page now.
  const canManage = false;

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const items: CertificateItem[] = [];

      // 1. Fetch issued certificates from /certificates/me
      try {
        const certRes = await api.get('/certificates/me');
        const certs = Array.isArray(certRes.data) ? certRes.data : (certRes.data?.items || []);
        certs.forEach((c: any) => {
          items.push({
            id: c.id,
            event_title: c.event?.title || 'Campus Event Certificate',
            achievement_position: c.certificate_type || 'participation',
            certificate_url: c.file_url || `/api/certificates/${c.id}/download`,
            issued_at: c.issued_at || c.issue_date,
          });
        });
      } catch (e) {
        console.warn('/certificates/me fetch skipped', e);
      }

      // 2. Fetch verified event registrations from /registrations/me
      try {
        const regRes = await api.get('/registrations/me');
        const regs = Array.isArray(regRes.data) ? regRes.data : (regRes.data?.items || []);
        regs.filter((r: any) => r.status === 'verified').forEach((r: any) => {
          const downloadUrl = r.computed_certificate_url || `/api/certificates/verify-pdf/${r.id}`;
          if (!items.some((existing) => existing.id === r.id)) {
            items.push({
              id: r.id,
              event_title: r.event?.title || 'Verified Event Participation',
              achievement_position: r.achievement_position || 'participation',
              certificate_url: downloadUrl,
              issued_at: r.verified_at || r.registered_at,
            });
          }
        });
      } catch (e) {
        console.warn('/registrations/me fetch skipped', e);
      }

      setCertificates(items);
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
    const t = type.toLowerCase();
    if (t.includes('winner')) {
      return { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (t.includes('runner')) {
      return { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' };
    }
    return { icon: FileCheck, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' };
  };

  const handleDownload = (url?: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      const fullUrl = `${api.defaults.baseURL || ''}${url.startsWith('/') ? '' : '/'}${url}`;
      window.open(fullUrl, '_blank');
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
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Certificates Yet"
            description="Participate in events and hackathons to earn your first certificate."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {certificates.map((cert) => {
                const badge = getBadgeDetails(cert.achievement_position || 'participation');
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={cert.id}
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
                          {!cert.achievement_position || cert.achievement_position === 'none' ? 'participation' : cert.achievement_position.replace('_', ' ')}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-3 leading-tight group-hover:text-indigo-400 transition-colors">
                          {cert.event_title}
                        </h3>
                      </div>
                      
                      <p className="text-xs font-mono text-slate-500">
                        Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(cert.certificate_url)}
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
