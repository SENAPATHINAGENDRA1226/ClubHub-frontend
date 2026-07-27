import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { CheckCircle2, Ticket, AlertCircle, Calendar, MapPin, Clock } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string;
}

export const RegistrationsPage: React.FC = () => {
  const getQrUrl = (rawUrl?: string) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const serverBase = apiBase.replace(/\/api\/?$/, '');
    if (rawUrl.startsWith('/media/qr/')) {
      const filename = rawUrl.replace('/media/qr/', '');
      return `${serverBase}/api/registrations/qr/${filename}`;
    }
    return `${serverBase}${rawUrl}`;
  };

  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get('event_id');

  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdFromUrl || '');
  const [pastRegistrations, setPastRegistrations] = useState<any[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null); // To store returned QR info

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await api.get('/events?category=current');
        setEvents(eventsRes.data.items || []);
        
        const regRes = await api.get('/registrations/me');
        setPastRegistrations(regRes.data.items || []);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
    const unsubscribeReg = subscribe('registrations', () => fetchData());
    const unsubscribeEvt = subscribe('events', () => fetchData());
    return () => {
      unsubscribeReg();
      unsubscribeEvt();
    };
  }, [subscribe]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      setErrorMsg('Please select an event to register.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/registrations', { event_id: selectedEventId });
      setSuccessData(res.data);
      
      // Auto download QR code trick using blob
      try {
        const fullUrl = getQrUrl(res.data.qr_code_image_url);
        const fetchRes = await fetch(fullUrl);
        const blob = await fetchRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `registration-${res.data.registration_number}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (dlErr) {
        console.error('Failed auto download QR:', dlErr);
      }

      // Refresh past registrations
      const regRes = await api.get('/registrations/me');
      setPastRegistrations(regRes.data.items || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
          <Ticket className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Event Registrations</h1>
          <p className="text-slate-400 text-sm mt-1">Register for current events and access your tickets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          {successData ? (
            <div className="text-center space-y-6 animate-in zoom-in duration-300">
              <div className="w-20 h-20 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Registration Successful!</h3>
                <p className="text-slate-400 text-sm mt-2">Your QR ticket has been generated and downloaded.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto shadow-inner">
                <img src={getQrUrl(successData.qr_code_image_url)} alt="QR Code" className="w-full h-full object-contain" />
              </div>
              <p className="text-xl font-mono font-bold text-sky-400">{successData.registration_number}</p>
              <button
                onClick={() => { setSuccessData(null); setSelectedEventId(''); }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Register for another event
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">New Registration</h3>
              
              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-200 text-sm flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors"
                  required
                >
                  <option value="">-- Choose an Event --</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>{evt.title}</option>
                  ))}
                </select>
              </div>

              {selectedEvent && (
                <div className="p-5 rounded-2xl bg-sky-950/20 border border-sky-900/50 space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-sky-300">{selectedEvent.title}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-500" /> {new Date(selectedEvent.event_date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500" /> {new Date(selectedEvent.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="flex items-center gap-2 col-span-2"><MapPin className="w-4 h-4 text-sky-500" /> {selectedEvent.venue}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Details (Auto-filled)</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" readOnly value={user?.profile?.full_name || ''} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 cursor-not-allowed" />
                  <input type="text" readOnly value={user?.profile?.branch || ''} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 cursor-not-allowed" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedEventId}
                className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><CheckCircle2 className="w-5 h-5" /> Confirm Registration</>}
              </button>
            </form>
          )}
        </div>

        {/* Past Registrations List */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-slate-400" /> Registration History
          </h3>
          
          <div className="space-y-3">
            {pastRegistrations.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No registrations found"
                description="No past registrations found."
              />
            ) : (
              pastRegistrations.map((reg) => (
                <div key={reg.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition-colors">
                  <div>
                    <h4 className="font-bold text-white">{reg.event?.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> {new Date(reg.registered_at).toLocaleDateString()}
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300 ml-2">{reg.registration_number}</span>
                    </p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border ${
                      reg.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" /> {reg.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
