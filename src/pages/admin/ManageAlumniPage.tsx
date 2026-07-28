import React, { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle, Link as LinkIcon, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';

export const ManageAlumniPage: React.FC = () => {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      // Admin sees all (published and unpublished)
      const res = await api.get('/alumni?limit=100&status=all');
      setAlumni(res.data.items || []);
    } catch (err) {
      toast.error('Failed to load alumni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await api.post('/alumni/invite');
      const fullLink = `${window.location.origin}${res.data.invite_url}`;
      setInviteLink(fullLink);
      toast.success('Invite link generated!');
    } catch (err) {
      toast.error('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Copied to clipboard!');
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/alumni/${id}/publish?is_published=${!currentStatus}`);
      toast.success(currentStatus ? 'Unpublished alumni' : 'Published alumni');
      fetchAlumni();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">Manage Alumni</h1>
            <p className="text-slate-400 font-medium">Review and publish alumni profiles.</p>
          </div>
        </div>
        
        <div className="w-full md:w-auto">
          {inviteLink ? (
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <input type="text" readOnly value={inviteLink} className="bg-transparent text-sm text-slate-300 px-2 outline-none w-64" />
              <button onClick={copyToClipboard} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors">
                Copy
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              {generatingLink ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LinkIcon className="w-5 h-5" /> Generate Invite Link</>}
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnus</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Graduation</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Company & Role</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24 mx-auto" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : alumni.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No alumni profiles found.</p>
                  </td>
                </tr>
              ) : (
                alumni.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                          {a.photo_url ? (
                            <img src={a.photo_url} alt={a.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{a.full_name.charAt(0)}</div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{a.full_name}</div>
                          <div className="text-xs text-slate-400">{a.branch}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">{a.graduation_year}</td>
                    <td className="p-4">
                      <div className="text-slate-200 font-medium">{a.current_company || '-'}</div>
                      <div className="text-xs text-slate-400">{a.current_role}</div>
                    </td>
                    <td className="p-4 text-center">
                      {a.is_published ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => togglePublish(a.id, a.is_published)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                          a.is_published 
                            ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                        }`}
                      >
                        {a.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
