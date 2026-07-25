import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  X,
  Loader2,
  Clock,
  Sparkles,
  Link as LinkIcon
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

interface Event {
  id: string;
  title: string;
  description: string;
  category: 'upcoming' | 'current' | 'past';
  event_date: string;
  event_year: number;
  location: string;
  banner_image_url?: string | null;
  max_participants: number;
  registration_deadline?: string | null;
  is_active: boolean;
  certificate_url_pattern?: string | null;
}

export const ManageEventsPage: React.FC = () => {
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'committee';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'upcoming',
    event_date: '',
    event_year: new Date().getFullYear(),
    location: '',
    banner_image_url: '',
    max_participants: 100,
    registration_deadline: '',
    certificate_url_pattern: 'https://your-cert-site.com/verify/{registration_number}',
    is_active: true,
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/admin?limit=200&sort_by=event_date&sort_dir=desc');
      setEvents(res.data.items || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      category: 'upcoming',
      event_date: new Date().toISOString().slice(0, 16),
      event_year: new Date().getFullYear(),
      location: '',
      banner_image_url: '',
      max_participants: 100,
      registration_deadline: new Date().toISOString().slice(0, 16),
      certificate_url_pattern: 'https://your-cert-site.com/verify/{registration_number}',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
      event_year: event.event_year || new Date().getFullYear(),
      location: event.location,
      banner_image_url: event.banner_image_url || '',
      max_participants: event.max_participants || 100,
      registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : '',
      certificate_url_pattern: event.certificate_url_pattern || '',
      is_active: event.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date || !formData.location) {
      toast.error('Please fill in required fields (Title, Date, Location)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
        banner_image_url: formData.banner_image_url || null,
        certificate_url_pattern: formData.certificate_url_pattern || null,
      };

      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, payload);
        toast.success('Event updated successfully');
      } else {
        await api.post('/events', payload);
        toast.success('Event created successfully');
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/events/${deletingId}`);
      toast.success('Event deleted');
      setDeletingId(null);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.title.toLowerCase().includes(search.toLowerCase()) || ev.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || ev.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <ManageableGrid
      title="Manage Events"
      description="Create, edit, and configure campus events, participant limits, and certificate patterns."
      icon={Calendar}
      canManage={canManage}
      onAdd={openAddModal}
      addLabel="Create Event"
      rightContent={
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {['all', 'upcoming', 'current', 'past'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedCategory === cat ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
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
              placeholder="Search events..."
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
            <Skeleton key={i} className="h-72 rounded-3xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Events Found"
          description={search ? "No events match your search parameters." : "No events have been created yet."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <ManageableCardOverlay
                canManage={canManage}
                onEdit={() => openEditModal(event)}
                onDelete={() => setDeletingId(event.id)}
              />

              {/* Event Image Banner */}
              <div className="relative h-40 bg-slate-950 overflow-hidden">
                {event.banner_image_url ? (
                  <img src={event.banner_image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-sky-500/30" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    event.category === 'upcoming' ? 'bg-sky-500/80 text-white' :
                    event.category === 'current' ? 'bg-emerald-500/80 text-white animate-pulse' :
                    'bg-slate-700/80 text-slate-300'
                  }`}>
                    {event.category}
                  </span>
                  {!event.is_active && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/80 text-white uppercase tracking-wider">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Event Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs font-medium text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{new Date(event.event_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Capacity: {event.max_participants} Participants</span>
                  </div>
                  {event.certificate_url_pattern && (
                    <div className="flex items-center gap-2 text-emerald-400 truncate">
                      <LinkIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{event.certificate_url_pattern}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-2xl w-full shadow-2xl my-8 relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Hackathon 2026"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide event details..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 custom-scrollbar"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="current">Current</option>
                      <option value="past">Past</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Location / Venue *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Main Auditorium"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Event Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Registration Deadline</label>
                    <input
                      type="datetime-local"
                      value={formData.registration_deadline}
                      onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Max Capacity</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Banner Image URL</label>
                    <input
                      type="url"
                      value={formData.banner_image_url}
                      onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Certificate Pattern Template</label>
                  <input
                    type="text"
                    value={formData.certificate_url_pattern}
                    onChange={(e) => setFormData({ ...formData, certificate_url_pattern: e.target.value })}
                    placeholder="https://your-cert-site.com/verify/{registration_number}"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Placeholder <code className="text-sky-400 font-mono">{'{registration_number}'}</code> will be auto-replaced for each student.</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-slate-300">Publish Immediately (Is Active)</label>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingEvent ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </ManageableGrid>
  );
};
