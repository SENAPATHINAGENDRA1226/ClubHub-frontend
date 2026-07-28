import React, { useEffect, useState } from 'react';
import { Trophy, Plus, Trash2, Edit2, Calendar, Search, Filter, Loader2, Award } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { DeleteConfirmModal } from '../../components/ManageableGrid';

interface Achievement {
  id: string;
  student_id: string;
  event_id?: string;
  title: string;
  description: string;
  position: 'winner' | 'runner_up' | 'special_mention';
  year: number;
  created_at: string;
}

export const ManageAchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position: 'winner' as 'winner' | 'runner_up' | 'special_mention',
    year: new Date().getFullYear(),
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/achievements?limit=100');
      setAchievements(res.data.items || []);
    } catch (err) {
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const openAddModal = () => {
    setEditingAchievement(null);
    setFormData({
      title: '',
      description: '',
      position: 'winner',
      year: new Date().getFullYear(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ach: Achievement) => {
    setEditingAchievement(ach);
    setFormData({
      title: ach.title,
      description: ach.description,
      position: ach.position,
      year: ach.year,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAchievement) {
        await api.put(`/achievements/${editingAchievement.id}`, formData);
        toast.success('Achievement updated');
      } else {
        await api.post('/achievements', formData);
        toast.success('Achievement created');
      }

      setIsModalOpen(false);
      fetchAchievements();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save achievement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/achievements/${deletingId}`);
      toast.success('Achievement deleted');
      setDeletingId(null);
      fetchAchievements();
    } catch (err) {
      toast.error('Failed to delete achievement');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = positionFilter === 'all' || a.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">Manage Achievements</h1>
            <p className="text-slate-400 font-medium">Record awards, competition wins, and student recognitions.</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Achievement
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {['all', 'winner', 'runner_up', 'special_mention'].map((p) => (
            <button
              key={p}
              onClick={() => setPositionFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                positionFilter === p ? 'bg-amber-600 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Achievement Title</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Position</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Year</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-10 w-64" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No achievements found.</p>
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((ach) => (
                  <tr key={ach.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-amber-400 transition-colors">{ach.title}</div>
                          <div className="text-xs text-slate-400 line-clamp-1">{ach.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        ach.position === 'winner'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : ach.position === 'runner_up'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {ach.position.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-bold text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {ach.year}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(ach)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(ach.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-white mb-6">
              {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 1st Place - National Hackathon 2026"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="winner">Winner</option>
                    <option value="runner_up">Runner Up</option>
                    <option value="special_mention">Special Mention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of the achievement..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
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
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm transition-colors flex items-center gap-2 shadow-lg shadow-amber-600/30"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAchievement ? 'Update' : 'Save Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Achievement"
        description="Are you sure you want to remove this achievement record?"
        isDeleting={isDeleting}
      />
    </div>
  );
};
