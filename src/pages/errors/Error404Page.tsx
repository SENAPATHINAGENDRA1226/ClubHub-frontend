import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Error404Page: React.FC = () => {
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
          <div className="absolute inset-0 bg-sky-500/20 blur-[100px] rounded-full"></div>
          <FileQuestion className="w-32 h-32 text-sky-400 mx-auto relative z-10" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            We couldn't find the page you were looking for. It might have been moved or deleted.
          </p>
        </div>

        <Link
          to={getHomeLink()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-900/50"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};
