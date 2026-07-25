import React, { useEffect, useState } from 'react';
import {
  Settings,
  Lock,
  History,
  CheckCircle2,
  Loader2,
  Bell,
  Building,
  Upload,
  Globe
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';


interface ClubProfile {
  club_name: string;
  tagline: string;
  logo_url: string | null;
  footer_text: string;
}

interface NotificationPrefs {
  new_event: boolean;
  new_opportunity: boolean;
  grievance_resolved: boolean;
  new_resource: boolean;
  certificate_issued: boolean;
  alumni_added: boolean;
}

interface AuditLog {
  id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  entity_type: string;
  created_at: string;
  payload: any;
}

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'notifications' | 'security' | 'audit'>('profile');
  
  // Settings States
  const [profile, setProfile] = useState<ClubProfile>({
    club_name: 'ClubHub',
    tagline: 'Where builders meet.',
    logo_url: null,
    footer_text: '© 2026 ClubHub. All rights reserved.',
  });

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    new_event: true,
    new_opportunity: true,
    grievance_resolved: true,
    new_resource: true,
    certificate_issued: true,
    alumni_added: false,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Logo upload
  const [uploadingLogo, setUploadingLogo] = useState(false);


  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const profileSetting = res.data.find((s: any) => s.key === 'club_profile');
      const notifySetting = res.data.find((s: any) => s.key === 'notification_prefs');

      if (profileSetting) setProfile(profileSetting.value);
      if (notifySetting) setNotifications(notifySetting.value);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/settings/audit-log/recent?limit=50');
      setAuditLogs(res.data.items || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeSubTab]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put('/settings/club_profile', { value: profile });
      toast.success('Club profile settings updated!');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to save profile settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleNotificationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put('/settings/notification_prefs', { value: notifications });
      toast.success('Notification preferences updated!');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to save notification preferences');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await api.post('/settings/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data.value);
      toast.success('Club logo uploaded successfully!');
    } catch (err) {
      toast.error('Logo upload failed. Must be an image file.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      if (!user?.id) {
        toast.error('User ID not found');
        return;
      }
      await api.put(`/users/${user.id}`, { password: newPassword });
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 selection:bg-sky-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">System Settings</h1>
            <p className="text-sm text-slate-400">Configure global profile, alert settings, credentials, and review logs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Sidebar Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 h-fit shadow-xl">
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeSubTab === 'profile' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Building className="w-4 h-4" />
              Club Profile
            </button>
            <button
              onClick={() => setActiveSubTab('notifications')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeSubTab === 'notifications' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notification Prefs
            </button>
            <button
              onClick={() => setActiveSubTab('security')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeSubTab === 'security' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Lock className="w-4 h-4" />
              Security & Password
            </button>
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeSubTab === 'audit' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <History className="w-4 h-4" />
              System Audit Logs
            </button>
          </div>

          {/* Sub Tab View Panel */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* TAB 1: Club Profile settings */}
            {activeSubTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Club Profile Config</h2>
                  <p className="text-xs text-slate-400">Manage public-facing information for the club workspace portal.</p>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Club Name</label>
                      <input
                        type="text"
                        required
                        value={profile.club_name}
                        onChange={(e) => setProfile({ ...profile, club_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Tagline</label>
                      <input
                        type="text"
                        required
                        value={profile.tagline}
                        onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Footer Text</label>
                    <input
                      type="text"
                      required
                      value={profile.footer_text}
                      onChange={(e) => setProfile({ ...profile, footer_text: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Club Logo Image</span>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                          {profile.logo_url ? (
                            <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Globe className="w-6 h-6 text-slate-600" />
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            disabled={uploadingLogo}
                            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 flex items-center gap-2"
                          >
                            {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            Upload New Logo
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={updating}
                      className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Save Profile Settings
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Notification Prefs */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Global Notification preferences</h2>
                  <p className="text-xs text-slate-400">Configure which actions trigger automated system updates.</p>
                </div>

                <form onSubmit={handleNotificationSave} className="space-y-5">
                  <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-300">New Event Alerts</span>
                        <span className="text-[10px] text-slate-500">Notify users immediately when new event schedules are published.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.new_event}
                        onChange={(e) => setNotifications({ ...notifications, new_event: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-300">New Opportunity Alerts</span>
                        <span className="text-[10px] text-slate-500">Alert students of internship or job opportunity postings.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.new_opportunity}
                        onChange={(e) => setNotifications({ ...notifications, new_opportunity: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-300">Grievance Resolving Alerts</span>
                        <span className="text-[10px] text-slate-500">Notify student once their submitted grievance is resolved/replied.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.grievance_resolved}
                        onChange={(e) => setNotifications({ ...notifications, grievance_resolved: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-300">Resource Distribution Alerts</span>
                        <span className="text-[10px] text-slate-500">Alert students when learning resource content is updated.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.new_resource}
                        onChange={(e) => setNotifications({ ...notifications, new_resource: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-300">Digital Certificate Issuance Alerts</span>
                        <span className="text-[10px] text-slate-500">Notify student when a new digital certificate is issued.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.certificate_issued}
                        onChange={(e) => setNotifications({ ...notifications, certificate_issued: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-sky-600 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-800/85">
                    <button
                      type="submit"
                      disabled={updating}
                      className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Save Notification Preferences
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: Change Password */}
            {activeSubTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Security & Password</h2>
                  <p className="text-xs text-slate-400">Change your account login credentials securely.</p>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">New Password * (Min 8 chars)</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: Audit Logs Stream */}
            {activeSubTab === 'audit' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">System Audit Logs</h2>
                  <p className="text-xs text-slate-400">Review recent administrative activities and modifications on the server.</p>
                </div>

                {loadingLogs ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-14 rounded-2xl bg-slate-950 border border-slate-800" />
                    ))}
                  </div>
                ) : auditLogs.length === 0 ? (
                  <EmptyState icon={History} title="No logs found" description="No system activity logs are available." />
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/40">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="p-4">Time</th>
                          <th className="p-4">Actor</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Entity Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/30 text-slate-300">
                            <td className="p-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="p-4 font-semibold whitespace-nowrap">
                              {log.actor_name || log.actor_email || 'System'}
                            </td>
                            <td className="p-4 font-mono text-sky-400 whitespace-nowrap capitalize">
                              {log.action}
                            </td>
                            <td className="p-4 font-medium whitespace-nowrap capitalize">
                              {log.entity_type}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminSettingsPage;
