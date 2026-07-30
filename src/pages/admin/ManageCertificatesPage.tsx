import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Search,
  X,
  Loader2,
  Trash2,
  ExternalLink,
  Plus,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Bookmark
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { DeleteConfirmModal } from '../../components/ManageableGrid';

interface Student {
  id: string;
  email: string;
  profile?: {
    id?: string;
    full_name?: string;
    branch?: string;
    academic_year?: string;
  } | null;
}

interface Event {
  id: string;
  title: string;
  event_year: number;
}

interface Certificate {
  id: string;
  student_id: string;
  event_id: string;
  certificate_type: 'winner' | 'runner_up' | 'participation';
  file_url: string;
  issued_at: string;
  event?: Event;
  student?: {
    full_name: string;
    email: string;
  };
}

export const ManageCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'issued' | 'bulk'>('issued');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    event_id: '',
    certificate_type: 'participation' as 'winner' | 'runner_up' | 'participation',
    file_url: '',
  });

  // Bulk ZIP State
  const [bulkEventId, setBulkEventId] = useState('');
  const [bulkCertType, setBulkCertType] = useState('participation');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkReport, setBulkReport] = useState<any | null>(null);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch certificates
      const certRes = await api.get('/certificates?limit=200');
      // Set certificates (handling paginated wrapper items)
      const certList = certRes.data.items || [];

      // Fetch students list (using user endpoint)
      const studentRes = await api.get('/users?role=student&limit=200');
      setStudents(studentRes.data.items || []);

      // Fetch events
      const eventRes = await api.get('/events');
      setEvents(eventRes.data || []);

      // Since certificates backend schema is small, let's map student details locally for cleaner UI
      const enrichedCerts = certList.map((c: any) => {
        const matchingUser = (studentRes.data.items || []).find((s: any) => s.id === c.student_id || s.profile?.id === c.student_id);
        return {
          ...c,
          student: {
            full_name: matchingUser?.profile?.full_name || 'Student Profile',
            email: matchingUser?.email || 'student@clubhub.com',
          }
        };
      });

      setCertificates(enrichedCerts);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load certificates data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.event_id) {
      toast.error('Please select both a student and an event');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/certificates', {
        student_id: formData.student_id,
        event_id: formData.event_id,
        certificate_type: formData.certificate_type,
        file_url: formData.file_url || null,
      });

      toast.success('Certificate issued successfully');
      setIsModalOpen(false);
      setFormData({
        student_id: '',
        event_id: '',
        certificate_type: 'participation',
        file_url: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to issue certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEventId || !zipFile) {
      toast.error('Please select an event and choose a ZIP file');
      return;
    }

    setBulkUploading(true);
    setBulkReport(null);

    const form = new FormData();
    form.append('event_id', bulkEventId);
    form.append('certificate_type', bulkCertType);
    form.append('file', zipFile);

    try {
      const res = await api.post('/certificates/bulk-upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setBulkReport(res.data);
      toast.success('Bulk upload processed!');
      setZipFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokingId) return;
    setIsRevoking(true);
    try {
      await api.delete(`/certificates/${revokingId}`);
      toast.success('Certificate revoked');
      setRevokingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to revoke certificate');
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.student?.full_name.toLowerCase().includes(term) ||
      c.student?.email.toLowerCase().includes(term) ||
      c.event?.title.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 selection:bg-sky-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Manage Certificates</h1>
              <p className="text-sm text-slate-400">Award event rank certificates or bulk import digital PDF records.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Issue Certificate
            </button>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit shadow-inner">
          <button
            onClick={() => setActiveTab('issued')}
            className={`py-2 px-5 rounded-xl text-xs font-bold transition-all ${activeTab === 'issued' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            Issued Certificates
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-2 px-5 rounded-xl text-xs font-bold transition-all ${activeTab === 'bulk' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            Bulk ZIP Upload
          </button>
        </div>

        {/* Tab 1: Issued Certificates */}
        {activeTab === 'issued' && (
          <div className="space-y-6">
            {/* Search filter bar */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, email, event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-44 rounded-3xl bg-slate-900 border border-slate-800" />
                ))}
              </div>
            ) : filteredCerts.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No Certificates Issued"
                description={search ? "No certificates match your query." : "Manually issue or upload ZIP file to get started."}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCerts.map((c) => {
                  const isExternal = c.file_url.startsWith('http');
                  return (
                    <div
                      key={c.id}
                      className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setRevokingId(c.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition-all"
                          title="Revoke Certificate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base leading-snug line-clamp-1">
                              {c.student?.full_name || 'Unnamed Student'}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{c.student?.email}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            {c.event?.title || 'Unknown Event'}
                          </p>
                          <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 capitalize">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Type: {c.certificate_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center justify-between">
                        {isExternal ? (
                          <a
                            href={c.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Web Link
                          </a>
                        ) : (
                          <a
                            href={`${api.defaults.baseURL}/certificates/${c.id}/download`}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 hover:underline"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Download PDF
                          </a>
                        )}

                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(c.issued_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bulk ZIP Import */}
        {activeTab === 'bulk' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-sky-950 border border-sky-800 text-sky-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">ZIP Bulk Certificate Distribution</h2>
                <p className="text-xs text-slate-400">Upload a single ZIP archive containing certificate PDFs matched by Registration No. or Email.</p>
              </div>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Target Event *</label>
                <select
                  required
                  value={bulkEventId}
                  onChange={(e) => setBulkEventId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Choose Event --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.event_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Award Category *</label>
                <select
                  value={bulkCertType}
                  onChange={(e) => setBulkCertType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                >
                  <option value="participation">Participation</option>
                  <option value="winner">Winner</option>
                  <option value="runner_up">Runner-Up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Certificate ZIP Archive *</label>
                <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 bg-slate-950/60 relative cursor-pointer group">
                  <input
                    type="file"
                    accept=".zip"
                    required
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet className="w-10 h-10 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-300">
                      {zipFile ? zipFile.name : 'Select or drop Certificate ZIP'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Accepts .zip only</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={bulkUploading}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {bulkUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting & Matching PDFs...
                  </>
                ) : (
                  'Distribute Bulk ZIP'
                )}
              </button>
            </form>

            {/* Bulk Upload report results */}
            {bulkReport && (
              <div className="mt-8 p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Import Processing Report
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="block text-2xl font-black text-white">{bulkReport.total_files}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Total Files</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="block text-2xl font-black text-emerald-400">{bulkReport.matched_count}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Matched</span>
                  </div>
                </div>

                {bulkReport.unmatched_files && bulkReport.unmatched_files.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Unmatched Files ({bulkReport.unmatched_files.length})
                    </span>
                    <div className="max-h-24 overflow-y-auto bg-slate-900 rounded-lg p-2.5 font-mono text-[9px] text-slate-400 space-y-1">
                      {bulkReport.unmatched_files.map((f: string, idx: number) => (
                        <div key={idx}>{f}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Issue Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl my-8 relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Issue Certificate</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Event *</label>
                  <select
                    required
                    value={formData.event_id}
                    onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Select Event --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.event_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Student *</label>
                  <select
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Select Student Profile --</option>
                    {students.map((std) => {
                      const val = std.profile?.id || std.id;
                      return (
                        <option key={std.id} value={val}>
                          {std.profile?.full_name || std.email} ({std.profile?.branch || 'Student'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Rank Type</label>
                  <select
                    value={formData.certificate_type}
                    onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="participation">Participation</option>
                    <option value="winner">Winner</option>
                    <option value="runner_up">Runner-Up</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5 text-sky-500" />
                    Specific Download Link / URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://myexternalcertwebsite.com/CH-2026-0001"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Pasting an external link will cause the student download button to redirect to this link instead of auto-generating a local PDF.
                  </p>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue Certificate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!revokingId}
        onClose={() => setRevokingId(null)}
        onConfirm={handleRevoke}
        title="Revoke Certificate"
        description="Are you sure you want to revoke and delete this digital certificate? The student will no longer see it in their portal."
        isDeleting={isRevoking}
      />
    </div>
  );
};
export default ManageCertificatesPage;
