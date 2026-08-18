import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { motion } from 'framer-motion';
import { Trophy, GraduationCap, Linkedin, Award, Star, X } from 'lucide-react';
import { ManageableGrid, ManageableCardOverlay, DeleteConfirmModal } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getMediaUrl } from '../../utils/media';

const DEFAULT_ALUMNI_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
];

const getAlumniPhotoUrl = (al: any, index: number) => {
  if (al.photo_url) {
    return getMediaUrl(al.photo_url);
  }
  return DEFAULT_ALUMNI_PHOTOS[index % DEFAULT_ALUMNI_PHOTOS.length];
};

export const AlumniAchievementsPage: React.FC = () => {
  const location = useLocation();
  const { role } = useAuth();
  const { subscribe } = useRealtime();
  const [activeTab, setActiveTab] = useState<'achievements' | 'alumni'>(
    location.pathname.includes('alumni') ? 'alumni' : 'achievements'
  );

  useEffect(() => {
    if (location.pathname.includes('alumni')) {
      setActiveTab('alumni');
    } else if (location.pathname.includes('achievements')) {
      setActiveTab('achievements');
    }
  }, [location.pathname]);
  
  const [achievements, setAchievements] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isAlumniModalOpen, setIsAlumniModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Form States
  const [achForm, setAchForm] = useState({
    title: '', description: '', position: 'winner', year: new Date().getFullYear(),
    event_id: '', student_id: ''
  });
  
  const [aluForm, setAluForm] = useState({
    full_name: '', graduation_year: new Date().getFullYear(), branch: '',
    current_company: '', current_role: '', testimonial: '', linkedin_url: ''
  });

  const canManage = role === 'admin' || role === 'committee';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'achievements') {
        const res = await api.get('/achievements');
        setAchievements(res.data.items || []);
      } else {
        const res = await api.get('/alumni');
        setAlumni(res.data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribeAch = subscribe('achievements', () => fetchData());
    const unsubscribeAlu = subscribe('alumnis', () => fetchData());
    return () => {
      unsubscribeAch();
      unsubscribeAlu();
    };
  }, [subscribe, activeTab]);

  const groupedAchievements = useMemo(() => {
    const groups: { [key: number]: any[] } = {};
    achievements.forEach(ach => {
      if (!groups[ach.year]) groups[ach.year] = [];
      groups[ach.year].push(ach);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [achievements]);

  // Achievement Handlers
  const openAchModal = async (ach: any = null) => {
    if (ach) {
      setEditingItem(ach);
      setAchForm({
        title: ach.title, description: ach.description, position: ach.position, year: ach.year,
        event_id: ach.event_id || '', student_id: ach.student_id || ''
      });
    } else {
      setEditingItem(null);
      setAchForm({ title: '', description: '', position: 'winner', year: new Date().getFullYear(), event_id: '', student_id: '' });
    }
    setIsAchievementModalOpen(true);
    
    // Fetch events and students if empty
    if (eventsList.length === 0 || studentsList.length === 0) {
      try {
        const [evts, stus] = await Promise.all([
          api.get('/events'),
          api.get('/users?role=student')
        ]);
        setEventsList(evts.data.items || []);
        setStudentsList(stus.data.items || []);
      } catch (e) {
        console.error('Failed to fetch events/students', e);
      }
    }
  };

  const submitAch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...achForm,
        event_id: achForm.event_id || null,
        student_id: achForm.student_id || null
      };
      if (editingItem) await api.put(`/achievements/${editingItem.id}`, payload);
      else await api.post('/achievements', payload);
      setIsAchievementModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alumni Handlers
  const openAluModal = (al: any = null) => {
    if (al) {
      setEditingItem(al);
      setAluForm({
        full_name: al.full_name, graduation_year: al.graduation_year, branch: al.branch,
        current_company: al.current_company || '', current_role: al.current_role || '',
        testimonial: al.testimonial || '', linkedin_url: al.linkedin_url || ''
      });
    } else {
      setEditingItem(null);
      setAluForm({
        full_name: '', graduation_year: new Date().getFullYear(), branch: '',
        current_company: '', current_role: '', testimonial: '', linkedin_url: ''
      });
    }
    setIsAlumniModalOpen(true);
  };

  const submitAlu = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...aluForm,
        current_company: aluForm.current_company || null,
        current_role: aluForm.current_role || null,
        testimonial: aluForm.testimonial || null,
        linkedin_url: aluForm.linkedin_url || null
      };
      if (editingItem) await api.put(`/alumni/${editingItem.id}`, payload);
      else await api.post('/alumni', payload);
      setIsAlumniModalOpen(false);
      fetchData();
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
      if (activeTab === 'achievements') {
        await api.delete(`/achievements/${deletingItem.id}`);
      } else {
        await api.delete(`/alumni/${deletingItem.id}`);
      }
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete item', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ManageableGrid
        title="Hall of Fame"
        description="Celebrating our outstanding students and successful alumni."
        icon={activeTab === 'achievements' ? Trophy : GraduationCap}
        iconColorClass={activeTab === 'achievements' ? 'text-rose-400' : 'text-blue-400'}
        iconBgClass={activeTab === 'achievements' ? 'bg-rose-500/10' : 'bg-blue-500/10'}
        canManage={canManage}
        onAdd={() => activeTab === 'achievements' ? openAchModal() : openAluModal()}
        addLabel={activeTab === 'achievements' ? 'Add Achievement' : 'Add Alumni'}
        rightContent={
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {(['achievements', 'alumni'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors ${
                  activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="hofTab"
                    className="absolute inset-0 bg-rose-600 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 capitalize">
                  {tab === 'achievements' ? <Trophy className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                  {tab}
                </span>
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-64 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between mb-6">
                    <Skeleton className="w-14 h-14 rounded-2xl" />
                    <Skeleton className="w-20 h-6" />
                  </div>
                  <Skeleton className="h-6 w-full mb-3" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'achievements' ? (
          <div className="space-y-16">
            {achievements.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No achievements found"
                description="Achievements will appear here once added by the administration."
              />
            ) : (
              groupedAchievements.map(([year, items]) => (
                <div key={year} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-white">{year}</h2>
                    <div className="h-px bg-slate-800 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((ach: any) => (
                      <motion.div
                        key={ach.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-rose-500/50 transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className={`p-3 rounded-2xl ${
                            ach.position === 'winner' ? 'bg-amber-500/10 text-amber-400' :
                            ach.position === 'runner_up' ? 'bg-slate-300/10 text-slate-300' :
                            'bg-purple-500/10 text-purple-400'
                          }`}>
                            {ach.position === 'winner' ? <Trophy className="w-8 h-8" /> :
                             ach.position === 'runner_up' ? <Award className="w-8 h-8" /> :
                             <Star className="w-8 h-8" />}
                          </div>
                          <span className={`mr-12 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            ach.position === 'winner' ? 'border-amber-500/20 text-amber-400' :
                            ach.position === 'runner_up' ? 'border-slate-500/20 text-slate-300' :
                            'border-purple-500/20 text-purple-400'
                          }`}>
                            {ach.position.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors leading-tight mb-2 pr-8">
                          {ach.title}
                        </h3>
                        {ach.event_id && <p className="text-sm font-semibold text-rose-500 mb-2">Event related</p>}
                        <p className="text-sm text-slate-400 line-clamp-3 mb-4">{ach.description}</p>
                        
                        <ManageableCardOverlay
                          canManage={canManage}
                          onEdit={() => openAchModal(ach)}
                          onDelete={() => { setDeletingItem(ach); setIsDeleteModalOpen(true); }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {alumni.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No alumni profiles found"
                description="Alumni profiles will appear here once added by the administration."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alumni.map((al, idx) => (
                  <motion.div
                    key={al.id}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                    className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex flex-col group"
                  >
                    <div className="p-6 pb-0 flex items-start gap-4 mb-4 pr-12">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 shrink-0 shadow-lg group-hover:border-blue-400 transition-colors">
                        <img
                          src={getAlumniPhotoUrl(al, idx)}
                          alt={al.full_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">{al.full_name}</h3>
                        <p className="text-sm text-blue-400 font-semibold mt-0.5">{al.current_company || 'Alumni'}</p>
                        <p className="text-xs text-slate-500 mt-1">{al.branch} • Class of {al.graduation_year}</p>
                      </div>
                    </div>
                    
                    <div className="p-6 pt-0 flex-1 flex flex-col justify-end">
                      {al.testimonial && (
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-4 relative">
                          <span className="text-3xl text-slate-700 absolute top-2 left-2 font-serif leading-none">"</span>
                          <p className="text-sm text-slate-300 italic relative z-10 px-4 line-clamp-3">{al.testimonial}</p>
                        </div>
                      )}
                      
                      {al.linkedin_url && (
                        <a href={al.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] font-semibold transition-colors text-sm mt-auto mb-2">
                          <Linkedin className="w-4 h-4" /> Connect on LinkedIn
                        </a>
                      )}
                      
                      {al.willing_to_mentor && (
                        <div className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-xs mt-auto">
                           <Star className="w-3.5 h-3.5" /> Willing to Mentor
                        </div>
                      )}
                    </div>
                    
                    <ManageableCardOverlay
                      canManage={canManage}
                      onEdit={() => openAluModal(al)}
                      onDelete={() => { setDeletingItem(al); setIsDeleteModalOpen(true); }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </ManageableGrid>

      {/* Achievement Modal */}
      {isAchievementModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-rose-500" />
                {editingItem ? 'Edit Achievement' : 'Add Achievement'}
              </h2>
              <button onClick={() => setIsAchievementModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={submitAch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={achForm.title}
                  onChange={e => setAchForm({ ...achForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Year</label>
                  <input
                    type="number"
                    required
                    value={achForm.year}
                    onChange={e => setAchForm({ ...achForm, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Position</label>
                  <select
                    value={achForm.position}
                    onChange={e => setAchForm({ ...achForm, position: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="winner">Winner</option>
                    <option value="runner_up">Runner-up</option>
                    <option value="participation">Participation</option>
                    <option value="special_mention">Special Mention</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Related Event (Optional)</label>
                  <select
                    value={achForm.event_id}
                    onChange={e => setAchForm({ ...achForm, event_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="">-- None --</option>
                    {eventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Related Student (Optional)</label>
                  <select
                    value={achForm.student_id}
                    onChange={e => setAchForm({ ...achForm, student_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="">-- None --</option>
                    {studentsList.map(s => (
                      <option key={s.id} value={s.id}>{s.profile?.full_name || s.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  value={achForm.description}
                  onChange={e => setAchForm({ ...achForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors min-h-[100px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAchievementModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Alumni Modal */}
      {isAlumniModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                {editingItem ? 'Edit Alumni' : 'Add Alumni'}
              </h2>
              <button onClick={() => setIsAlumniModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={submitAlu} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={aluForm.full_name}
                  onChange={e => setAluForm({ ...aluForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grad Year</label>
                  <input
                    type="number"
                    required
                    value={aluForm.graduation_year}
                    onChange={e => setAluForm({ ...aluForm, graduation_year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Branch</label>
                  <input
                    type="text"
                    required
                    value={aluForm.branch}
                    onChange={e => setAluForm({ ...aluForm, branch: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. CSE"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Company (Optional)</label>
                <input
                  type="text"
                  value={aluForm.current_company}
                  onChange={e => setAluForm({ ...aluForm, current_company: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">LinkedIn URL (Optional)</label>
                <input
                  type="url"
                  value={aluForm.linkedin_url}
                  onChange={e => setAluForm({ ...aluForm, linkedin_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Testimonial (Optional)</label>
                <textarea
                  value={aluForm.testimonial}
                  onChange={e => setAluForm({ ...aluForm, testimonial: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAlumniModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm">
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
        title={`Delete ${activeTab === 'achievements' ? 'Achievement' : 'Alumni'}?`}
        description={`Are you sure you want to delete this ${activeTab}?`}
        isDeleting={isSubmitting}
      />
    </>
  );
};
