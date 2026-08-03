import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Send, CheckCircle2, AlertCircle, MessageSquare, MailOpen, Mail } from 'lucide-react';
import { ManageableGrid } from '../../components/ManageableGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const ContactUsPage: React.FC = () => {
  const { user, role } = useAuth();
  const { subscribe } = useRealtime();
  const isAdmin = role === 'admin';
  
  // Student Form State
  const [formData, setFormData] = useState({
    name: user?.profile?.full_name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin State
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState<string>('all');

  const fetchMessages = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const query = filterRead !== 'all' ? `?is_read=${filterRead === 'read'}` : '';
      const res = await api.get(`/contact${query}`);
      setMessages(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
      const unsubscribe = subscribe('contacts', () => fetchMessages());
      return () => unsubscribe();
    }
  }, [subscribe, isAdmin, filterRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.post('/contact', formData);
      setSuccessMsg('Your message has been sent successfully. We will get back to you soon.');
      setFormData({
        name: user?.profile?.full_name || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err, 'Failed to send message'));
    } finally {
      setSubmitting(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/contact/${id}/read`);
      fetchMessages();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  if (isAdmin) {
    return (
      <ManageableGrid
        title="Contact Messages"
        description="Review messages sent by users."
        icon={MessageSquare}
        iconColorClass="text-sky-400"
        iconBgClass="bg-sky-500/10"
        canManage={false}
        rightContent={
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        }
      >
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50">
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No messages found"
            description="Everything is clear!"
          />
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors ${msg.is_read ? 'bg-slate-900/50 border-slate-800/50' : 'bg-slate-900 border-sky-500/30 shadow-lg shadow-sky-900/10'}`}>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {msg.is_read ? (
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500"><MailOpen className="w-3.5 h-3.5" /> Read</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-sky-400"><Mail className="w-3.5 h-3.5" /> Unread</span>
                    )}
                    <span className="text-xs text-slate-500 font-mono">{new Date(msg.submitted_at).toLocaleString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{msg.subject}</h3>
                  <div className="text-sm font-semibold text-slate-300">From: {msg.name} ({msg.email})</div>
                  <p className="text-sm text-slate-400 mt-2 bg-slate-950 p-4 rounded-xl border border-slate-800">{msg.message}</p>
                </div>
                {!msg.is_read && (
                  <button
                    onClick={() => markAsRead(msg.id)}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-colors whitespace-nowrap"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </ManageableGrid>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col items-center text-center space-y-6 mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-sky-500/10 rounded-full text-sky-400 mb-2">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Contact Us</h1>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto">Have a question or suggestion? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {successMsg && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-sm flex gap-3 items-start relative z-10 backdrop-blur-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-8 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-sm flex gap-3 items-start relative z-10 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleStudentSubmit} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="What is this regarding?"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Type your message here..."
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors resize-y custom-scrollbar"
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-sky-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Send className="w-5 h-5" /> Send Message</>}
          </button>
        </form>
      </div>
    </div>
  );
};
