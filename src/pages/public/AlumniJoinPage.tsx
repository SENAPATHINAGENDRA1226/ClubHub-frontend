import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { GraduationCap, Briefcase, Linkedin, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const AlumniJoinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    graduation_year: new Date().getFullYear(),
    branch: '',
    current_company: '',
    current_role: '',
    photo_url: '',
    linkedin_url: '',
    testimonial: '',
    willing_to_mentor: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-6 text-rose-500" />
          <h1 className="text-2xl font-black mb-2">Invalid Invite Link</h1>
          <p className="text-slate-400 mb-8">This link is missing a secure token. Please ask the administrator for a valid invite link.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/alumni/public', {
        ...formData,
        token
      });
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to submit profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black mb-4">Profile Submitted!</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">Thank you for joining the CSMD DLIDES CLUB Alumni Network! Your profile is currently under review by our administrators and will be published shortly.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors w-full"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-sky-500/10 border-2 border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Join Our Alumni Network</h1>
          <p className="text-slate-400">Share your journey and inspire current students.</p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
              <input
                type="text" required
                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Graduation Year *</label>
              <input
                type="number" required min="2000" max="2100"
                value={formData.graduation_year} onChange={e => setFormData({...formData, graduation_year: parseInt(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch / Course *</label>
            <input
              type="text" required
              value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors"
              placeholder="e.g., Computer Science, Information Technology"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Current Company
              </label>
              <input
                type="text"
                value={formData.current_company} onChange={e => setFormData({...formData, current_company: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="Google, Microsoft, etc."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Role</label>
              <input
                type="text"
                value={formData.current_role} onChange={e => setFormData({...formData, current_role: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Linkedin className="w-4 h-4" /> LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Photo URL</label>
              <input
                type="url"
                value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Testimonial / Advice for Students</label>
            <textarea
              rows={4}
              value={formData.testimonial} onChange={e => setFormData({...formData, testimonial: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none transition-colors resize-none"
              placeholder="Share a short story about your time at the club, or some advice for current students..."
            ></textarea>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <input
              type="checkbox"
              id="mentor"
              checked={formData.willing_to_mentor}
              onChange={e => setFormData({...formData, willing_to_mentor: e.target.checked})}
              className="w-5 h-5 rounded border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950 bg-slate-900"
            />
            <label htmlFor="mentor" className="text-sm font-bold text-white cursor-pointer select-none">
              I am willing to mentor current students
              <span className="block text-xs font-normal text-slate-400 mt-0.5">We will occasionally reach out with mentoring opportunities.</span>
            </label>
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-sky-500/20 flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit Profile'}
          </button>
        </motion.form>
      </div>
    </div>
  );
};
