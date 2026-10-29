import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Activity, Sparkles, IndianRupee, AlertTriangle,
  ArrowUpRight, Clock, Plus, ShieldCheck, ChevronRight, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiService } from '../../services/api';
import { DashboardStats } from '../../types';
import { Badge } from '../../components/common/Badge';

const AYURVEDA_COLORS = ['#244C3A', '#66856A', '#B99756', '#DFC894', '#BD6B46', '#8F6F33'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-[#E5DFD3]/40 rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-[#E5DFD3]/30 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Patients',
      value: stats?.total_patients ?? 0,
      icon: Users,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      action: () => navigate('/patients'),
    },
    {
      title: 'Total Appointments',
      value: stats?.total_appointments ?? 0,
      icon: Calendar,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      action: () => navigate('/appointments'),
    },
    {
      title: 'Completed Treatments',
      value: stats?.completed_treatments ?? 0,
      icon: CheckCircle2,
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      action: () => navigate('/appointments'),
    },
    {
      title: 'Active Treatments',
      value: stats?.ongoing_treatments_count ?? 0,
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      action: () => navigate('/treatment-progress'),
    },
    {
      title: 'Available Therapists',
      value: stats?.available_therapists_count ?? 0,
      icon: Sparkles,
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      action: () => navigate('/therapists'),
    },
    {
      title: 'Pending Invoices',
      value: `₹${(stats?.pending_payments_total ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      action: () => navigate('/billing'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#244C3A] via-[#2A5742] to-[#1E3F30] p-6 sm:p-8 rounded-3xl text-white shadow-lg shadow-[#244C3A]/10 border border-[#B99756]/30">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B99756]/20 border border-[#B99756]/40 text-[#DFC894] text-xs font-semibold mb-2">
            <ShieldCheck size={14} /> Ministry of AYUSH SIH25023
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Hospital Overview & Treatment Console
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 mt-1 max-w-xl">
            Streamlining Panchakarma patient history, therapy conflict prevention, herbal dispensary, and clinical progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/patients?register=true')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B99756] hover:bg-[#8F6F33] text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
          >
            <Plus size={16} /> Register Patient
          </button>
          <button
            onClick={() => navigate('/appointments?book=true')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
          >
            <Calendar size={16} /> Schedule Session
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className="bg-white p-4 rounded-2xl border border-[#E5DFD3] hover:border-[#244C3A]/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`p-2 rounded-xl border ${kpi.color}`}>
                  <Icon size={18} />
                </span>
                <ArrowUpRight size={14} className="text-[#73695E] group-hover:text-[#244C3A] transition-colors" />
              </div>
              <p className="text-xs text-[#73695E] font-medium">{kpi.title}</p>
              <p className="text-xl font-bold text-[#40372D] mt-0.5 tracking-tight">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Appointments Volume */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Weekly Therapy Volume
              </h2>
              <p className="text-xs text-[#73695E]">Total booked vs completed therapy sessions (7-day trend)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weekly_appointments || []}>
                <XAxis dataKey="day" stroke="#73695E" fontSize={12} tickLine={false} />
                <YAxis stroke="#73695E" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7EF',
                    borderColor: '#E5DFD3',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" name="Total Scheduled" fill="#66856A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#244C3A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Therapy Distribution Pie */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
              Therapy Distribution
            </h2>
            <p className="text-xs text-[#73695E]">Active Panchakarma procedures</p>
          </div>
          <div className="h-56 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.therapy_distribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {(stats?.therapy_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={AYURVEDA_COLORS[index % AYURVEDA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7EF',
                    borderColor: '#E5DFD3',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#E5DFD3]/60 text-xs">
            {(stats?.therapy_distribution || []).slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: AYURVEDA_COLORS[idx % AYURVEDA_COLORS.length] }}
                />
                <span className="text-[#40372D] truncate font-medium">{item.name}</span>
                <span className="text-[#73695E] ml-auto font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Appointments & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Upcoming Therapy Sessions
              </h2>
              <p className="text-xs text-[#73695E]">Next scheduled patient sessions</p>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs font-semibold text-[#B99756] hover:underline flex items-center gap-1"
            >
              View Calendar <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-[#E5DFD3]/60">
            {stats?.upcoming_appointments && stats.upcoming_appointments.length > 0 ? (
              stats.upcoming_appointments.map((appt) => (
                <div key={appt.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7EF] border border-[#E5DFD3] flex flex-col items-center justify-center text-[#244C3A]">
                      <Clock size={16} />
                      <span className="text-[10px] font-bold mt-0.5">{appt.start_time}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#40372D]">
                        {appt.patient?.full_name || 'Patient'}
                      </p>
                      <p className="text-[11px] text-[#73695E]">
                        {appt.therapy?.name} • Room: {appt.room?.room_number} • Dr: {appt.doctor?.full_name?.split(' ')[1]}
                      </p>
                    </div>
                  </div>
                  <Badge variant="status">{appt.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-xs text-[#73695E]">No upcoming appointments found.</p>
            )}
          </div>
        </div>

        {/* Recent Registered Patients */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Recent Patient Registrations
              </h2>
              <p className="text-xs text-[#73695E]">Newly added clinical records</p>
            </div>
            <button
              onClick={() => navigate('/patients')}
              className="text-xs font-semibold text-[#B99756] hover:underline flex items-center gap-1"
            >
              All Patients <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-[#E5DFD3]/60">
            {stats?.recent_patients && stats.recent_patients.length > 0 ? (
              stats.recent_patients.map((pat) => (
                <div key={pat.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7EF] border border-[#E5DFD3] flex items-center justify-center text-xs font-bold text-[#244C3A]">
                      {pat.patient_id.split('-')[2] || 'PT'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#40372D]">{pat.full_name}</p>
                      <p className="text-[11px] text-[#73695E]">
                        {pat.age} yrs • {pat.gender} • {pat.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="dosha">{pat.prakriti}</Badge>
                    <Badge variant="status">{pat.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-xs text-[#73695E]">No recent patients recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
