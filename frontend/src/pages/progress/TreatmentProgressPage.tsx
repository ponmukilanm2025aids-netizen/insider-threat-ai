import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Calendar, CheckCircle2, Heart, Activity, FileText, User, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { TreatmentPlan, TreatmentSession, Patient, Doctor, Therapist, Therapy } from '../../types';
import { Badge } from '../../components/common/Badge';

export const TreatmentProgressPage: React.FC = () => {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Plan Form
  const [planForm, setPlanForm] = useState({
    patient_id: undefined as number | undefined,
    doctor_id: undefined as number | undefined,
    diagnosis: 'Cervical Spondylosis (Manya Stambha)',
    primary_dosha: 'Vata',
    goal: 'Soothe Vata hypertonicity, relieve radiating pain, and restore restful sleep.',
    total_sessions: 7,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    special_instructions: 'Daily warm Ksheerabala Thailam application prior to session.',
  });

  // Session Form
  const [sessionForm, setSessionForm] = useState({
    session_number: 1,
    session_date: new Date().toISOString().split('T')[0],
    attendance: 'Present',
    vitals: 'BP: 120/80 mmHg, Pulse: 72 bpm',
    therapist_notes: 'Maintained continuous uniform stream. Patient was calm and cooperative.',
    doctor_observations: 'Marked reduction in trapezius muscle spasm.',
    patient_feedback: 'Significant relief in neck stiffness.',
    pain_score_before: 6,
    pain_score_after: 3,
    therapist_id: undefined as number | undefined,
    therapy_id: undefined as number | undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pl, pts, docs, thps, ths] = await Promise.all([
        apiService.getTreatmentPlans(),
        apiService.getPatients(),
        apiService.getDoctors(),
        apiService.getTherapists(),
        apiService.getTherapies(),
      ]);
      setPlans(pl);
      setPatients(pts);
      setDoctors(docs);
      setTherapists(thps);
      setTherapies(ths);

      if (pl.length > 0) {
        setSelectedPlan(pl[0]);
        loadSessions(pl[0].id);
      }

      if (pts.length > 0 && !planForm.patient_id) {
        setPlanForm((prev) => ({
          ...prev,
          patient_id: pts[0].id,
          doctor_id: docs[0]?.id,
        }));
      }
      if (thps.length > 0 && !sessionForm.therapist_id) {
        setSessionForm((prev) => ({
          ...prev,
          therapist_id: thps[0].id,
          therapy_id: ths[0]?.id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (planId: number) => {
    try {
      const sess = await apiService.getTreatmentSessions({ plan_id: planId });
      setSessions(sess);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPlan = (plan: TreatmentPlan) => {
    setSelectedPlan(plan);
    loadSessions(plan.id);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createTreatmentPlan(planForm);
      setShowPlanModal(false);
      loadData();
    } catch (err) {
      alert('Failed to create treatment plan.');
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      await apiService.logTreatmentSession({
        ...sessionForm,
        treatment_plan_id: selectedPlan.id,
        patient_id: selectedPlan.patient_id,
        session_number: (sessions.length + 1),
      });
      setShowSessionModal(false);
      loadData();
      loadSessions(selectedPlan.id);
    } catch (err) {
      alert('Failed to log treatment session.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Treatment Progress Tracking (Chikitsa Krama)
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Multi-day Panchakarma regimens, session attendance, vitals, and pain relief scoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedPlan && (
            <button
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FAF7EF] hover:bg-[#F5EFEB] border border-[#244C3A] text-[#244C3A] text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Activity size={16} /> Log Session Notes
            </button>
          )}
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} /> New Regimen Plan
          </button>
        </div>
      </div>

      {/* Two Column Layout: Plan List vs Plan Details & Session Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Treatment Plans List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#244C3A] uppercase tracking-wider">
            Active Regimens ({plans.length})
          </h2>
          <div className="space-y-3">
            {plans.map((pl) => {
              const patientObj = patients.find((p) => p.id === pl.patient_id);
              const isSelected = selectedPlan?.id === pl.id;
              const progressPct = Math.round((pl.completed_sessions / pl.total_sessions) * 100);

              return (
                <div
                  key={pl.id}
                  onClick={() => handleSelectPlan(pl)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#244C3A] shadow-md ring-1 ring-[#244C3A]'
                      : 'bg-white/80 border-[#E5DFD3] hover:border-[#244C3A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#B99756]">{pl.plan_number}</span>
                    <Badge variant="status">{pl.status}</Badge>
                  </div>
                  <h3 className="font-bold text-[#244C3A] text-sm leading-tight">{pl.diagnosis}</h3>
                  <p className="text-xs text-[#40372D] font-medium mt-1">
                    Patient: {patientObj?.full_name || 'Patient'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-[#73695E] mb-1">
                      <span>Completed Sessions</span>
                      <span className="font-bold text-[#244C3A]">
                        {pl.completed_sessions} of {pl.total_sessions} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF7EF] h-2 rounded-full overflow-hidden border border-[#E5DFD3]/60">
                      <div
                        className="bg-gradient-to-r from-[#66856A] to-[#244C3A] h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Regimen Details & Session History */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPlan ? (
            <>
              {/* Regimen Info Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5DFD3]/60 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#B99756]">{selectedPlan.plan_number}</span>
                    <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                      {selectedPlan.diagnosis}
                    </h2>
                  </div>
                  <Badge variant="dosha">{selectedPlan.primary_dosha}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#73695E]">
                  <div>
                    <span className="font-semibold block text-[#40372D]">Clinical Goal:</span>
                    <p className="mt-0.5 leading-relaxed">{selectedPlan.goal}</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-[#40372D]">Doctor Special Instructions:</span>
                    <p className="mt-0.5 leading-relaxed">{selectedPlan.special_instructions || 'Standard Panchakarma precautions.'}</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-[#40372D]">Schedule Duration:</span>
                    <p className="mt-0.5">{selectedPlan.start_date} to {selectedPlan.end_date}</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-[#40372D]">Consulting Doctor:</span>
                    <p className="mt-0.5 font-bold text-[#244C3A]">{selectedPlan.doctor?.full_name}</p>
                  </div>
                </div>
              </div>

              {/* Sessions Timeline */}
              <div className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                    Session Records & Clinical Logs ({sessions.length})
                  </h3>
                </div>

                <div className="space-y-4">
                  {sessions.length === 0 ? (
                    <p className="text-center py-6 text-xs text-[#73695E]">
                      No sessions logged yet for this regimen. Click "Log Session Notes" above.
                    </p>
                  ) : (
                    sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-4 rounded-2xl border border-[#E5DFD3] bg-[#FAF7EF]/40 text-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#244C3A] text-sm">
                            Session #{sess.session_number} • {sess.session_date}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {sess.attendance}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-[#73695E]">
                          <span><strong>Vitals:</strong> {sess.vitals}</span>
                          <span><strong>Therapist:</strong> {sess.therapist?.full_name}</span>
                          <span>
                            <strong>Pain Score:</strong> Before: {sess.pain_score_before}/10 → After: <strong className="text-emerald-700">{sess.pain_score_after}/10</strong>
                          </span>
                        </div>

                        {sess.therapist_notes && (
                          <div className="p-2.5 bg-white rounded-xl border border-[#E5DFD3]/60">
                            <span className="font-bold text-[#40372D] block">Therapist Notes:</span>
                            <p className="text-[#73695E] mt-0.5">{sess.therapist_notes}</p>
                          </div>
                        )}

                        {sess.doctor_observations && (
                          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                            <span className="font-bold text-emerald-900 block">Doctor Observation:</span>
                            <p className="text-emerald-800 mt-0.5">{sess.doctor_observations}</p>
                          </div>
                        )}

                        {sess.patient_feedback && (
                          <p className="italic text-[#73695E]">
                            Patient Feedback: "{sess.patient_feedback}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center py-12 text-xs text-[#73695E]">Select a regimen to inspect session history.</p>
          )}
        </div>
      </div>

      {/* New Treatment Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Create New Panchakarma Regimen Plan
              </h2>
              <button onClick={() => setShowPlanModal(false)} className="text-[#73695E] hover:text-[#244C3A]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Select Patient</label>
                  <select
                    value={planForm.patient_id}
                    onChange={(e) => setPlanForm({ ...planForm, patient_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Prescribing Doctor</label>
                  <select
                    value={planForm.doctor_id}
                    onChange={(e) => setPlanForm({ ...planForm, doctor_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Ayurvedic Diagnosis (Roganidana)</label>
                <input
                  type="text"
                  required
                  value={planForm.diagnosis}
                  onChange={(e) => setPlanForm({ ...planForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Target Dosha</label>
                  <select
                    value={planForm.primary_dosha}
                    onChange={(e) => setPlanForm({ ...planForm, primary_dosha: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                  >
                    <option value="Vata">Vata</option>
                    <option value="Pitta">Pitta</option>
                    <option value="Kapha">Kapha</option>
                    <option value="Vata-Pitta">Vata-Pitta</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Planned Sessions Count</label>
                  <input
                    type="number"
                    value={planForm.total_sessions}
                    onChange={(e) => setPlanForm({ ...planForm, total_sessions: parseInt(e.target.value) || 7 })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Regimen Goal</label>
                <textarea
                  rows={2}
                  value={planForm.goal}
                  onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                />
              </div>

              <div className="pt-4 border-t border-[#E5DFD3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-[#E5DFD3] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#244C3A] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Regimen Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Log Treatment Session Notes
              </h2>
              <button onClick={() => setShowSessionModal(false)} className="text-[#73695E] hover:text-[#244C3A]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogSession} className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Session Date</label>
                  <input
                    type="date"
                    value={sessionForm.session_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Vitals (BP / Pulse)</label>
                  <input
                    type="text"
                    value={sessionForm.vitals}
                    onChange={(e) => setSessionForm({ ...sessionForm, vitals: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Pain Score Before (1-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={sessionForm.pain_score_before}
                    onChange={(e) => setSessionForm({ ...sessionForm, pain_score_before: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pain Score After (1-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={sessionForm.pain_score_after}
                    onChange={(e) => setSessionForm({ ...sessionForm, pain_score_after: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Therapist Clinical Notes</label>
                <textarea
                  rows={2}
                  value={sessionForm.therapist_notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, therapist_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Patient Feedback</label>
                <input
                  type="text"
                  value={sessionForm.patient_feedback}
                  onChange={(e) => setSessionForm({ ...sessionForm, patient_feedback: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-[#E5DFD3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border border-[#E5DFD3] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#244C3A] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Record Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
