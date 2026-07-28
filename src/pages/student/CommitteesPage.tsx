import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, X, Plus } from 'lucide-react';
import { ManageableCardOverlay, DeleteConfirmModal } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface CommitteeMember {
  id: string;
  full_name: string;
  role_title: string;
  email: string;
  photo_url: string | null;
  bio: string | null;
}

interface Committee {
  id: string;
  name: string;
  description: string;
  category: 'faculty' | 'student';
  sub_category: 'CSM' | 'CSD' | 'coding' | 'sports' | 'non_technical';
  members: CommitteeMember[];
}

export const CommitteesPage: React.FC = () => {
  const { role } = useAuth();
  const { subscribe } = useRealtime();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Master Toggle
  const [masterCategory, setMasterCategory] = useState<'all' | 'faculty' | 'student'>('all');
  
  // Secondary Toggles
  const [facultySubCategory, setFacultySubCategory] = useState<'CSM' | 'CSD'>('CSM');
  const [studentSubCategory, setStudentSubCategory] = useState<'coding' | 'sports' | 'non_technical'>('coding');

  // Modal State
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);

  // Manage State
  const isSuperAdmin = role === 'admin';
  const isCommitteeAdmin = role === 'committee';
  const canManage = isSuperAdmin || isCommitteeAdmin;
  
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<'committee' | 'member'>('committee');
  const [deletingItem, setDeletingItem] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [committeeForm, setCommitteeForm] = useState({
    name: '', description: '', category: 'faculty', sub_category: 'CSM'
  });
  const [memberForm, setMemberForm] = useState({
    full_name: '', email: '', role_title: '', bio: '', photo_url: ''
  });

  const fetchCommittees = async () => {
    try {
      if (isCommitteeAdmin) {
        const res = await api.get('/committees/my-scope');
        setCommittees(res.data.items || res.data || []);
      } else {
        const res = await api.get('/committees');
        setCommittees(res.data.items || res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch committees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, [isCommitteeAdmin]);

  useEffect(() => {
    const unsubscribe = subscribe('committees', () => {
      fetchCommittees();
    });
    return () => unsubscribe();
  }, [subscribe, isCommitteeAdmin]);

  const currentSubCategory = masterCategory === 'faculty' ? facultySubCategory : studentSubCategory;

  const activeCommittees = useMemo(() => {
    if (isCommitteeAdmin || masterCategory === 'all') return committees;
    const filtered = committees.filter(c => c.category === masterCategory);
    return filtered.length > 0 ? filtered : committees;
  }, [committees, masterCategory, isCommitteeAdmin]);

  const facultyTabs = [
    { id: 'CSM', label: 'CSM' },
    { id: 'CSD', label: 'CSD' },
  ];

  const studentTabs = [
    { id: 'coding', label: 'Coding' },
    { id: 'sports', label: 'Sports' },
    { id: 'non_technical', label: 'Non-Technical' },
  ];

  // Handlers
  const handleCommitteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/committees', committeeForm);
      setIsCommitteeModalOpen(false);
      fetchCommittees();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitteeId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/committees/${selectedCommitteeId}/members`, memberForm);
      setIsMemberModalOpen(false);
      fetchCommittees();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      if (deletingType === 'committee') {
        await api.delete(`/committees/${deletingItem.id}`);
      } else {
        await api.delete(`/committees/members/${deletingItem.id}`);
      }
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      fetchCommittees();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-12 pb-12">
        {/* Header & Master Toggle */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 bg-sky-500/10 rounded-full text-sky-400 mb-2">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {isCommitteeAdmin ? 'My Committees' : 'Committees'}
            </h1>
            <p className="text-slate-400 mt-2 max-w-lg mx-auto">
              {isCommitteeAdmin ? 'Manage the members of your assigned committees.' : 'Meet the faculty and student leaders driving our campus initiatives.'}
            </p>
          </div>

          {!isCommitteeAdmin && (
            <div className="flex bg-slate-900 p-1.5 rounded-full border border-slate-800 shadow-xl">
              {(['faculty', 'student'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMasterCategory(tab)}
                  className={`relative px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-colors ${
                    masterCategory === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {masterCategory === tab && (
                    <motion.div
                      layoutId="masterTab"
                      className="absolute inset-0 bg-sky-600 rounded-full"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{tab}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Toggle */}
        {!isCommitteeAdmin && (
          <div className="flex justify-center flex-col items-center gap-6">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
              {(masterCategory === 'faculty' ? facultyTabs : studentTabs).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => masterCategory === 'faculty' ? setFacultySubCategory(tab.id as any) : setStudentSubCategory(tab.id as any)}
                  className={`relative px-6 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentSubCategory === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {currentSubCategory === tab.id && (
                    <motion.div
                      layoutId="secondaryTab"
                      className="absolute inset-0 bg-slate-700/50 rounded-xl"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setCommitteeForm({ name: '', description: '', category: masterCategory, sub_category: currentSubCategory });
                  setIsCommitteeModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-sky-900/50"
              >
                <Plus className="w-4 h-4" /> Add Committee to this Section
              </button>
            )}
          </div>
        )}

        {/* Committees Content */}
        {loading ? (
          <div className="space-y-16">
            {[1, 2].map(i => (
              <div key={i} className="bg-slate-900/20 p-8 rounded-3xl border border-slate-800/50 space-y-8">
                <div className="text-center flex flex-col items-center">
                  <Skeleton className="h-8 w-64 mb-4" />
                  <Skeleton className="h-4 w-96 mb-2" />
                  <Skeleton className="h-4 w-80" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center">
                      <Skeleton variant="circular" className="w-24 h-24 mb-4" />
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeCommittees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Committees Found"
            description="There are currently no committees matching this category."
          />
        ) : (
          <div className="space-y-16">
            {activeCommittees.map(committee => (
              <div key={committee.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 bg-slate-900/20 p-8 rounded-3xl border border-slate-800/50 relative group/committee">
                
                {isSuperAdmin && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover/committee:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setDeletingType('committee');
                        setDeletingItem(committee);
                        setIsDeleteModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors"
                    >
                      Delete Committee
                    </button>
                  </div>
                )}

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">{committee.name}</h2>
                  {committee.description && <p className="text-slate-400 mt-2 max-w-2xl mx-auto">{committee.description}</p>}
                  
                  {canManage && (
                    <button
                      onClick={() => {
                        setSelectedCommitteeId(committee.id);
                        setMemberForm({ full_name: '', email: '', role_title: '', bio: '', photo_url: '' });
                        setIsMemberModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-sm font-bold transition-colors border border-slate-700"
                    >
                      <Plus className="w-4 h-4" /> Add Member
                    </button>
                  )}
                </div>

                {committee.members.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm italic">No members added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {committee.members.map(member => (
                      <div
                        key={member.id}
                        onClick={() => !canManage && setSelectedMember(member)}
                        className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-900/20 transition-all cursor-pointer"
                      >
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-slate-800 group-hover:border-sky-500/30 transition-colors">
                          {member.photo_url ? (
                            <img src={import.meta.env.VITE_API_BASE_URL?.replace('/api', '') + member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 uppercase">
                              {member.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">{member.full_name}</h3>
                        <p className="text-sm font-semibold text-sky-500 mt-1">{member.role_title}</p>
                        
                        <ManageableCardOverlay
                          canManage={canManage}
                          onEdit={() => {}}
                          onDelete={() => {
                            setDeletingType('member');
                            setDeletingItem(member);
                            setIsDeleteModalOpen(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Member Bio Modal */}
        <AnimatePresence>
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setSelectedMember(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-sky-900/50 to-indigo-900/50"></div>
                
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative pt-12 text-center space-y-4">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-slate-900 shadow-xl bg-slate-800">
                    {selectedMember.photo_url ? (
                      <img src={import.meta.env.VITE_API_BASE_URL?.replace('/api', '') + selectedMember.photo_url} alt={selectedMember.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400 uppercase">
                        {selectedMember.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-white">{selectedMember.full_name}</h3>
                    <p className="text-sky-400 font-bold mt-1">{selectedMember.role_title}</p>
                  </div>

                  <a href={`mailto:${selectedMember.email}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-semibold">
                    <Mail className="w-4 h-4" /> {selectedMember.email}
                  </a>

                  {selectedMember.bio && (
                    <div className="pt-6 mt-6 border-t border-slate-800/80">
                      <p className="text-slate-400 text-sm leading-relaxed text-left">
                        {selectedMember.bio}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Committee Modal */}
      {isCommitteeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create Committee</h2>
              <button onClick={() => setIsCommitteeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCommitteeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={committeeForm.name}
                  onChange={e => setCommitteeForm({ ...committeeForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  value={committeeForm.description}
                  onChange={e => setCommitteeForm({ ...committeeForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors min-h-[100px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCommitteeModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm">
                  {isSubmitting ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add Member</h2>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={memberForm.full_name}
                  onChange={e => setMemberForm({ ...memberForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={memberForm.email}
                  onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role Title</label>
                <input
                  type="text"
                  required
                  value={memberForm.role_title}
                  onChange={e => setMemberForm({ ...memberForm, role_title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={memberForm.photo_url}
                  onChange={e => setMemberForm({ ...memberForm, photo_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bio (Optional)</label>
                <textarea
                  value={memberForm.bio}
                  onChange={e => setMemberForm({ ...memberForm, bio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors min-h-[80px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm">
                  {isSubmitting ? 'Saving...' : 'Add'}
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
        title={`Delete ${deletingType === 'committee' ? 'Committee' : 'Member'}?`}
        description={`Are you sure you want to delete this ${deletingType}?`}
        isDeleting={isSubmitting}
      />
    </>
  );
};
