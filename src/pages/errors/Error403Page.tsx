import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Error403Page: React.FC = () => {
  const { role } = useAuth();
  
  const getHomeLink = () => {
    if (role === 'admin' || role === 'committee') return '/admin/dashboard';
    if (role === 'student') return '/dashboard';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full"></div>
          <ShieldAlert className="w-32 h-32 text-rose-500 mx-auto relative z-10" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
            403
          </h1>
          <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            You don't have permission to view this page. If you believe this is an error, please contact support.
          </p>
        </div>

        <Link
          to={getHomeLink()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all shadow-lg shadow-black/50 border border-slate-700"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
