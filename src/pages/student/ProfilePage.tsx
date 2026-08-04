import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Mail, Phone, BookOpen, GraduationCap, Github, Linkedin, Instagram, Settings, Save, X, Ticket, CheckCircle2 } from 'lucide-react';

const formatExternalUrl = (url: string, defaultDomain: string) => {
  if (!url) return '';
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  if (cleanUrl.startsWith('@')) {
    return `https://${defaultDomain}/${cleanUrl.substring(1)}`;
  }
  if (!cleanUrl.includes('.') && !cleanUrl.includes('/')) {
    if (defaultDomain === 'linkedin.com') {
      return `https://${defaultDomain}/in/${cleanUrl}`;
    }
    return `https://${defaultDomain}/${cleanUrl}`;
  }
  return `https://${cleanUrl}`;
};

const getUrlDisplayText = (url: string, defaultDomain: string) => {
  if (!url) return '';
  let clean = url.trim();
  if (clean.startsWith('@')) {
    return `${defaultDomain}/${clean.substring(1)}`;
  }
  if (!clean.includes('.') && !clean.includes('/')) {
    if (defaultDomain === 'linkedin.com') {
      return `${defaultDomain}/in/${clean}`;
    }
    return `${defaultDomain}/${clean}`;
  }
  // Strip http:// or https:// and www.
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
  // Strip trailing slashes
  clean = clean.replace(/\/$/, '');
  return clean;
};

export const ProfilePage: React.FC = () => {
  const { user, login } = useAuth(); // Need to call auth /me again to update context or just rely on local state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.profile?.full_name || '',
    branch: user?.profile?.branch || '',
    section: user?.profile?.section || '',
    phone_number: user?.profile?.phone_number || '',
    academic_year: user?.profile?.academic_year || '',
    cgpa: user?.profile?.cgpa || '',
    linkedin_url: user?.profile?.linkedin_url || '',
    github_url: user?.profile?.github_url || '',
    instagram_url: user?.profile?.instagram_url || '',
  });

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedQr, setSelectedQr] = useState<{ url: string; regNum: string } | null>(null);

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

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await api.get('/registrations/me?limit=5');
        setRegistrations(res.data.items || []);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      }
    };
    fetchRegistrations();
  }, []);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        name: user.profile.full_name || '',
        branch: user.profile.branch || '',
        section: user.profile.section || '',
        phone_number: user.profile.phone_number || '',
        academic_year: user.profile.academic_year || '',
        cgpa: user.profile.cgpa?.toString() || '',
        linkedin_url: user.profile.linkedin_url || '',
        github_url: user.profile.github_url || '',
        instagram_url: user.profile.instagram_url || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/onboarding/student?force=true', formData);
      // Re-fetch user data to update auth context
      const meRes = await api.get('/auth/me');
      const token = localStorage.getItem('access_token') || '';
      const refresh = localStorage.getItem('refresh_token') || '';
      login(token, refresh, meRes.data, 'student', true);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadQr = async (url: string, regNum: string) => {
    try {
      const fullUrl = getQrUrl(url);
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `registration-${regNum}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR blob:', err);
      window.open(getQrUrl(url), '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">My Profile</h1>
        {!isEditing && (
          <button
            onClick={() => {
              if (user?.profile) {
                setFormData({
                  name: user.profile.full_name || '',
                  branch: user.profile.branch || '',
                  section: user.profile.section || '',
                  phone_number: user.profile.phone_number || '',
                  academic_year: user.profile.academic_year || '',
                  cgpa: user.profile.cgpa?.toString() || '',
                  linkedin_url: user.profile.linkedin_url || '',
                  github_url: user.profile.github_url || '',
                  instagram_url: user.profile.instagram_url || '',
                });
              }
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="h-32 bg-gradient-to-r from-sky-900 to-indigo-900"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex justify-between items-end">
            <div className="w-32 h-32 rounded-2xl bg-slate-800 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-4xl font-bold text-sky-400 uppercase">
              {user?.profile?.full_name?.charAt(0) || ''}
            </div>
            {isEditing && (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.profile?.full_name}</h2>
                  <p className="text-sky-400 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" /> {user?.email}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Branch</p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-500" /> {user?.profile?.branch} - {user?.profile?.section}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Year</p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500" /> {user?.profile?.academic_year}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500" /> {user?.profile?.phone_number || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">CGPA</p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center text-rose-500 font-bold">#</span> 
                      {user?.profile?.cgpa || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Social Links</h3>
                <div className="flex flex-col gap-3">
                  {user?.profile?.github_url && (
                    <a 
                      href={formatExternalUrl(user.profile.github_url, 'github.com')} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors text-slate-300 hover:text-white"
                    >
                      <Github className="w-5 h-5" /> {getUrlDisplayText(user.profile.github_url, 'github.com')}
                    </a>
                  )}
                  {user?.profile?.linkedin_url && (
                    <a 
                      href={formatExternalUrl(user.profile.linkedin_url, 'linkedin.com')} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-sky-600 transition-colors text-slate-300 hover:text-sky-400"
                    >
                      <Linkedin className="w-5 h-5" /> {getUrlDisplayText(user.profile.linkedin_url, 'linkedin.com')}
                    </a>
                  )}
                  {user?.profile?.instagram_url && (
                    <a 
                      href={formatExternalUrl(user.profile.instagram_url, 'instagram.com')} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-rose-600 transition-colors text-slate-300 hover:text-rose-400"
                    >
                      <Instagram className="w-5 h-5" /> {getUrlDisplayText(user.profile.instagram_url, 'instagram.com')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Branch</label>
                    <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Section</label>
                    <input type="text" name="section" value={formData.section} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Academic Year</label>
                    <select name="academic_year" value={formData.academic_year} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500">
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">CGPA</label>
                    <input type="number" step="0.01" name="cgpa" value={formData.cgpa} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">GitHub URL</label>
                  <input type="url" name="github_url" value={formData.github_url} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">LinkedIn URL</label>
                  <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Instagram URL</label>
                  <input type="url" name="instagram_url" value={formData.instagram_url} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-sky-400" /> Recent Registrations
        </h2>
        {registrations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
            You haven't registered for any events yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.map(reg => (
              <div key={reg.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center group hover:border-sky-500/50 transition-colors cursor-pointer" onClick={() => setSelectedQr({ url: reg.qr_code_image_url, regNum: reg.registration_number })}>
                <div>
                  <h4 className="font-bold text-white group-hover:text-sky-400 transition-colors">{reg.event?.title}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">{reg.registration_number}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {reg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedQr(null)}>
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 max-w-sm w-full text-center space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white">Your QR Code</h3>
            <img src={getQrUrl(selectedQr.url)} alt="QR Code" className="w-full h-auto rounded-xl bg-white p-4" />
            <div className="flex gap-3">
              <button onClick={() => setSelectedQr(null)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors">Close</button>
              <button onClick={() => handleDownloadQr(selectedQr.url, selectedQr.regNum)} className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors">Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
