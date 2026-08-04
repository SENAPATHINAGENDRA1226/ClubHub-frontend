import React, { useState } from 'react';
import { GraduationCap, Trophy } from 'lucide-react';
import { ManageAlumniPage } from './ManageAlumniPage';
import { ManageAchievementsPage } from './ManageAchievementsPage';

export const ManageAlumniAchievementsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alumni' | 'achievements'>('alumni');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-center mb-6">
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('alumni')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
              activeTab === 'alumni' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Manage Alumni
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
              activeTab === 'achievements' ? 'bg-amber-600 text-slate-950 shadow-lg shadow-amber-950/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Manage Achievements
          </button>
        </div>
      </div>

      {activeTab === 'alumni' ? <ManageAlumniPage /> : <ManageAchievementsPage />}
    </div>
  );
};
