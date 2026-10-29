import React, { useState, useEffect } from 'react';
import { Stethoscope, Sparkles, Phone, Mail, Award, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { Doctor, Therapist } from '../../types';
import { Badge } from '../../components/common/Badge';

export const DoctorsTherapistsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'doctors' | 'therapists'>('doctors');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, thps, wl] = await Promise.all([
        apiService.getDoctors(),
        apiService.getTherapists(),
        apiService.getTherapistWorkload(),
      ]);
      setDoctors(docs);
      setTherapists(thps);
      setWorkloads(wl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Practitioners & Therapy Team
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Ayurvedic physicians (Vaidyas) and certified Panchakarma therapists
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#FAF7EF] p-1 rounded-2xl border border-[#E5DFD3] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'doctors' ? 'bg-[#244C3A] text-white shadow-xs' : 'text-[#73695E] hover:text-[#244C3A]'
            }`}
          >
            Doctors ({doctors.length})
          </button>
          <button
            onClick={() => setActiveTab('therapists')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'therapists' ? 'bg-[#244C3A] text-white shadow-xs' : 'text-[#73695E] hover:text-[#244C3A]'
            }`}
          >
            Therapists & Workload ({therapists.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12 text-xs text-[#73695E]">Loading practitioner directories...</p>
      ) : activeTab === 'doctors' ? (
        /* Doctors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#244C3A] to-[#66856A] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {doc.full_name.split(' ')[1]?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                      {doc.full_name}
                    </h3>
                    <p className="text-xs font-semibold text-[#B99756]">{doc.specialization}</p>
                    <p className="text-[11px] text-[#73695E]">{doc.qualification}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#73695E] bg-[#FAF7EF] p-3.5 rounded-2xl border border-[#E5DFD3]/60">
                  <div className="flex items-center justify-between">
                    <span>Registration No:</span>
                    <span className="font-mono font-semibold text-[#40372D]">{doc.registration_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Experience:</span>
                    <span className="font-bold text-[#40372D]">{doc.experience_years} years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Consultation Fee:</span>
                    <span className="font-bold text-emerald-800">₹{doc.consultation_fee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Contact:</span>
                    <span className="font-medium text-[#40372D]">{doc.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DFD3]/60 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 size={14} /> Active Practitioner
                </span>
                <span className="text-[#73695E]">{doc.email}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Therapists & Live Workload Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workloads.map((wl) => (
            <div
              key={wl.therapist_id}
              className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#B99756] to-[#DFC894] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {wl.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                        {wl.full_name}
                      </h3>
                      <p className="text-xs text-[#73695E]">{wl.qualification}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      wl.assigned_sessions_count >= 4
                        ? 'bg-rose-100 text-rose-800'
                        : wl.assigned_sessions_count >= 2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Today: {wl.assigned_sessions_count} Session(s)
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#73695E] bg-[#FAF7EF] p-3.5 rounded-2xl border border-[#E5DFD3]/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Clock size={13} /> Working Hours:</span>
                    <span className="font-bold text-[#40372D]">{wl.working_hours}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-[#40372D] mb-1">Certified Panchakarma Procedures:</span>
                    <div className="flex flex-wrap gap-1">
                      {wl.supported_therapies.split(',').map((s: string, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-white border border-[#E5DFD3] text-[10px] text-[#244C3A] font-medium"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's Schedule Timeline for Therapist */}
                {wl.sessions && wl.sessions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold text-[#244C3A] mb-1">Today's Assigned Bookings:</p>
                    <div className="space-y-1">
                      {wl.sessions.map((sess: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white border border-[#E5DFD3] text-[11px]"
                        >
                          <span className="font-mono font-semibold text-[#B99756]">{sess.appointment_number}</span>
                          <span className="font-medium text-[#40372D]">{sess.start_time} - {sess.end_time}</span>
                          <span className="text-[10px] text-[#73695E]">{sess.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DFD3]/60 flex items-center justify-between text-xs text-[#73695E]">
                <span>Status: {wl.is_available ? 'Available for booking' : 'Off duty'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
