import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, Plus, Filter, AlertTriangle,
  Sparkles, CheckCircle2, X, ChevronLeft, ChevronRight, User, MapPin, Search
} from 'lucide-react';
import { apiService } from '../../services/api';
import {
  Appointment, Patient, Doctor, Therapist, TreatmentRoom,
  Therapy, SlotSuggestion, AppointmentStatus
} from '../../types';
import { Badge } from '../../components/common/Badge';

export const AppointmentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [rooms, setRooms] = useState<TreatmentRoom[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState('All');

  // Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // AI Slot Recommender State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTherapyId, setAiTherapyId] = useState<number | undefined>();
  const [aiDate, setAiDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiTimePreference, setAiTimePreference] = useState('Morning');
  const [aiSuggestions, setAiSuggestions] = useState<SlotSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patient_id: undefined as number | undefined,
    doctor_id: undefined as number | undefined,
    therapist_id: undefined as number | undefined,
    therapy_id: undefined as number | undefined,
    room_id: undefined as number | undefined,
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    duration_minutes: 60,
    status: 'Scheduled' as AppointmentStatus,
    notes: '',
  });

  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictAlternatives, setConflictAlternatives] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
    if (searchParams.get('book') === 'true') {
      setShowBookingModal(true);
    }
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [appts, pts, docs, thps, rms, ths] = await Promise.all([
        apiService.getAppointments(),
        apiService.getPatients(),
        apiService.getDoctors(),
        apiService.getTherapists(),
        apiService.getRooms(),
        apiService.getTherapies(),
      ]);
      setAppointments(appts);
      setPatients(pts);
      setDoctors(docs);
      setTherapists(thps);
      setRooms(rms);
      setTherapies(ths);

      if (pts.length > 0 && !formData.patient_id) {
        setFormData((prev) => ({
          ...prev,
          patient_id: pts[0].id,
          doctor_id: docs[0]?.id,
          therapist_id: thps[0]?.id,
          therapy_id: ths[0]?.id,
          room_id: rms[0]?.id,
        }));
        setAiTherapyId(ths[0]?.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setConflictAlternatives([]);

    try {
      if (editingAppointment) {
        await apiService.updateAppointment(editingAppointment.id, formData);
      } else {
        await apiService.createAppointment(formData);
      }
      setShowBookingModal(false);
      setEditingAppointment(null);
      loadAllData();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError(err.response?.data?.detail || 'Scheduling conflict detected.');
        // Dry-run to fetch alternative available slots
        if (formData.therapy_id && formData.therapist_id && formData.room_id) {
          const check = await apiService.checkConflict({
            date: formData.date,
            start_time: formData.start_time,
            duration_minutes: formData.duration_minutes,
            therapist_id: formData.therapist_id,
            room_id: formData.room_id,
            therapy_id: formData.therapy_id,
          });
          if (check.alternatives) {
            setConflictAlternatives(check.alternatives);
          }
        }
      } else {
        alert(err.response?.data?.detail || 'Failed to save appointment.');
      }
    }
  };

  const handleFetchAISuggestions = async () => {
    if (!aiTherapyId) return;
    setAiLoading(true);
    try {
      const res = await apiService.recommendSlots({
        therapy_id: aiTherapyId,
        preferred_date: aiDate,
        preferred_time_of_day: aiTimePreference,
      });
      setAiSuggestions(res.suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAISlot = (slot: SlotSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      date: slot.date,
      start_time: slot.start_time,
      therapist_id: slot.therapist_id,
      room_id: slot.room_id,
      therapy_id: aiTherapyId || prev.therapy_id,
    }));
    setShowAIModal(false);
    setShowBookingModal(true);
  };

  const handleSelectAlternative = (alt: any) => {
    setFormData((prev) => ({
      ...prev,
      start_time: alt.start_time,
      therapist_id: alt.therapist_id,
      room_id: alt.room_id,
    }));
    setConflictError(null);
    setConflictAlternatives([]);
  };

  const handleStatusChange = async (apptId: number, newStatus: string) => {
    try {
      await apiService.updateAppointment(apptId, { status: newStatus as any });
      loadAllData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleCancelAppointment = async (apptId: number) => {
    const reason = prompt('Please enter cancellation reason (optional):') || 'Patient request';
    try {
      await apiService.updateAppointment(apptId, {
        status: 'Cancelled' as any,
        cancellation_reason: reason,
      });
      loadAllData();
    } catch (err) {
      alert('Failed to cancel appointment.');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (viewMode === 'calendar' && a.date !== selectedDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Appointments & Therapy Scheduling
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Real-time conflict detection & transparent AI-assisted slot recommendation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowAIModal(true);
              handleFetchAISuggestions();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FAF7EF] hover:bg-[#F5EFEB] border border-[#B99756] text-[#8F6F33] text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles size={16} className="text-[#B99756]" /> AI Slot Finder
          </button>
          <button
            onClick={() => {
              setEditingAppointment(null);
              setConflictError(null);
              setConflictAlternatives([]);
              setShowBookingModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} /> Book Session
          </button>
        </div>
      </div>

      {/* Date Switcher & View Mode Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5DFD3] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-[#73695E] flex items-center gap-1">
            <CalendarIcon size={14} /> Schedule Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7EF] border border-[#E5DFD3] rounded-xl text-xs sm:text-sm text-[#40372D] font-medium focus:outline-none focus:border-[#244C3A]"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#B99756] hover:underline"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#FAF7EF] p-1 rounded-xl border border-[#E5DFD3] text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-[#244C3A] text-white' : 'text-[#73695E]'
              }`}
            >
              Day Slots
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'list' ? 'bg-[#244C3A] text-white' : 'text-[#73695E]'
              }`}
            >
              All Appointments
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7EF] border border-[#E5DFD3] rounded-xl text-xs sm:text-sm text-[#40372D] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointment Cards / Schedule View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-full text-center py-10 text-xs text-[#73695E]">
            Loading scheduled therapies...
          </p>
        ) : filteredAppointments.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-3xl border border-[#E5DFD3] text-center">
            <p className="text-sm font-semibold text-[#244C3A]">No sessions booked for {selectedDate}</p>
            <p className="text-xs text-[#73695E] mt-1">Use the "Book Session" button or run the "AI Slot Finder".</p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white p-5 rounded-2xl border border-[#E5DFD3] hover:border-[#244C3A]/40 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#B99756]">
                    {appt.appointment_number}
                  </span>
                  <Badge variant="status">{appt.status}</Badge>
                </div>

                <h3 className="text-base font-bold text-[#244C3A] leading-tight">
                  {appt.therapy?.name}
                </h3>
                <p className="text-xs font-semibold text-[#40372D] mt-1 flex items-center gap-1.5">
                  <User size={13} className="text-[#73695E]" />
                  {appt.patient?.full_name} ({appt.patient?.patient_id})
                </p>

                <div className="mt-3 p-3 rounded-xl bg-[#FAF7EF] border border-[#E5DFD3]/60 space-y-1.5 text-xs text-[#73695E]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> Time:
                    </span>
                    <span className="font-bold text-[#40372D]">
                      {appt.start_time} - {appt.end_time} ({appt.duration_minutes} min)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> Room:
                    </span>
                    <span className="font-semibold text-[#40372D]">
                      {appt.room?.name} ({appt.room?.room_number})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Therapist:</span>
                    <span className="font-semibold text-[#40372D]">{appt.therapist?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Consulting Doctor:</span>
                    <span className="font-medium text-[#40372D]">{appt.doctor?.full_name}</span>
                  </div>
                </div>

                {appt.notes && (
                  <p className="text-[11px] text-[#73695E] mt-2 italic truncate">
                    Notes: {appt.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#E5DFD3]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#73695E] font-medium">Status:</span>
                  <select
                    value={appt.status}
                    onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                    className="px-2 py-1 bg-[#FAF7EF] border border-[#E5DFD3] rounded-lg text-xs font-semibold text-[#244C3A] focus:outline-none cursor-pointer"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  {appt.status !== 'Completed' && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'Completed')}
                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Complete
                    </button>
                  )}
                  {appt.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'Cancelled')}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  {appt.status !== 'Scheduled' && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'Scheduled')}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Re-Schedule
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Modal with Backend Conflict Handling */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                {editingAppointment ? 'Reschedule Appointment' : 'Schedule Panchakarma Session'}
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-1 rounded-lg text-[#73695E] hover:text-[#244C3A]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conflict Alert Box with Alternatives */}
            {conflictError && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                  <span>{conflictError}</span>
                </div>
                {conflictAlternatives.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-rose-200">
                    <p className="font-semibold text-rose-900 mb-1.5">
                      Available Alternative Slots on {formData.date}:
                    </p>
                    <div className="space-y-1.5">
                      {conflictAlternatives.map((alt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectAlternative(alt)}
                          className="w-full text-left px-3 py-1.5 bg-white border border-rose-200 hover:border-emerald-600 rounded-lg text-[11px] font-medium text-[#40372D] flex items-center justify-between"
                        >
                          <span>
                            {alt.start_time} - {alt.end_time} • {alt.therapist_name} • {alt.room_name}
                          </span>
                          <span className="font-bold text-emerald-700">Choose Slot →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdate} className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Select Patient *</label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.patient_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Prescribing Doctor *</label>
                  <select
                    required
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Panchakarma Therapy *</label>
                  <select
                    required
                    value={formData.therapy_id}
                    onChange={(e) => {
                      const thId = parseInt(e.target.value);
                      const chosen = therapies.find((t) => t.id === thId);
                      setFormData({
                        ...formData,
                        therapy_id: thId,
                        duration_minutes: chosen?.default_duration_minutes || 60,
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    {therapies.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.name} ({th.default_duration_minutes} min) - ₹{th.indicative_price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Therapist *</label>
                  <select
                    required
                    value={formData.therapist_id}
                    onChange={(e) => setFormData({ ...formData, therapist_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.working_hours_start}-{t.working_hours_end})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Treatment Room *</label>
                  <select
                    required
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.room_number}: {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Session Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Start Time (HH:MM) *</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#40372D] mb-1">Session Clinical Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instructions for therapist (oil temp, precautions)..."
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5DFD3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 border border-[#E5DFD3] rounded-xl text-xs font-semibold text-[#73695E] hover:bg-[#FAF7EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#244C3A] hover:bg-[#1A382B] text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  Save & Validate Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explainable AI Slot Recommender Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B99756]/40 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-[#B99756]" />
                <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                  AI Scheduling Recommender
                </h2>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-1 rounded-lg text-[#73695E] hover:text-[#244C3A]"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-[#73695E] mt-2">
              Analyzes therapist certification, room apparatus suitability, workload balancing, and scikit-learn
              regression fitness scores to suggest transparently ranked, conflict-free slots.
            </p>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3] text-xs">
              <div>
                <label className="block font-semibold text-[#40372D] mb-1">Therapy</label>
                <select
                  value={aiTherapyId}
                  onChange={(e) => setAiTherapyId(parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                >
                  {therapies.map((th) => (
                    <option key={th.id} value={th.id}>{th.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#40372D] mb-1">Date</label>
                <input
                  type="date"
                  value={aiDate}
                  onChange={(e) => setAiDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#40372D] mb-1">Time Preference</label>
                <select
                  value={aiTimePreference}
                  onChange={(e) => setAiTimePreference(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                >
                  <option value="Any">Any Time</option>
                  <option value="Morning">Morning (08:30 - 12:00)</option>
                  <option value="Afternoon">Afternoon (12:00 - 15:30)</option>
                  <option value="Evening">Evening (15:30 - 18:00)</option>
                </select>
              </div>

              <div className="col-span-full flex justify-end">
                <button
                  type="button"
                  onClick={handleFetchAISuggestions}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-[#244C3A] text-white rounded-xl font-semibold shadow-xs hover:bg-[#1A382B] transition-colors"
                >
                  {aiLoading ? 'Computing Rankings...' : 'Find Ranked Slots'}
                </button>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3">
              <h3 className="font-bold text-[#244C3A] text-xs uppercase tracking-wider">
                Recommended Slots ({aiSuggestions.length})
              </h3>
              {aiLoading ? (
                <div className="text-center py-8 text-xs text-[#73695E] animate-pulse">
                  Evaluating scheduling constraints and fitness scores...
                </div>
              ) : aiSuggestions.length === 0 ? (
                <p className="text-center py-6 text-xs text-[#73695E]">
                  No matching slots found. Try another date or time window.
                </p>
              ) : (
                aiSuggestions.map((s, idx) => (
                  <div
                    key={s.slot_id}
                    className="p-4 rounded-2xl border border-[#E5DFD3] hover:border-[#244C3A] bg-white transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#244C3A]">
                          {s.start_time} - {s.end_time}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B99756]/20 text-[#8F6F33]">
                          Rank #{idx + 1} • {s.confidence_level} ({Math.round(s.score * 100)}% fit)
                        </span>
                      </div>
                      <p className="font-medium text-[#40372D]">
                        Therapist: <span className="font-semibold">{s.therapist_name}</span> • Room: <span className="font-semibold">{s.room_name}</span>
                      </p>
                      {/* Explainability Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {s.explanation.map((exp, eIdx) => (
                          <span
                            key={eIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7EF] border border-[#E5DFD3] text-[#73695E]"
                          >
                            ✓ {exp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyAISlot(s)}
                      className="px-4 py-2 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-end sm:self-auto cursor-pointer"
                    >
                      Book This Slot
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
