import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  QrCode, Search, CheckCircle, AlertTriangle,
  Camera, Users, Clock, Loader2, ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';

interface Event {
  id: string;
  title: string;
  category: string;
  event_date: string;
}

interface VerificationPreview {
  registration_id: string;
  student_id: string;
  student_name: string;
  student_photo_url: string | null;
  branch: string;
  section: string;
  academic_year: string;
  registration_number: string;
  event_id: string;
  event_title: string;
  status: string;
  registered_at: string;
  already_verified: boolean;
  verified_at: string | null;
  verified_by_name: string | null;
  achievement_position: string | null;
  computed_certificate_url: string | null;
}

interface VerificationStats {
  total_registered: number;
  total_verified: number;
  verification_rate: number;
}

interface SessionScan {
  id: string;
  name: string;
  regNum: string;
  timestamp: Date;
  status: 'verified' | 'already_verified';
}

export const VerifyRegistrationsPage: React.FC = () => {
  const { subscribe } = useRealtime();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const [stats, setStats] = useState<VerificationStats>({ total_registered: 0, total_verified: 0, verification_rate: 0 });
  const [mode, setMode] = useState<'camera' | 'manual' | 'list'>('camera');
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Verification State
  const [previewData, setPreviewData] = useState<VerificationPreview | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Achievement Update State
  const [isUpdatingAchievement, setIsUpdatingAchievement] = useState(false);
  const [achievementForm, setAchievementForm] = useState<{ position: string; override_url: string }>({ position: 'none', override_url: '' });

  // Manual Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VerificationPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Session Trail
  const [sessionTrail, setSessionTrail] = useState<SessionScan[]>([]);

  // Scanner state
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Fetch ALL events for dropdown (admin endpoint returns all categories)
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/admin?limit=200&sort_by=event_date&sort_dir=desc');
        const allEvents = res.data.items || [];
        setEvents(allEvents);
        if (allEvents.length > 0) {
          setSelectedEventId(allEvents[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
      }
    };
    fetchEvents();
  }, []);

  const fetchStats = useCallback(async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await api.get(`/verify/stats/${eventId}`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchStats(selectedEventId);
      if (mode === 'list') {
        fetchEventRegistrations(selectedEventId);
      }
    }
  }, [selectedEventId, fetchStats, mode]);

  const fetchEventRegistrations = async (eventId: string) => {
    if (!eventId) return;
    setIsLoadingList(true);
    try {
      const res = await api.get(`/registrations/event/${eventId}?limit=200`);
      setEventRegistrations(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch event registrations', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribe('registrations', () => {
      if (selectedEventId) {
        fetchStats(selectedEventId);
        if (mode === 'list') {
          fetchEventRegistrations(selectedEventId);
        }
      }
    });
    return () => unsubscribe();
  }, [subscribe, selectedEventId, fetchStats, mode]);

  // Handle QR Scan
  const handleScanSuccess = async (decodedText: string) => {
    if (previewData || isVerifying || errorMsg) return; // Prevent multiple scans while processing

    // Attempt scan payload
    try {
      setIsVerifying(true);
      setErrorMsg(null);
      const res = await api.post('/verify/scan', { qr_payload: decodedText });

      // Ensure the scanned QR is for the selected event
      if (res.data.event_id !== selectedEventId) {
        setErrorMsg(`Scanned QR is for a different event: ${res.data.event_title}`);
        setTimeout(() => setErrorMsg(null), 3000);
      } else {
        setPreviewData(res.data);
        setAchievementForm({
          position: res.data.achievement_position || 'none',
          override_url: res.data.computed_certificate_url || ''
        });

        // Auto confirm if not already verified
        if (!res.data.already_verified) {
          try {
            await api.post('/verify/confirm', { registration_id: res.data.registration_id });
            toast.success(`Checked in ${res.data.student_name} successfully!`);
            
            // Add to session trail
            setSessionTrail(prev => [{
              id: res.data.registration_id,
              name: res.data.student_name,
              regNum: res.data.registration_number,
              timestamp: new Date(),
              status: 'verified' as const
            }, ...prev].slice(0, 10));

            // Auto dismiss after 2 seconds
            setTimeout(() => {
              setPreviewData(null);
            }, 2000);
          } catch (confirmErr) {
            setErrorMsg('Auto check-in confirmation failed.');
            setTimeout(() => setErrorMsg(null), 3000);
          }
        } else {
          toast.error(`${res.data.student_name} is already checked in!`);
          setTimeout(() => {
            setPreviewData(null);
          }, 2500);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorMsg('Registration not found or QR is invalid.');
      } else if (err.response?.status === 400) {
        setErrorMsg('Invalid or tampered QR code.');
      } else {
        setErrorMsg('Failed to process QR code.');
      }
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (mode === 'camera' && selectedEventId && !previewData) {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
          false
        );
        scannerRef.current.render((text) => handleScanSuccess(text), () => { /* ignore */ });
      }
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [mode, selectedEventId, previewData]);

  const handleManualSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/verify/manual-search?event_id=${selectedEventId}&query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (mode === 'manual') handleManualSearch();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, mode]);

  const confirmVerification = async () => {
    if (!previewData) return;
    setIsVerifying(true);
    try {
      await api.post('/verify/confirm', { registration_id: previewData.registration_id });

      // Add to session trail
      setSessionTrail(prev => [{
        id: previewData.registration_id,
        name: previewData.student_name,
        regNum: previewData.registration_number,
        timestamp: new Date(),
        status: 'verified' as const
      }, ...prev].slice(0, 10));

      setPreviewData(null);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      setErrorMsg('Failed to confirm check-in.');
    } finally {
      setIsVerifying(false);
    }
  };

  const dismissPreview = () => {
    if (previewData?.already_verified) {
      setSessionTrail(prev => [{
        id: previewData.registration_id,
        name: previewData.student_name,
        regNum: previewData.registration_number,
        timestamp: new Date(),
        status: 'already_verified' as const
      }, ...prev].slice(0, 10));
    }
    setPreviewData(null);
  };

  const handleUpdateAchievement = async () => {
    if (!previewData) return;
    setIsUpdatingAchievement(true);
    try {
      const payload = {
        achievement_position: achievementForm.position === 'none' ? null : achievementForm.position,
        certificate_url_override: achievementForm.override_url || null
      };
      await api.patch(`/registrations/${previewData.registration_id}/achievement`, payload);
      toast.success("Achievement updated");
      setPreviewData(prev => prev ? { ...prev, achievement_position: payload.achievement_position, computed_certificate_url: payload.certificate_url_override } as VerificationPreview : null);
    } catch (err) {
      toast.error("Failed to update achievement");
    } finally {
      setIsUpdatingAchievement(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 w-full">
            <h1 className="text-2xl font-black text-white flex items-center gap-3 mb-2">
              <QrCode className="w-8 h-8 text-sky-400" />
              Event Check-In
            </h1>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full md:w-80 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-sky-500"
            >
              {events.length === 0 && (
                <option value="">No events available</option>
              )}
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} [{ev.category}]
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-96 bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div className="flex justify-between items-end mb-2">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Live Progress</div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">{stats.total_verified}</span>
                <span className="text-slate-500 font-bold mx-1">/</span>
                <span className="text-slate-400 font-bold">{stats.total_registered}</span>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${stats.verification_rate}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-1 text-right text-xs font-bold text-sky-400">{stats.verification_rate}% Checked In</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Scanner / Search */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => setMode('camera')}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors flex items-center gap-2 ${mode === 'camera' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {mode === 'camera' && (
                <motion.div layoutId="verifyTab" className="absolute inset-0 bg-sky-600 rounded-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2"><Camera className="w-4 h-4" /> Camera Scan</span>
            </button>
            <button
              onClick={() => { setMode('manual'); setPreviewData(null); }}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors flex items-center gap-2 ${mode === 'manual' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {mode === 'manual' && (
                <motion.div layoutId="verifyTab" className="absolute inset-0 bg-sky-600 rounded-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2"><Search className="w-4 h-4" /> Manual Search</span>
            </button>
            <button
              onClick={() => { setMode('list'); setPreviewData(null); if (selectedEventId) fetchEventRegistrations(selectedEventId); }}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors flex items-center gap-2 ${mode === 'list' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {mode === 'list' && (
                <motion.div layoutId="verifyTab" className="absolute inset-0 bg-sky-600 rounded-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2"><Users className="w-4 h-4" /> All Registrations</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 min-h-[400px] relative overflow-hidden flex flex-col items-center justify-center">

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="absolute top-6 left-6 right-6 z-20 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-xl backdrop-blur-md"
                >
                  <AlertTriangle className="w-5 h-5" /> {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'camera' && (
              <div className="w-full max-w-sm mx-auto">
                <div id="qr-reader" className="rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950"></div>
                {!previewData && (
                  <p className="text-center text-slate-400 mt-6 font-medium animate-pulse flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" /> Position QR code in frame
                  </p>
                )}
              </div>
            )}

            {mode === 'manual' && !previewData && (
              <div className="w-full max-w-lg mx-auto self-start mt-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or registration #..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition-colors shadow-inner font-medium text-lg"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-500 animate-spin" />
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {searchResults.map(res => (
                    <button
                      key={res.registration_id}
                      onClick={() => {
                        setPreviewData(res);
                        setAchievementForm({
                          position: res.achievement_position || 'none',
                          override_url: res.computed_certificate_url || ''
                        });
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        {res.student_photo_url ? (
                          <img src={getMediaUrl(res.student_photo_url)} alt={res.student_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-500">{res.student_name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white group-hover:text-sky-400 transition-colors">{res.student_name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{res.registration_number}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-sky-500 transition-colors" />
                    </button>
                  ))}
                  {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <div className="text-center text-slate-500 py-8">No matching registrations found for this event.</div>
                  )}
                </div>
              </div>
            )}

            {mode === 'list' && !previewData && (
              <div className="w-full self-start">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Registered Students ({eventRegistrations.length})</h3>
                  <button onClick={() => fetchEventRegistrations(selectedEventId)} className="text-xs text-sky-400 font-semibold hover:underline">
                    Refresh List
                  </button>
                </div>
                {isLoadingList ? (
                  <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-sky-400" /> Loading event registrations...
                  </div>
                ) : eventRegistrations.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">No student registrations for this event yet.</div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                    {eventRegistrations.map((reg: any) => {
                      const isVerified = reg.status === 'verified';
                      const studentName = reg.student?.full_name || 'Student';
                      const studentPhoto = reg.student?.profile_photo_url;
                      return (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm overflow-hidden shrink-0 border border-slate-700">
                              {studentPhoto ? (
                                <img src={import.meta.env.VITE_API_BASE_URL?.replace('/api', '') + studentPhoto} alt={studentName} className="w-full h-full object-cover" />
                              ) : (
                                studentName.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{studentName}</div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">{reg.registration_number} &bull; {reg.student?.branch || 'General'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isVerified ? (
                              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Checked In
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setPreviewData({
                                    registration_id: reg.id,
                                    student_id: reg.student_id,
                                    student_name: studentName,
                                    student_photo_url: studentPhoto || null,
                                    branch: reg.student?.branch || '',
                                    section: reg.student?.section || '',
                                    academic_year: reg.student?.academic_year || '',
                                    registration_number: reg.registration_number,
                                    event_id: reg.event_id,
                                    event_title: reg.event?.title || '',
                                    status: reg.status,
                                    registered_at: reg.registered_at,
                                    already_verified: false,
                                    verified_at: null,
                                    verified_by_name: null,
                                    achievement_position: reg.achievement_position || null,
                                    computed_certificate_url: reg.certificate_url_override || null
                                  });
                                  setAchievementForm({
                                    position: reg.achievement_position || 'none',
                                    override_url: reg.certificate_url_override || ''
                                  });
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Confirm Check-In
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Verification Card Overlay */}
            <AnimatePresence>
              {previewData && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  className={`absolute inset-4 z-10 rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl ${previewData.already_verified
                    ? 'bg-amber-950/90 border-amber-500/50'
                    : 'bg-slate-900/95 border-emerald-500/30'
                    }`}
                >
                  <div className={`p-4 text-center border-b ${previewData.already_verified ? 'border-amber-500/20 bg-amber-500/10' : 'border-slate-800 bg-slate-950/50'}`}>
                    <h3 className={`font-black text-lg ${previewData.already_verified ? 'text-amber-400' : 'text-white'}`}>
                      {previewData.already_verified ? 'Already Checked In' : 'Ready for Check-In'}
                    </h3>
                  </div>

                  <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-950 shadow-2xl relative z-10">
                        {previewData.student_photo_url ? (
                          <img src={getMediaUrl(previewData.student_photo_url)} alt={previewData.student_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-600">{previewData.student_name.charAt(0)}</div>
                        )}
                      </div>
                      {previewData.already_verified && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full border-4 border-amber-950 flex items-center justify-center z-20">
                          <CheckCircle className="w-5 h-5 text-amber-950" />
                        </div>
                      )}
                    </div>

                    <h2 className="text-3xl font-black text-white mt-6 mb-1">{previewData.student_name}</h2>
                    <p className="text-slate-400 font-mono font-bold tracking-widest text-lg bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800 my-4 inline-block">
                      {previewData.registration_number}
                    </p>
                    <p className="text-slate-300 font-medium">{previewData.branch} {previewData.section && `• Sec ${previewData.section}`}</p>

                    {previewData.already_verified && previewData.verified_at && (
                      <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-sm w-full">
                        <p className="text-amber-400/80 text-sm font-semibold mb-1">Checked in at</p>
                        <p className="text-amber-400 font-bold text-lg flex items-center justify-center gap-2">
                          <Clock className="w-5 h-5" />
                          {new Date(previewData.verified_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {previewData.verified_by_name && (
                          <p className="text-amber-500/60 text-xs mt-2">Verified by {previewData.verified_by_name}</p>
                        )}

                        <div className="mt-4 pt-4 border-t border-amber-500/20 text-left">
                          <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider mb-2">Achievement</label>
                          <select
                            value={achievementForm.position}
                            onChange={e => setAchievementForm(f => ({ ...f, position: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-200 focus:outline-none mb-3 text-sm"
                          >
                            <option value="none">None (Participation)</option>
                            <option value="winner">Winner</option>
                            <option value="runner_up">Runner Up</option>
                            <option value="special_mention">Special Mention</option>
                          </select>

                          <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-wider mb-2">Custom Cert URL</label>
                          <input
                            type="url"
                            placeholder="Leave blank to use default"
                            value={achievementForm.override_url}
                            onChange={e => setAchievementForm(f => ({ ...f, override_url: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-200 focus:outline-none placeholder-amber-700 text-sm"
                          />

                          <button
                            onClick={handleUpdateAchievement}
                            disabled={isUpdatingAchievement}
                            className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold rounded-lg transition-colors text-sm"
                          >
                            {isUpdatingAchievement ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 grid grid-cols-2 gap-4 border-t border-slate-800/50 bg-slate-950/50">
                    <button
                      onClick={dismissPreview}
                      className="py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      {previewData.already_verified ? 'Close' : 'Reject'}
                    </button>
                    {!previewData.already_verified && (
                      <button
                        onClick={confirmVerification}
                        disabled={isVerifying}
                        className="py-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 transition-all flex items-center justify-center gap-2"
                      >
                        {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle className="w-6 h-6" /> Confirm</>}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Right Column: Session Audit Trail */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">Session History</h3>
              <p className="text-xs text-slate-500 font-medium">Recent local activity</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {sessionTrail.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                  <Clock className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No check-ins performed in this session yet.</p>
                </motion.div>
              ) : (
                sessionTrail.map(scan => (
                  <motion.div
                    key={`${scan.id}-${scan.timestamp.getTime()}`}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    className="p-3 mb-2 rounded-xl bg-slate-950/50 border border-slate-800/50 flex items-center gap-4"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${scan.status === 'verified' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{scan.name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">{scan.regNum}</p>
                    </div>
                    <div className="text-xs font-semibold text-slate-400 shrink-0">
                      {scan.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};
