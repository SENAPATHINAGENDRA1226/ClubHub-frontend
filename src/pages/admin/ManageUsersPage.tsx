import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  X,
  Loader2,
  UserCheck,
  UserX,
  Layers
} from 'lucide-react';

import api from '../../services/api';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  ManageableGrid,
  ManageableCardOverlay,
  DeleteConfirmModal
} from '../../components/ManageableGrid';

interface UserRecord {
  id: string;
  email: string;
  role: 'student' | 'admin' | 'committee';
  is_active: boolean;
  committee_ids?: string[];
  profile?: {
    full_name?: string;
    branch?: string;
    section?: string;
    phone_number?: string;
    academic_year?: string;
    designation?: string;
    profile_photo_url?: string;
  } | null;
  created_at: string;
}

interface Committee {
  id: string;
  name: string;
  category: string;
  sub_category: string;
}

export const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' as 'student' | 'admin' | 'committee',
    full_name: '',
    designation: '',
    is_active: true,
    committee_ids: [] as string[],
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?limit=200');
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setUsers(items);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommittees = async () => {
    try {
      const res = await api.get('/committees');
      setCommittees(res.data || []);
    } catch (err) {
      console.error('Failed to fetch committees:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCommittees();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      role: 'student',
      full_name: '',
      designation: '',
      is_active: true,
      committee_ids: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      full_name: user.profile?.full_name || '',
      designation: user.profile?.designation || '',
      is_active: user.is_active,
      committee_ids: user.committee_ids || [],
    });
    setIsModalOpen(true);
  };

  const handleCommitteeCheckbox = (id: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.committee_ids;
      if (checked) {
        return { ...prev, committee_ids: [...current, id] };
      } else {
        return { ...prev, committee_ids: current.filter((x) => x !== id) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        email: formData.email,
        role: formData.role,
        full_name: formData.full_name,
        is_active: formData.is_active,
      };

      if (formData.role === 'committee') {
        payload.committee_ids = formData.committee_ids;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new accounts');
          setIsSubmitting(false);
          return;
        }
        payload.password = formData.password;
        payload.designation = formData.designation;
        await api.post('/users', payload);
        toast.success('User created successfully');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: UserRecord) => {
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to change user status');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const targetUser = users.find((u) => u.id === deletingId);
    if (targetUser?.role === 'admin') {
      toast.error('Admin accounts cannot be deleted');
      setDeletingId(null);
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/users/${deletingId}`);
      toast.success('User deleted');
      setDeletingId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.profile?.full_name && u.profile.full_name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <ManageableGrid
      title="Manage Users"
      description="View, manage system accounts, change roles, and modify access permissions."
      icon={Users}
      canManage={true}
      onAdd={openAddModal}
      addLabel="Add New User"
      rightContent={
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {['all', 'student', 'admin', 'committee'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  roleFilter === r ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by email or name..."
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
            <Skeleton key={i} className="h-44 rounded-3xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Users Found"
          description={search ? "No user accounts match your search query." : "No registered accounts."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <ManageableCardOverlay
                canManage={true}
                onEdit={() => openEditModal(u)}
                onDelete={u.role === 'admin' ? undefined : () => setDeletingId(u.id)}
              />

              <div>
                <div className="flex items-start justify-between gap-3 mb-4 pr-12">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-sky-900/30">
                      {u.profile?.full_name ? u.profile.full_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                        {u.profile?.full_name || 'Unnamed User'}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium line-clamp-1">{u.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    u.role === 'committee' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                    'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {u.role}
                  </span>

                  {u.profile?.branch && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                      {u.profile.branch} {u.profile.academic_year && `• ${u.profile.academic_year}`}
                    </span>
                  )}
                </div>

                {/* Assigned Committees List */}
                {u.role === 'committee' && u.committee_ids && u.committee_ids.length > 0 && (
                  <div className="mb-4 bg-slate-950/50 rounded-2xl p-3 border border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-500" />
                      Assigned Committees
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {u.committee_ids.map((cid) => {
                        const comm = committees.find((c) => c.id === cid);
                        return (
                          <span
                            key={cid}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-sky-950/80 border border-sky-900/60 text-sky-300"
                          >
                            {comm ? comm.name : 'Unknown Committee'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => toggleUserStatus(u)}
                  className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    u.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                  }`}
                >
                  {u.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  {u.is_active ? 'Active' : 'Disabled'}
                </button>

                <span className="text-[11px] text-slate-500 font-mono">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
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
                  {editingUser ? 'Edit User' : 'Create User Account'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@csmd-dlides-club.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="student">Student</option>
                    <option value="committee">Committee</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                {/* Committee selection list for committee role */}
                {formData.role === 'committee' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Assign Committee Workspaces
                    </label>
                    <div className="max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
                      {committees.length === 0 ? (
                        <p className="text-xs text-slate-500">No committees found.</p>
                      ) : (
                        committees.map((c) => (
                          <div key={c.id} className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              id={`modal_comm_${c.id}`}
                              checked={formData.committee_ids.includes(c.id)}
                              onChange={(e) => handleCommitteeCheckbox(c.id, e.target.checked)}
                              className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500"
                            />
                            <label
                              htmlFor={`modal_comm_${c.id}`}
                              className="text-xs font-semibold text-slate-300 select-none cursor-pointer"
                            >
                              {c.name} <span className="text-[10px] text-slate-500">({c.sub_category})</span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="user_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="user_active" className="text-sm font-semibold text-slate-300">Account Enabled (Active)</label>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete User Account"
        description="Are you sure you want to permanently delete this user account? All associated data will be removed."
        isDeleting={isDeleting}
      />
    </ManageableGrid>
  );
};
