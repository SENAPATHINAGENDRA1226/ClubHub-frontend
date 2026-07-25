import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Briefcase, Building2, Timer, ExternalLink, CalendarDays, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ManageableGrid, ManageableCardOverlay, DeleteConfirmModal } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface Opportunity {
  id: string;
  title: string;
  company_name: string;
  opportunity_type: 'internship' | 'job' | 'hackathon' | 'scholarship';
  description: string;
  apply_url: string;
  deadline: string | null;
}

export const OpportunitiesPage: React.FC = () => {
  const { role } = useAuth();
  const { subscribe } = useRealtime();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'internship' | 'job' | 'hackathon' | 'scholarship'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [deletingOpp, setDeletingOpp] = useState<Opportunity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    opportunity_type: 'internship',
    description: '',
    apply_url: '',
    deadline: ''
  });

  const canManage = role === 'admin' || role === 'committee';

  const fetchOpportunities = async () => {
    try {
      const typeParam = activeTab === 'all' ? '' : `?opportunity_type=${activeTab}`;
      const res = await api.get(`/opportunities${typeParam}`);
      setOpportunities(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch opportunities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOpportunities();
    const unsubscribe = subscribe('opportunities', () => fetchOpportunities());
    return () => unsubscribe();
  }, [subscribe, activeTab]);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'internship', label: 'Internships' },
    { id: 'job', label: 'Jobs' },
    { id: 'hackathon', label: 'Hackathons' },
    { id: 'scholarship', label: 'Scholarships' },
  ];

  const openAddModal = () => {
    setEditingOpp(null);
    setFormData({ title: '', company_name: '', opportunity_type: 'internship', description: '', apply_url: '', deadline: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setFormData({
      title: opp.title,
      company_name: opp.company_name,
      opportunity_type: opp.opportunity_type,
      description: opp.description,
      apply_url: opp.apply_url,
      deadline: opp.deadline ? new Date(opp.deadline).toISOString().slice(0, 16) : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      if (editingOpp) {
        await api.put(`/opportunities/${editingOpp.id}`, payload);
      } else {
        await api.post('/opportunities', payload);
      }
      setIsModalOpen(false);
      fetchOpportunities();
    } catch (err) {
      console.error('Failed to save opportunity', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOpp) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/opportunities/${deletingOpp.id}`);
      setIsDeleteModalOpen(false);
      setDeletingOpp(null);
      fetchOpportunities();
    } catch (err) {
      console.error('Failed to delete opportunity', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ManageableGrid
        title="Opportunities"
        description="Discover careers, internships, and hackathons."
        icon={Briefcase}
        iconColorClass="text-purple-400"
        iconBgClass="bg-purple-500/10"
        canManage={canManage}
        onAdd={openAddModal}
        addLabel="Add Opportunity"
        rightContent={
          <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="oppTab"
                    className="absolute inset-0 bg-purple-600 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col p-6 rounded-3xl bg-slate-900 border border-slate-800 h-64">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="space-y-2 mb-6 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No opportunities found"
            description={`Check back later for new ${activeTab !== 'all' ? activeTab + 's' : 'opportunities'}.`}
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {opportunities.map(opp => {
                const hasDeadlinePassed = opp.deadline ? new Date(opp.deadline) < new Date() : false;
                
                return (
                  <motion.div
                    key={opp.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div className="flex items-center gap-3 pr-12">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 text-purple-400 shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors leading-tight">
                            {opp.title}
                          </h3>
                          <p className="text-sm text-slate-400 font-medium">{opp.company_name}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {opp.opportunity_type}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">
                      {opp.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {opp.deadline ? (
                          <span className={`flex items-center gap-1.5 ${hasDeadlinePassed ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {hasDeadlinePassed ? <CalendarDays className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                            {hasDeadlinePassed ? 'Deadline Passed' : `Apply by ${new Date(opp.deadline).toLocaleDateString()}`}
                          </span>
                        ) : (
                          <span className="text-slate-500">No deadline</span>
                        )}
                      </div>
                      
                      <a
                        href={opp.apply_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${
                          hasDeadlinePassed 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50'
                        }`}
                      >
                        Apply Now <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    
                    <ManageableCardOverlay
                      canManage={canManage}
                      onEdit={() => openEditModal(opp)}
                      onDelete={() => {
                        setDeletingOpp(opp);
                        setIsDeleteModalOpen(true);
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </ManageableGrid>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingOpp ? 'Edit Opportunity' : 'Add Opportunity'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                  <select
                    value={formData.opportunity_type}
                    onChange={e => setFormData({ ...formData, opportunity_type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="internship">Internship</option>
                    <option value="job">Job</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="scholarship">Scholarship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deadline (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Apply URL</label>
                <input
                  type="url"
                  required
                  value={formData.apply_url}
                  onChange={e => setFormData({ ...formData, apply_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors min-h-[100px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors flex justify-center items-center"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Opportunity?"
        description={`Are you sure you want to delete "${deletingOpp?.title}"?`}
        isDeleting={isSubmitting}
      />
    </>
  );
};
