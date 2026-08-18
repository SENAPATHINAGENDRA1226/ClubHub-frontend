import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Loader2,
  UserPlus,
  Layers,
  Trash2,
  Users
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  ManageableGrid,
  ManageableCardOverlay,
  DeleteConfirmModal
} from '../../components/ManageableGrid';

interface CommitteeMember {
  id: string;
  full_name: string;
  role_title: string;
  is_lead: boolean;
  avatar_url?: string | null;
}

interface Committee {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'faculty' | 'student';
  sub_category?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  members?: CommitteeMember[];
}

export const ManageCommitteesPage: React.FC = () => {
  const { role } = useAuth();
  const canManage = role === 'admin';

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Committee Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'student' as 'faculty' | 'student',
    sub_category: 'coding',
    logo_url: '',
    banner_url: '',
  });

  // Member Modal State
  const [selectedCommitteeForMember, setSelectedCommitteeForMember] = useState<Committee | null>(null);
  const [memberFormData, setMemberFormData] = useState({
    full_name: '',
    email: '',
    role_title: 'Committee Member',
    is_lead: false,
    avatar_url: '',
  });
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/committees');
      setCommittees(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch committees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, []);

  const openAddModal = () => {
    setEditingCommittee(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'student',
      sub_category: 'coding',
      logo_url: '',
      banner_url: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (comm: Committee) => {
    setEditingCommittee(comm);
    setFormData({
      name: comm.name,
      code: comm.code,
      description: comm.description,
      category: comm.category,
      sub_category: comm.sub_category || 'coding',
      logo_url: comm.logo_url || '',
      banner_url: comm.banner_url || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Name and Code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        logo_url: formData.logo_url || null,
        banner_url: formData.banner_url || null,
        sub_category: formData.sub_category || null,
      };

      if (editingCommittee) {
        await api.put(`/committees/${editingCommittee.id}`, payload);
        toast.success('Committee updated');
      } else {
        await api.post('/committees', payload);
        toast.success('Committee created');
      }

      setIsModalOpen(false);
      fetchCommittees();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save committee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitteeForMember || !memberFormData.full_name) return;

    setIsSubmittingMember(true);
    try {
      const res = await api.post(`/committees/${selectedCommitteeForMember.id}/members`, {
        full_name: memberFormData.full_name,
        email: memberFormData.email || '',
        role_title: memberFormData.role_title,
        photo_url: memberFormData.avatar_url || null,
        order_index: memberFormData.is_lead ? 0 : 10,
      });
      toast.success('Member added to committee');
      
      const newMember = res.data;
      if (selectedCommitteeForMember) {
        const updated = [...(selectedCommitteeForMember.members || []), newMember];
        setSelectedCommitteeForMember({ ...selectedCommitteeForMember, members: updated });
      }
      setMemberFormData({ full_name: '', email: '', role_title: 'Committee Member', is_lead: false, avatar_url: '' });
      fetchCommittees();
    } catch (err: any) {
      console.error('Failed to add committee member:', err);
      toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || 'Failed to add committee member');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await api.delete(`/committee-members/${memberId}`);
      toast.success('Member removed from committee');
      if (selectedCommitteeForMember) {
        const updated = selectedCommitteeForMember.members?.filter((m) => m.id !== memberId) || [];
        setSelectedCommitteeForMember({ ...selectedCommitteeForMember, members: updated });
      }
      fetchCommittees();
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      toast.error(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const targetId = deletingId;
    setIsDeleting(true);
    try {
      await api.delete(`/committees/${targetId}`);
      toast.success('Committee deleted');
      setCommittees((prev) => prev.filter((c) => c.id !== targetId));
      setDeletingId(null);
      fetchCommittees();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete committee');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCommittees = committees.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <ManageableGrid
      title="Manage Committees"
      description="Organize student and faculty clubs, committee leads, and technical/non-technical chapters."
      icon={Layers}
      canManage={canManage}
      onAdd={openAddModal}
      addLabel="Create Committee"
      rightContent={
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {['all', 'student', 'faculty'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  categoryFilter === cat ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search committees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500 w-48 sm:w-64"
            />
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : filteredCommittees.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Committees Found"
          description={search ? "No committees match your search." : "No campus committees registered."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommittees.map((comm) => (
            <motion.div
              key={comm.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <ManageableCardOverlay
                canManage={canManage}
                onEdit={() => openEditModal(comm)}
                onDelete={() => setDeletingId(comm.id)}
              />

              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400 font-black text-xl overflow-hidden shrink-0 shadow-inner">
                    {comm.logo_url ? (
                      <img src={comm.logo_url} alt={comm.name} className="w-full h-full object-cover" />
                    ) : (
                      comm.code
                    )}
                  </div>
                  <div className="pr-10">
                    <h3 className="font-extrabold text-white text-lg leading-tight line-clamp-1 group-hover:text-sky-400 transition-colors">
                      {comm.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">{comm.code}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-xs font-medium text-slate-400 capitalize">{comm.category}</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
                  {comm.description || 'No description available for this committee.'}
                </p>

                {/* Member Preview & View Users Action */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Members ({comm.members?.length || 0})</span>
                    <button
                      onClick={() => {
                        setSelectedCommitteeForMember(comm);
                        setMemberFormData({ full_name: '', email: '', role_title: 'Committee Member', is_lead: false, avatar_url: '' });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-600/10 border border-sky-500/20 text-sky-400 hover:bg-sky-600 hover:text-white transition-all flex items-center gap-1.5 text-[11px] font-bold"
                    >
                      <Users className="w-3.5 h-3.5" /> View / Manage Users
                    </button>
                  </div>

                  {comm.members && comm.members.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {comm.members.slice(0, 4).map((m) => (
                        <span key={m.id} className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                          {m.full_name} {m.is_lead && '⭐'}
                        </span>
                      ))}
                      {comm.members.length > 4 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400">
                          +{comm.members.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Committee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl my-8 relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">
                  {editingCommittee ? 'Edit Committee' : 'Create Committee'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Committee Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Coding Club"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. CODE"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Committee description..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 custom-scrollbar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-sky-600/30 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCommittee ? 'Save Changes' : 'Create Committee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {selectedCommitteeForMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedCommitteeForMember(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl my-8 relative max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white">Committee Users & Members</h2>
                  <p className="text-xs text-sky-400 font-bold mt-0.5">{selectedCommitteeForMember.name} ({selectedCommitteeForMember.code})</p>
                </div>
                <button onClick={() => setSelectedCommitteeForMember(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-6 pr-1 custom-scrollbar flex-1">
                {/* Existing Members List with Delete option */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Assigned Users ({selectedCommitteeForMember.members?.length || 0})
                  </h3>

                  {!selectedCommitteeForMember.members || selectedCommitteeForMember.members.length === 0 ? (
                    <div className="p-4 text-center rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-500 text-xs font-medium">
                      No members or users assigned to this committee yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCommitteeForMember.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                              {m.full_name ? m.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                {m.full_name} {m.is_lead && <span title="Lead">⭐</span>}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium">{m.role_title}</div>
                            </div>
                          </div>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(m.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Remove member from committee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Member Section */}
                {canManage && (
                  <div className="pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-sky-400" /> Add New Member
                    </h3>

                    <form onSubmit={handleAddMember} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={memberFormData.full_name}
                          onChange={(e) => setMemberFormData({ ...memberFormData, full_name: e.target.value })}
                          placeholder="e.g. Alex Johnson"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email (Optional)</label>
                          <input
                            type="email"
                            value={memberFormData.email}
                            onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                            placeholder="alex@example.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Role Title *</label>
                          <input
                            type="text"
                            required
                            value={memberFormData.role_title}
                            onChange={(e) => setMemberFormData({ ...memberFormData, role_title: e.target.value })}
                            placeholder="e.g. Secretary"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="is_lead"
                          checked={memberFormData.is_lead}
                          onChange={(e) => setMemberFormData({ ...memberFormData, is_lead: e.target.checked })}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor="is_lead" className="text-xs font-medium text-slate-300">Designate as Lead Member (⭐)</label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingMember}
                        className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                      >
                        {isSubmittingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign to Committee'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Committee"
        description="Are you sure you want to delete this committee? All assigned member records will be removed."
        isDeleting={isDeleting}
      />
    </ManageableGrid>
  );
};
