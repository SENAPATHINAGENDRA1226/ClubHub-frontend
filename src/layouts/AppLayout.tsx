import React, { useState, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Ticket,
  Award,
  Calendar,
  BookOpen,
  Briefcase,
  Users,
  Image as ImageIcon,
  MessageSquareWarning,
  GraduationCap,
  Mail,
  LogOut,
  Menu,
  X,
  Settings,
  QrCode,
  Sun,
  Moon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRealtime } from '../context/RealtimeContext';
import { useTheme } from '../context/ThemeContext';

const studentNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', path: '/profile', icon: User },
  { name: 'Registrations', path: '/profile/registrations', icon: Ticket },
  { name: 'Certificates', path: '/certificates', icon: Award },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Resources', path: '/resources', icon: BookOpen },
  { name: 'Opportunities', path: '/opportunities', icon: Briefcase },
  { name: 'Committees', path: '/committees', icon: Users },
  { name: 'Media', path: '/media', icon: ImageIcon },
  { name: 'Grievance', path: '/grievances', icon: MessageSquareWarning },
  { name: 'Alumni & Achievements', path: '/alumni-achievements', icon: GraduationCap },
  { name: 'Contact Us', path: '/contact', icon: Mail },
];

const adminNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'committee'] },
  { name: 'Manage Users', path: '/admin/users', icon: Users, allowedRoles: ['admin'] },
  { name: 'QR Verification', path: '/admin/verify', icon: QrCode, allowedRoles: ['admin', 'committee'] },
  { name: 'Manage Certificates', path: '/admin/certificates', icon: Award, allowedRoles: ['admin'] },
  { name: 'Manage Events', path: '/admin/events', icon: Calendar, allowedRoles: ['admin', 'committee'] },
  { name: 'Manage Resources', path: '/resources', icon: BookOpen, allowedRoles: ['admin', 'committee'] },
  { name: 'Manage Opportunities', path: '/opportunities', icon: Briefcase, allowedRoles: ['admin', 'committee'] },
  { name: 'Manage Committees', path: '/admin/committees', icon: Users, allowedRoles: ['admin'] },
  { name: 'Manage Members', path: '/committees', icon: Users, allowedRoles: ['admin', 'committee'] },
  { name: 'Manage Media', path: '/admin/media', icon: ImageIcon, allowedRoles: ['admin', 'committee'] },
  { name: 'Manage Grievances', path: '/admin/grievances', icon: MessageSquareWarning, allowedRoles: ['admin', 'committee'] },
  { name: 'Alumni & Achievements', path: '/admin/alumni-achievements', icon: GraduationCap, allowedRoles: ['admin', 'committee'] },
  { name: 'Settings', path: '/admin/settings', icon: Settings, allowedRoles: ['admin'] },
];

export const AppLayout: React.FC = () => {
  const { user, logout, role } = useAuth();
  const { subscribe } = useRealtime();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const themeIconRef = useRef<HTMLSpanElement>(null);

  const handleThemeToggle = () => {
    if (themeIconRef.current) {
      themeIconRef.current.classList.remove('theme-icon-animate');
      void themeIconRef.current.offsetWidth; // force reflow
      themeIconRef.current.classList.add('theme-icon-animate');
    }
    toggleTheme();
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  React.useEffect(() => {
    const unsubscribe = subscribe('*', (data: any) => {
      // Avoid toasting the user's own actions if possible, but we don't have user ID in all payloads easily
      // Let's pop basic informational toasts based on role
      const eventType = data.event_type;
      
      if (role === 'student') {
        if (eventType === 'event.created' && data.payload?.title) {
          toast(`New event added: ${data.payload.title}`, { icon: '📅' });
        } else if (eventType === 'opportunity.created' && data.payload?.title) {
          toast(`New opportunity: ${data.payload.title}`, { icon: '💼' });
        } else if (eventType === 'resource.created' && data.payload?.title) {
          toast(`New resource: ${data.payload.title}`, { icon: '📚' });
        }
      }
      
      if (role === 'admin' || role === 'committee') {
        if (eventType === 'registration.created') {
          toast(`New registration received`, { icon: '🎟️' });
        } else if (eventType === 'contact.submitted') {
          toast(`New contact message received`, { icon: '✉️' });
        } else if (eventType === 'grievance.submitted') {
          toast(`New grievance submitted`, { icon: '⚠️' });
        }
      }
    });
    
    return () => unsubscribe();
  }, [subscribe, role]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'shadow-xl rounded-xl',
          style: theme === 'dark' ? {
            background: '#0f172a',
            color: '#f1f5f9',
            border: '1px solid #1e293b'
          } : {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 30px -4px rgba(0,0,0,0.08)'
          }
        }} 
      />
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transform transition-all duration-300 ease-in-out lg:relative ${
          sidebarOpen 
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-full lg:-ml-72 opacity-0 pointer-events-none'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 h-20 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-slate-900/40 border border-slate-800 shadow-lg shrink-0">
              <img src="/logo.png" alt="DLIDES Student Club Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">DLIDES CLUB</h1>
              <p className="text-[10px] text-sky-400 font-bold tracking-widest uppercase">CSMD</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Student Nav */}
          {role === 'student' && (
            <div className="space-y-1">
              <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
              {studentNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}

          {/* Admin / Committee Nav */}
          {(role === 'admin' || role === 'committee') && (
            <div className="space-y-1">
              <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Manage</p>
              {adminNavItems.filter(item => role && item.allowedRoles.includes(role)).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center shrink-0"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold capitalize">
                {role} Role
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 flex items-center gap-2 text-xs font-semibold shadow-md"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span ref={themeIconRef} className="inline-flex">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
              </span>
              {theme === 'dark' ? (
                <span className="hidden md:inline text-amber-400">Light Mode</span>
              ) : (
                <span className="hidden md:inline text-indigo-600">Dark Mode</span>
              )}
            </button>

            <div className="text-right hidden sm:block">
              <span className="block text-sm font-bold text-white">
                {user?.profile?.full_name || user?.email}
              </span>
              {user?.profile && (
                <span className="block text-xs text-slate-400">
                  {user.profile.branch} &bull; {user.profile.academic_year}
                </span>
              )}
            </div>
            
            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 transition-all border border-slate-700 hover:border-rose-800 flex items-center gap-2 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
