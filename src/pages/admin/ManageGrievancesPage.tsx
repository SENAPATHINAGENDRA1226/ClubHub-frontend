import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { MessageSquareWarning, CheckCircle2, AlertCircle, Clock, X, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ManageableGrid } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const ManageGrievancesPage: React.FC = () => {
  const { subscribe } = useRealtime();

  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Admin State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [adminStatus, setAdminStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const query = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const [res, statsRes] = await Promise.all([
         api.get(`/grievances${query}`),
         api.get('/grievances/stats')
      ]);
      setGrievances(res.data.items || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch grievances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
    const unsubscribe = subscribe('grievances', () => fetchGrievances());
    return () => unsubscribe();
  }, [subscribe, filterStatus]);

  const openAdminModal = (g: any) => {
    setSelectedGrievance(g);
    setAdminResponse(g.admin_response || '');
    setAdminStatus(g.status);
    setIsModalOpen(true);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/grievances/${selectedGrievance.id}`, {
        status: adminStatus,
        admin_response: adminResponse || null
      });
      setIsModalOpen(false);
      fetchGrievances();
    } catch (err) {
      console.error('Failed to update grievance', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>;
      case 'in_progress':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20"><AlertCircle className="w-3.5 h-3.5" /> Open</span>;
    }
  };

  const COLORS = ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#10b981'];

  const chartData = stats ? Object.entries(stats.category_distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : [];

  return (
    <div className="pb-24">
      {/* Analytics Dashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-2xl">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
               <PieChartIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Grievance Analytics</h2>
         </div>
         
         {stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-1 space-y-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                     <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Open</div>
                     <div className="text-2xl font-black text-white">{stats.total_open}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                     <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">In Progress</div>
                     <div className="text-2xl font-black text-amber-400">{stats.total_in_progress}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                     <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Resolved</div>
                     <div className="text-2xl font-black text-emerald-400">{stats.total_resolved}</div>
                  </div>
                  {stats.avg_resolution_time_days !== null && (
                     <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg Res. Time</div>
                        <div className="text-2xl font-black text-white">{stats.avg_resolution_time_days.toFixed(1)} <span className="text-sm">days</span></div>
                     </div>
                  )}
               </div>
               
               <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-center min-h-[250px]">
                  {chartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                           <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                           >
                              {chartData.map((_, i) => (
                                 <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                              ))}
                           </Pie>
                           <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                              itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                           />
                           <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="text-slate-500 font-medium">No category data available</div>
                  )}
               </div>
            </div>
         ) : (
            <div className="h-40 flex items-center justify-center">
               <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
         )}
      </div>

      <ManageableGrid
        title="Manage Grievances"
        description="Review and respond to student concerns."
        icon={MessageSquareWarning}
        iconColorClass="text-rose-400"
        iconBgClass="bg-rose-500/10"
        canManage={false} // No global "Add" for admin here
        rightContent={
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-rose-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        }
      >
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : grievances.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No grievances found"
            description="Everything looks good!"
          />
        ) : (
          <div className="space-y-4">
            {grievances.map(g => (
              <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-slate-700 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(g.status)}
                    {g.is_anonymous && <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">Anonymous</span>}
                    {g.category && <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">{g.category}</span>}
                    <span className="text-xs text-slate-500 font-mono">{new Date(g.submitted_at).toLocaleString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{g.subject}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{g.message}</p>
                </div>
                <button
                  onClick={() => openAdminModal(g)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors whitespace-nowrap"
                >
                  Respond
                </button>
              </div>
            ))}
          </div>
        )}
      </ManageableGrid>

      {isModalOpen && selectedGrievance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-rose-500" />
                Respond to Grievance
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800">
              <div className="flex gap-2 mb-2">
                {selectedGrievance.is_anonymous ? <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">Anonymous</span> : null}
                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase border border-indigo-500/20">{selectedGrievance.category || 'General'}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{selectedGrievance.subject}</h3>
              <p className="text-sm text-slate-300">{selectedGrievance.message}</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">Submitted: {new Date(selectedGrievance.submitted_at).toLocaleString()}</p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Update Status</label>
                <select
                  value={adminStatus}
                  onChange={e => setAdminStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Response</label>
                <textarea
                  value={adminResponse}
                  onChange={e => setAdminResponse(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors min-h-[120px]"
                  placeholder="Provide a resolution or update to the student..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm">
                  {submitting ? 'Saving...' : 'Update Grievance'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
