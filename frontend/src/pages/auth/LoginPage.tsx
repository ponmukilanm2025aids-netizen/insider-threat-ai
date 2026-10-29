import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LotusLogo } from '../../components/common/LotusLogo';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@ayursutra.hospital');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  const demoCards = [
    {
      role: 'ADMIN',
      title: 'Hospital Director / Admin',
      email: 'admin@ayursutra.hospital',
      desc: 'Complete oversight, role permissions, billing audits, & inventory',
      color: 'border-[#244C3A] bg-white',
    },
    {
      role: 'DOCTOR',
      title: 'Senior Vaidya / Doctor',
      email: 'doctor@ayursutra.hospital',
      desc: 'Diagnosis, Panchakarma protocols, digital prescriptions, & diet plans',
      color: 'border-[#B99756] bg-white',
    },
    {
      role: 'THERAPIST',
      title: 'Lead Panchakarma Therapist',
      email: 'therapist@ayursutra.hospital',
      desc: 'Daily treatment schedule, session vitals, attendance, & progress notes',
      color: 'border-[#66856A] bg-white',
    },
    {
      role: 'RECEPTIONIST',
      title: 'Front Desk / Receptionist',
      email: 'reception@ayursutra.hospital',
      desc: 'Patient registration, AI appointment scheduling, & invoice generation',
      color: 'border-[#BD6B46] bg-white',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7EF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Ayurvedic Botanical Geometry */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#244C3A]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#B99756]/10 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center mb-4">
          <LotusLogo size={52} subtitle="Integrated Ayurveda & Panchakarma System" />
        </div>
        <h1
          className="text-3xl font-bold text-[#244C3A] tracking-tight mt-2"
          style={{ fontFamily: 'Georgia, Cambria, serif' }}
        >
          AyurSutra Portal
        </h1>
        <p className="text-xs sm:text-sm text-[#73695E] mt-1.5">
          Ministry of AYUSH Problem Statement SIH25023
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg shadow-[#244C3A]/5 rounded-3xl border border-[#E5DFD3]">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#40372D] mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73695E]" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="doctor@ayursutra.hospital"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7EF]/50 border border-[#E5DFD3] rounded-xl text-sm text-[#40372D] focus:outline-none focus:border-[#244C3A] focus:ring-1 focus:ring-[#244C3A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#40372D] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73695E]" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FAF7EF]/50 border border-[#E5DFD3] rounded-xl text-sm text-[#40372D] focus:outline-none focus:border-[#244C3A] focus:ring-1 focus:ring-[#244C3A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#73695E] hover:text-[#244C3A]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#244C3A] hover:bg-[#1A382B] shadow-md shadow-[#244C3A]/20 transition-all cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} className="text-[#DFC894]" />
                  <span>Secure Clinical Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Profiles */}
          <div className="mt-8 pt-6 border-t border-[#E5DFD3]/80">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={14} className="text-[#B99756]" />
              <span className="text-xs font-bold text-[#244C3A]">
                1-Click Demo Staff Profiles:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoCards.map((card) => (
                <button
                  key={card.role}
                  type="button"
                  onClick={() => handleSelectDemo(card.email)}
                  className={`p-2.5 text-left rounded-xl border text-xs transition-all hover:scale-[1.02] cursor-pointer ${
                    email === card.email
                      ? 'border-[#244C3A] bg-[#244C3A]/5 ring-1 ring-[#244C3A]'
                      : 'border-[#E5DFD3] bg-[#FAF7EF]/60 hover:bg-[#FAF7EF]'
                  }`}
                >
                  <p className="font-bold text-[#244C3A] truncate">{card.role}</p>
                  <p className="text-[11px] text-[#73695E] truncate">{card.email.split('@')[0]}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#73695E] text-center mt-3">
              Default password for all accounts: <span className="font-mono font-semibold">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
