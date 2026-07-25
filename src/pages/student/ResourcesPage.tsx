import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { BookOpen, ExternalLink, Library, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ManageableGrid, ManageableCardOverlay, DeleteConfirmModal } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_url: string;
  category: string;
}

export const ResourcesPage: React.FC = () => {
  const { role } = useAuth();
  const { subscribe } = useRealtime();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_url: '',
    category: ''
  });

  const canManage = role === 'admin' || role === 'committee';

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    const unsubscribe = subscribe('resources', () => fetchResources());
    return () => unsubscribe();
  }, [subscribe]);

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category).filter(Boolean));
    return ['All', ...Array.from(cats)].sort();
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (activeCategory === 'All') return resources;
    return resources.filter(r => r.category === activeCategory);
  }, [resources, activeCategory]);

  const openAddModal = () => {
    setEditingResource(null);
    setFormData({ title: '', description: '', resource_url: '', category: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      resource_url: resource.resource_url,
      category: resource.category
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingResource) {
        await api.put(`/resources/${editingResource.id}`, formData);
      } else {
        await api.post('/resources', formData);
      }
      setIsModalOpen(false);
      fetchResources();
    } catch (err) {
      console.error('Failed to save resource', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResource) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/resources/${deletingResource.id}`);
      setIsDeleteModalOpen(false);
      setDeletingResource(null);
      fetchResources();
    } catch (err) {
      console.error('Failed to delete resource', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ManageableGrid
        title="Study Resources"
        description="Curated links and guides added by committees."
        icon={Library}
        iconColorClass="text-emerald-400"
        iconBgClass="bg-emerald-500/10"
        canManage={canManage}
        onAdd={openAddModal}
        addLabel="Add Resource"
        rightContent={
          !loading && categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )
        }
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col p-6 rounded-3xl bg-slate-900 border border-slate-800 h-48">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </div>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No resources available"
            description="Check back later for new study materials."
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredResources.map(resource => (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative"
                >
                  <a
                    href={resource.resource_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all cursor-pointer h-full"
                  >
                    <div className="flex justify-between items-start mb-4 pr-16">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {resource.category}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 pr-8">
                      {resource.title}
                    </h3>
                    
                    <p className="text-sm text-slate-400 line-clamp-3">
                      {resource.description}
                    </p>
                  </a>
                  
                  <ManageableCardOverlay
                    canManage={canManage}
                    onEdit={() => openEditModal(resource)}
                    onDelete={() => {
                      setDeletingResource(resource);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                </motion.div>
              ))}
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
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingResource ? 'Edit Resource' : 'Add Resource'}
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL</label>
                <input
                  type="url"
                  required
                  value={formData.resource_url}
                  onChange={e => setFormData({ ...formData, resource_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="e.g. Web Dev, DSA"
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
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex justify-center items-center"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Resource'}
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
        title="Delete Resource?"
        description={`Are you sure you want to delete "${deletingResource?.title}"?`}
        isDeleting={isSubmitting}
      />
    </>
  );
};
