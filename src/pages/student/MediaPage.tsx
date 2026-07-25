import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, BookOpen, Download, X, Upload } from 'lucide-react';
import { ManageableGrid, ManageableCardOverlay, DeleteConfirmModal } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const MediaPage: React.FC = () => {
  const { role } = useAuth();
  const { subscribe } = useRealtime();
  const [activeTab, setActiveTab] = useState<'newsletter' | 'magazine'>('newsletter');
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    published_date: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canManage = role === 'admin' || role === 'committee';

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/media?type=${activeTab}`);
      setMedia(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch media', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    const unsubscribe = subscribe('medias', () => fetchMedia());
    return () => unsubscribe();
  }, [subscribe, activeTab]);

  const openAddModal = () => {
    setFormData({ title: '', published_date: new Date().toISOString().slice(0, 16) });
    setFile(null);
    setCoverImage(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('A PDF file is required.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      // 1. Upload main file
      const fileFormData = new FormData();
      fileFormData.append('file', file);
      const fileRes = await api.post('/media/upload', fileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const file_url = fileRes.data.file_url;

      // 2. Upload cover image (optional)
      let cover_image_url = null;
      if (coverImage) {
        const coverFormData = new FormData();
        coverFormData.append('file', coverImage);
        const coverRes = await api.post('/media/upload', coverFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        cover_image_url = coverRes.data.file_url;
      }

      // 3. Create record
      const payload = {
        title: formData.title,
        type: activeTab,
        file_url,
        cover_image_url,
        published_date: new Date(formData.published_date).toISOString()
      };

      await api.post('/media', payload);
      setIsModalOpen(false);
      fetchMedia();
    } catch (err) {
      console.error('Failed to save media', err);
      setErrorMsg('Failed to upload media. Ensure file sizes are within limits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedia) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/media/${deletingMedia.id}`);
      setIsDeleteModalOpen(false);
      setDeletingMedia(null);
      fetchMedia();
    } catch (err) {
      console.error('Failed to delete media', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ManageableGrid
        title="Media & Publications"
        description="Explore our latest newsletters and campus magazines."
        icon={activeTab === 'newsletter' ? Newspaper : BookOpen}
        iconColorClass="text-teal-400"
        iconBgClass="bg-teal-500/10"
        canManage={canManage}
        onAdd={openAddModal}
        addLabel={`Upload ${activeTab}`}
        rightContent={
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {(['newsletter', 'magazine'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors ${
                  activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="mediaTab"
                    className="absolute inset-0 bg-teal-600 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 capitalize">
                  {tab === 'newsletter' ? <Newspaper className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  {tab}
                </span>
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative">
                <Skeleton className="w-full h-full rounded-none" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start gap-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : media.length === 0 ? (
          <EmptyState
            icon={activeTab === 'newsletter' ? Newspaper : BookOpen}
            title={`No ${activeTab}s published yet`}
            description="Check back later for new releases."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {media.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-teal-500/50 transition-all shadow-xl"
                >
                  <div className="aspect-[3/4] bg-slate-800 relative overflow-hidden">
                    {item.cover_image_url ? (
                      <img src={import.meta.env.VITE_API_BASE_URL?.replace('/api', '') + item.cover_image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <Newspaper className="w-16 h-16 text-slate-700" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent opacity-80"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start gap-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500 text-white shadow-lg">
                        {new Date(item.published_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                    </div>
                  </div>

                  <a
                    href={import.meta.env.VITE_API_BASE_URL?.replace('/api', '') + item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <span className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors">
                      <Download className="w-5 h-5" /> Download PDF
                    </span>
                  </a>
                  
                  <ManageableCardOverlay
                    canManage={canManage}
                    onEdit={() => {}} // No edit for media, just delete and re-upload to keep it simple
                    onDelete={() => {
                      setDeletingMedia(item);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ManageableGrid>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white capitalize">
                Upload {activeTab}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Publish Date</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.published_date}
                  onChange={e => setFormData({ ...formData, published_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PDF File *</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cover Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setCoverImage(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20"
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
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Upload className="w-4 h-4" /> Upload</>}
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
        title="Delete Media?"
        description={`Are you sure you want to delete "${deletingMedia?.title}"?`}
        isDeleting={isSubmitting}
      />
    </>
  );
};
