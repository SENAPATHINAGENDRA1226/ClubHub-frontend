import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Calendar, MapPin, Clock, Users, ArrowRight, Bell, X } from 'lucide-react';
import { ManageableGrid, ManageableCardOverlay, DeleteConfirmModal } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string;
  category: 'upcoming' | 'current' | 'past';
  max_participants: number | null;
  registration_deadline: string;
  banner_image_url: string | null;
}

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { subscribe } = useRealtime();
  const canManage = role === 'admin' || role === 'committee';

  const [activeTab, setActiveTab] = useState<'upcoming' | 'current' | 'past'>('current');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // For past events
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', event_date: '', venue: '', category: 'current', max_participants: '', registration_deadline: ''
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const fetchEvents = useCallback(async (tab: string, year?: number | null) => {
    setLoading(true);
    try {
      let url = `/events?category=${tab}`;
      if (tab === 'past' && year) url += `&year=${year}`;
      const res = await api.get(url);
      setEvents(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchYears = useCallback(async () => {
    try {
      const res = await api.get('/events/years');
      setYears(res.data || []);
      if (res.data && res.data.length > 0 && !selectedYear) {
        setSelectedYear(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch years', err);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (activeTab === 'past') {
      fetchYears().then(() => {
        if (selectedYear) fetchEvents('past', selectedYear);
      });
    } else {
      fetchEvents(activeTab);
    }
  }, [activeTab, selectedYear, fetchEvents, fetchYears]);

  useEffect(() => {
    const unsubscribe = subscribe('events', () => {
      if (activeTab === 'past') {
        fetchYears().then(() => {
          if (selectedYear) fetchEvents('past', selectedYear);
        });
      } else {
        fetchEvents(activeTab);
      }
    });
    return () => unsubscribe();
  }, [subscribe, activeTab, selectedYear, fetchEvents, fetchYears]);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'current', label: 'Current' },
    { id: 'past', label: 'Past' },
  ];

  const handleRegisterClick = (eventId: string) => {
    navigate(`/profile/registrations?event_id=${eventId}`);
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({ title: '', description: '', event_date: '', venue: '', category: activeTab === 'past' ? 'current' : activeTab, max_participants: '', registration_deadline: '' });
    setBannerFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: Event) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title, description: ev.description, venue: ev.venue, category: ev.category,
      event_date: ev.event_date ? new Date(ev.event_date).toISOString().slice(0, 16) : '',
      registration_deadline: ev.registration_deadline ? new Date(ev.registration_deadline).toISOString().slice(0, 16) : '',
      max_participants: ev.max_participants ? String(ev.max_participants) : ''
    });
    setBannerFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let banner_image_url = editingEvent?.banner_image_url || null;
      if (bannerFile) {
        const fileFormData = new FormData();
        fileFormData.append('file', bannerFile);
        const fileRes = await api.post('/media/upload', fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        banner_image_url = fileRes.data.file_url;
      }

      const payload = {
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : new Date(formData.event_date).toISOString(),
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        banner_image_url
      };

      if (editingEvent) await api.put(`/events/${editingEvent.id}`, payload);
      else await api.post('/events', payload);
      
      setIsModalOpen(false);
      fetchEvents(activeTab, selectedYear);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    const targetId = deletingEvent.id;
    setIsSubmitting(true);
    try {
      await api.delete(`/events/${targetId}`);
      toast.success('Event deleted');
      setEvents((prev) => prev.filter((e) => e.id !== targetId));
      setIsDeleteModalOpen(false);
      setDeletingEvent(null);
      fetchEvents(activeTab, selectedYear);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ManageableGrid
        title="Events"
        description="Discover and register for campus events."
        icon={Calendar}
        iconColorClass="text-sky-400"
        iconBgClass="bg-sky-500/10"
        canManage={canManage}
        onAdd={openAddModal}
        addLabel="Add Event"
        rightContent={
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-sky-600 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        }
      >
        {/* Year Toggle (Only for Past) */}
        <AnimatePresence>
          {activeTab === 'past' && years.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto pb-6 custom-scrollbar"
            >
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                    selectedYear === year
                      ? 'bg-slate-800 text-white border-slate-700'
                      : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {year}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-[400px]">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="space-y-2.5 mt-4">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-800/80">
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events found"
            description={`There are no ${activeTab} events to display at the moment.`}
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="group relative flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 hover:shadow-2xl hover:shadow-black/50 transition-all"
                >
                  <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800 p-6 flex flex-col justify-end relative overflow-hidden">
                    {event.banner_image_url && (
                      <img
                        src={import.meta.env.VITE_API_BASE_URL?.replace('/api', '') + event.banner_image_url}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                    {!event.banner_image_url && (
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-24 h-24 text-white" />
                      </div>
                    )}
                    <h3 className="text-xl font-black text-white relative z-10 leading-tight group-hover:text-sky-400 transition-colors line-clamp-2 pr-16">
                      {event.title}
                    </h3>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <p className="text-sm text-slate-400 line-clamp-3">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                          <Calendar className="w-4 h-4 text-sky-500" />
                          {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                          <Clock className="w-4 h-4 text-sky-500" />
                          {new Date(event.event_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                          <MapPin className="w-4 h-4 text-sky-500" />
                          {event.venue}
                        </div>
                        {event.max_participants && (
                          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                            <Users className="w-4 h-4 text-sky-500" />
                            Capacity: {event.max_participants}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800/80">
                      {activeTab === 'current' ? (
                        <button
                          onClick={() => handleRegisterClick(event.id)}
                          className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          Register Now <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : activeTab === 'upcoming' ? (
                        <button className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                          <Bell className="w-4 h-4" /> Registration Not Open
                        </button>
                      ) : (
                        <button className="w-full py-3 rounded-xl bg-slate-950 text-slate-500 font-bold text-sm border border-slate-800 cursor-not-allowed">
                          Event Completed
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <ManageableCardOverlay
                    canManage={canManage}
                    onEdit={() => openEditModal(event)}
                    onDelete={() => { setDeletingEvent(event); setIsDeleteModalOpen(true); }}
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
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                {editingEvent ? 'Edit Event' : 'Add Event'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="current">Current</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reg Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_deadline}
                    onChange={e => setFormData({ ...formData, registration_deadline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setBannerFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Venue</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Participants (Optional)</label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={e => setFormData({ ...formData, max_participants: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm">
                  {isSubmitting ? 'Saving...' : 'Save'}
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
        title="Delete Event?"
        description={`Are you sure you want to delete "${deletingEvent?.title}"?`}
        isDeleting={isSubmitting}
      />
    </>
  );
};
