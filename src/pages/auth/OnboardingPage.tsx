import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { getErrorMessage } from '../../services/api';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Github,
  Instagram,
  Linkedin,
  Phone,
  Sparkles,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setOnboardingCompleted, setUser, user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [branch, setBranch] = useState('CSE');
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cgpa, setCgpa] = useState<string>('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (val === '') {
      setPhoneNumber('');
      return;
    }

    // Keep only '+' and digits
    let sanitized = val.replace(/[^\d+]/g, '');

    // If user starts typing digit, prepend +91
    if (sanitized && !sanitized.startsWith('+')) {
      if (sanitized.startsWith('91')) {
        sanitized = '+' + sanitized;
      } else {
        sanitized = '+91' + sanitized;
      }
    }

    // Ensure it always has +91 when typing if it starts with +
    if (sanitized.startsWith('+') && !sanitized.startsWith('+91')) {
      if (sanitized.length >= 3) {
        sanitized = '+91' + sanitized.substring(3);
      }
    }

    // Limit to 13 characters max
    if (sanitized.length <= 13) {
      setPhoneNumber(sanitized);
    }
  };

  const handleCgpaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Remove any character that is not a digit or a dot
    val = val.replace(/[^\d.]/g, '');

    // Allow at most one dot
    const dots = val.split('.');
    if (dots.length > 2) {
      val = dots[0] + '.' + dots.slice(1).join('');
    }

    // Split into integer and decimal parts
    if (val.includes('.')) {
      let [integerPart, decimalPart] = val.split('.');
      if (integerPart.length > 2) {
        integerPart = integerPart.slice(0, 2);
      }
      if (decimalPart.length > 2) {
        decimalPart = decimalPart.slice(0, 2);
      }
      val = integerPart + '.' + decimalPart;
    } else {
      // If no dot, limit to 2 digits.
      // If the user types a 3rd digit, automatically insert dot
      if (val.length > 2) {
        val = val.slice(0, 2) + '.' + val.slice(2, 3);
      }
    }

    if (val.length <= 5) {
      setCgpa(val);
    }
  };

  const nextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!phoneNumber.trim()) {
        setErrorMsg('Please enter a valid phone number.');
        return;
      }
      const phoneRegex = /^\+91\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setErrorMsg('Phone number must start with +91 followed by exactly 10 digits (e.g. +919876543210).');
        return;
      }
    }
    if (step === 2) {
      if (cgpa) {
        const cgpaRegex = /^\d{2}\.\d{2}$/;
        if (!cgpaRegex.test(cgpa)) {
          setErrorMsg('CGPA must be in xx.xx format (e.g. 08.75 or 10.00).');
          return;
        }
        const parsed = parseFloat(cgpa);
        if (isNaN(parsed) || parsed < 0 || parsed > 10) {
          setErrorMsg('CGPA must be between 00.00 and 10.00.');
          return;
        }
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Final checks
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setErrorMsg('Phone number must start with +91 followed by exactly 10 digits.');
      setLoading(false);
      setStep(1);
      return;
    }

    if (cgpa) {
      const cgpaRegex = /^\d{2}\.\d{2}$/;
      if (!cgpaRegex.test(cgpa)) {
        setErrorMsg('CGPA must be in xx.xx format (e.g. 08.75 or 10.00).');
        setLoading(false);
        setStep(2);
        return;
      }
      const parsed = parseFloat(cgpa);
      if (isNaN(parsed) || parsed < 0 || parsed > 10) {
        setErrorMsg('CGPA must be between 00.00 and 10.00.');
        setLoading(false);
        setStep(2);
        return;
      }
    }

    try {
      const payload = {
        branch,
        section,
        academic_year: academicYear,
        phone_number: phoneNumber,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        instagram_url: instagramUrl || null,
      };

      const res = await api.post('/onboarding/student', payload);
      const updatedProfile = res.data;

      // Update AuthContext user profile state
      if (user) {
        setUser({
          ...user,
          profile: updatedProfile,
        });
      }

      setOnboardingCompleted(true);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err, 'Onboarding submission failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl space-y-8 relative overflow-hidden">
        {/* Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800/50 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Complete Student Onboarding
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome to CSMD DLIDES CLUB</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Set up your academic profile to unlock event registrations and certificate issuance.
          </p>
        </div>

        {/* Progress Bar Steps */}
        <div className="relative z-10 flex items-center justify-between max-w-md mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                step >= 1
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-4 ring-sky-950'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Academic Info</span>
          </div>

          <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step >= 2 ? 'bg-sky-600' : 'bg-slate-800'}`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                step >= 2
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-4 ring-sky-950'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Performance</span>
          </div>

          <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step >= 3 ? 'bg-sky-600' : 'bg-slate-800'}`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                step >= 3
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-4 ring-sky-950'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              3
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Social Links</span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* STEP 1: Academic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Department / Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  >
                    <option value="CSE">Computer Science & Eng (CSE)</option>
                    <option value="CSM">CSE - AI & ML (CSM)</option>
                    <option value="CSD">CSE - Data Science (CSD)</option>
                    <option value="ECE">Electronics & Comm (ECE)</option>
                    <option value="EEE">Electrical & Electronics (EEE)</option>
                    <option value="IT">Information Tech (IT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="+919876543210"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Must start with +91 followed by exactly 10 digits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Performance Credentials */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  CGPA (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Award className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={cgpa}
                    onChange={handleCgpaChange}
                    placeholder="e.g. 08.75 or 10.00"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be in xx.xx format (e.g. 08.75 or 10.00) between 00.00 and 10.00.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Social Links */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  LinkedIn Profile URL (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Linkedin className="w-4 h-4 text-sky-400" />
                  </div>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  GitHub Profile URL (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Github className="w-4 h-4 text-purple-400" />
                  </div>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Instagram Handle (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Instagram className="w-4 h-4 text-rose-400" />
                  </div>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="@username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-sky-600/30 flex items-center gap-2 ml-auto"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 ml-auto disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Onboarding
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
