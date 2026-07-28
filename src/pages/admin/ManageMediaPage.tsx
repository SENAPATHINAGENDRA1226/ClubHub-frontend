import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, ExternalLink, Calendar, Search, Filter, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { DeleteConfirmModal } from '../../components/ManageableGrid';

interface MediaItem {
  id: string;
  title: string;
  type: 'newsletter' | 'magazine';
  file_url: string;
  cover_image_url?: string;
  published_date: string;
  created_at: string;
}

export const ManageMediaPage: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'newsletter' as 'newsletter' | 'magazine',
    file_url: '',
    cover_image_url: '',
    published_date: new Date().toISOString().split('T')[0],
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await api.get('/media?limit=100');
      setItems(res.data.items || []);
    } catch (err) {
      toast.error('Failed to load media items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.file_url) {
      toast.error('Title and File URL are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/media', {
        title: formData.title,
        type: formData.type,
        file_url: formData.file_url,
        cover_image_url: formData.cover_image_url || null,
        published_date: formData.published_date,
      });
      toast.success('Media item added successfully');
      setIsModalOpen(false);
      setFormData({
        title: '',
        type: 'newsletter',
        file_url: '',
        cover_image_url: '',
        published_date: new Date().toISOString().split('T')[0],
      });
      fetchMedia();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add media item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/media/${deletingId}`);
      toast.success('Media item deleted');
      setDeletingId(null);
      fetchMedia();
    } catch (err) {
      toast.error('Failed to delete media item');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">Manage Media & Publications</h1>
            <p className="text-slate-400 font-medium">Publish news, magazines, and campus media releases.</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-900/30 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Media Release
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search publications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {['all', 'newsletter', 'magazine'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                typeFilter === t ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
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
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Publication</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Published Date</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-10 w-64" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-28" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No media items found.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.cover_image_url ? (
                            <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-sky-400 transition-colors">{item.title}</div>
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            View File <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        item.type === 'magazine'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(item.published_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-white mb-6">Add New Publication</h2>

            <form onSubmit={handleCreateMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Annual Campus Magazine 2026"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="newsletter">Newsletter</option>
                    <option value="magazine">Magazine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Published Date</label>
                  <input
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Document / PDF File URL *</label>
                <input
                  type="url"
                  required
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
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
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-sky-600/30"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Media'}
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
        title="Delete Publication"
        description="Are you sure you want to remove this publication?"
        isDeleting={isDeleting}
      />
    </div>
  );
};
