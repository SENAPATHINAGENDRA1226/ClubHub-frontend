import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api, { getErrorMessage } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { MessageSquareWarning, CheckCircle2, AlertCircle, Clock, Send } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export const GrievancePage: React.FC = () => {
  const { subscribe } = useRealtime();

  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Student State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await api.get('/grievances/me');
      setGrievances(res.data.items || []);
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
  }, [subscribe]);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.post('/grievances', { subject, message, category, is_anonymous: isAnonymous });
      setSuccessMsg('Grievance submitted successfully. We will look into it shortly.');
      setSubject('');
      setMessage('');
      setCategory('other');
      setIsAnonymous(false);
      fetchGrievances();
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err, 'Failed to submit grievance'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>;
      case 'in_progress':
      case 'under_review':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
      case 'rejected':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3.5 h-3.5" /> Closed</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20"><AlertCircle className="w-3.5 h-3.5" /> Open</span>;
    }
  };

  const getTimeline = (g: any) => {
    const isInProgress = g.status === 'in_progress' || g.status === 'under_review';
    const isResolved = g.status === 'resolved';
    const isRejected = g.status === 'rejected';

    let lineWidth = '0%';
    let lineGradient = 'from-rose-500 to-rose-500';
    let lineGlow = 'shadow-[0_0_12px_rgba(244,63,94,0.6)]';

    if (isInProgress) {
      lineWidth = '50%';
      lineGradient = 'from-rose-500 via-amber-500 to-amber-400';
      lineGlow = 'shadow-[0_0_14px_rgba(245,158,11,0.7)]';
    } else if (isResolved) {
      lineWidth = '100%';
      lineGradient = 'from-rose-500 via-amber-400 to-emerald-500';
      lineGlow = 'shadow-[0_0_16px_rgba(16,185,129,0.8)]';
    } else if (isRejected) {
      lineWidth = '100%';
      lineGradient = 'from-rose-500 to-red-600';
      lineGlow = 'shadow-[0_0_16px_rgba(225,29,72,0.8)]';
    }

    return (
      <div className="relative mt-6 pt-6 border-t border-slate-800/80">
        {/* Background Track Bar */}
        <div className="absolute top-[34px] left-8 right-8 h-1 bg-slate-800/90 rounded-full -z-0" />

        {/* Real-time Animated Progress Line with Gradient Glow */}
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: lineWidth }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`absolute top-[34px] left-8 max-w-[calc(100%-4rem)] h-1 bg-gradient-to-r ${lineGradient} rounded-full z-0 ${lineGlow}`}
        />

        <div className="flex justify-between relative z-10">
          {/* Step 1: SUBMITTED */}
          <div className="flex flex-col items-center group">
            <div className="relative flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-900 shadow-lg shadow-rose-500/40 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75"></span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mt-2">Submitted</span>
            {g.submitted_at && (
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {new Date(g.submitted_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Step 2: UNDER REVIEW */}
          <div className="flex flex-col items-center group">
            <div className="relative flex items-center justify-center">
              <div
                className={`w-5 h-5 rounded-full border-2 border-slate-900 shadow-lg transition-all duration-500 flex items-center justify-center ${
                  isInProgress || isResolved || isRejected
                    ? 'bg-amber-500 shadow-amber-500/50 scale-110'
                    : 'bg-slate-800'
                }`}
              >
                {isInProgress && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75"></span>}
              </div>
            </div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider mt-2 transition-colors ${
                isInProgress || isResolved ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              Under Review
            </span>
            {g.under_review_at && (
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {new Date(g.under_review_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Step 3: RESOLVED / REJECTED */}
          <div className="flex flex-col items-center group">
            <div className="relative flex items-center justify-center">
              <div
                className={`w-5 h-5 rounded-full border-2 border-slate-900 shadow-lg transition-all duration-500 flex items-center justify-center ${
                  isResolved
                    ? 'bg-emerald-500 shadow-emerald-500/50 scale-110'
                    : isRejected
                    ? 'bg-red-500 shadow-red-500/50 scale-110'
                    : 'bg-slate-800'
                }`}
              >
                {isResolved && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75"></span>}
              </div>
            </div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider mt-2 transition-colors ${
                isResolved
                  ? 'text-emerald-400'
                  : isRejected
                  ? 'text-red-400'
                  : 'text-slate-500'
              }`}
            >
              {isRejected ? 'Closed' : 'Resolved'}
            </span>
            {g.resolved_at && (
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {new Date(g.resolved_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
          <MessageSquareWarning className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Grievance Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Submit a concern or issue directly to the administration.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Submit New Grievance</h2>
        
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-sm flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleStudentSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              required
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                <option value="other">Other</option>
                <option value="event">Event</option>
                <option value="committee">Committee</option>
                <option value="facility">Facilities</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl h-[50px] self-end">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900"
              />
              <label htmlFor="anonymous" className="text-sm font-bold text-white cursor-pointer select-none">
                Submit Anonymously
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detailed Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Provide as much detail as possible..."
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors resize-y custom-scrollbar"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Send className="w-4 h-4" /> Submit Grievance</>}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Your Past Grievances
        </h2>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : grievances.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl text-slate-500 text-sm">
            You haven't submitted any grievances yet.
          </div>
        ) : (
          <div className="space-y-4">
            {grievances.map(g => (
              <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{g.subject}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">Submitted: {new Date(g.submitted_at).toLocaleString()}</p>
                  </div>
                  {getStatusBadge(g.status)}
                </div>
                
                <p className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                  {g.message}
                </p>

                {g.admin_response && (
                  <div className="pl-4 border-l-2 border-emerald-500/50 space-y-2 mt-4 pt-2">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Admin Response</p>
                    <p className="text-sm text-slate-300">{g.admin_response}</p>
                    {g.resolved_at && (
                      <p className="text-xs text-slate-500 font-mono">Resolved: {new Date(g.resolved_at).toLocaleString()}</p>
                    )}
                  </div>
                )}

                {getTimeline(g)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
