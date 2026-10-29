import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, CheckCircle2, AlertOctagon, Heart, Calendar, User, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { DietPlan, Patient, Doctor } from '../../types';
import { Badge } from '../../components/common/Badge';

export const DietPlansPage: React.FC = () => {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patient_id: undefined as number | undefined,
    doctor_id: undefined as number | undefined,
    title: 'Vata Shamaka & Dhatu Poshan Nutritional Protocol',
    dosha_focus: 'Vata-Pitta Shamaka',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    pathya_foods: 'Warm cooked red rice (Matta), moong dal with pure cow ghee, steamed zucchini, sweet papaya, soaked raisins, cumin water.',
    apathya_foods: 'Cold refrigerated salads, iced drinks, raw cauliflower, cabbage, deep-fried fast food, fermented items.',
    breakfast_plan: 'Warm ragi porridge or idli with mild coconut chutney. Lukewarm ginger water.',
    lunch_plan: 'Steamed red rice with yellow moong dal and ghee, snake gourd (padavalanga) thoran, fresh buttermilk.',
    dinner_plan: 'Light vegetable barley soup or broken wheat khichdi by 7:30 PM. Warm spiced milk with nutmeg at bedtime.',
    herbal_teas_water: 'Lukewarm water boiled with cumin (jeera) and dry ginger (shunthi). Drink throughout the day.',
    general_rules: 'Eat warm, freshly cooked meals. Chew slowly in a peaceful environment.',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plans, pts, docs] = await Promise.all([
        apiService.getDietPlans(),
        apiService.getPatients(),
        apiService.getDoctors(),
      ]);
      setDietPlans(plans);
      setPatients(pts);
      setDoctors(docs);

      if (plans.length > 0) {
        setSelectedPlan(plans[0]);
      }
      if (pts.length > 0 && !formData.patient_id) {
        setFormData((prev) => ({
          ...prev,
          patient_id: pts[0].id,
          doctor_id: docs[0]?.id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createDietPlan(formData);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      alert('Failed to save diet plan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Diet & Nutrition Plans (Pathya-Apathya Ahara)
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Classical Ayurvedic dietetics aligned with individual Dosha prakriti and treatment stage
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Create Diet Plan
        </button>
      </div>

      {/* Two Column Layout: Plan Cards vs Full Plan Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plans List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#244C3A] uppercase tracking-wider">
            Patient Diet Plans ({dietPlans.length})
          </h2>

          <div className="space-y-3">
            {dietPlans.map((dp) => {
              const isSelected = selectedPlan?.id === dp.id;
              return (
                <div
                  key={dp.id}
                  onClick={() => setSelectedPlan(dp)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#244C3A] shadow-md ring-1 ring-[#244C3A]'
                      : 'bg-white/80 border-[#E5DFD3] hover:border-[#244C3A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#B99756]">{dp.plan_number}</span>
                    <Badge variant="dosha">{dp.dosha_focus}</Badge>
                  </div>
                  <h3 className="font-bold text-[#244C3A] text-sm leading-tight">{dp.title}</h3>
                  <p className="text-xs text-[#40372D] font-medium mt-1">
                    Patient: {dp.patient?.full_name}
                  </p>
                  <p className="text-[11px] text-[#73695E] mt-1">
                    {dp.start_date} to {dp.end_date}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Plan Detailed View */}
        <div className="lg:col-span-2">
          {selectedPlan ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DFD3] shadow-xs space-y-6">
              <div className="border-b border-[#E5DFD3] pb-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-[#B99756]">{selectedPlan.plan_number}</span>
                  <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedPlan.title}
                  </h2>
                  <p className="text-xs text-[#73695E] mt-0.5">
                    Patient: {selectedPlan.patient?.full_name} ({selectedPlan.patient?.patient_id}) • Prescribed by: {selectedPlan.doctor?.full_name}
                  </p>
                </div>
                <Badge variant="dosha">{selectedPlan.dosha_focus}</Badge>
              </div>

              {/* Pathya (Wholesome) vs Apathya (Restricted) Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Pathya */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    <span>Pathya (Wholesome & Recommended)</span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed">{selectedPlan.pathya_foods}</p>
                </div>

                {/* Apathya */}
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                    <AlertOctagon size={16} className="text-rose-700" />
                    <span>Apathya (Strictly Restricted / Avoid)</span>
                  </div>
                  <p className="text-rose-800 leading-relaxed">{selectedPlan.apathya_foods}</p>
                </div>
              </div>

              {/* Daily Meal Schedule */}
              <div className="space-y-3">
                <h3 className="font-bold text-[#244C3A] text-xs uppercase tracking-wider">
                  Daily Ahara (Meal Schedule)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]">
                    <span className="font-bold text-[#244C3A] block mb-1">Pratarash (Breakfast)</span>
                    <p className="text-[#40372D] leading-relaxed">{selectedPlan.breakfast_plan}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]">
                    <span className="font-bold text-[#244C3A] block mb-1">Madhyahna (Lunch)</span>
                    <p className="text-[#40372D] leading-relaxed">{selectedPlan.lunch_plan}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]">
                    <span className="font-bold text-[#244C3A] block mb-1">Sayam (Dinner)</span>
                    <p className="text-[#40372D] leading-relaxed">{selectedPlan.dinner_plan}</p>
                  </div>
                </div>
              </div>

              {/* Medicated Drinking Water */}
              {selectedPlan.herbal_teas_water && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">Ushnodaka (Medicated Warm Water):</span>
                  <p className="text-amber-800 leading-relaxed">{selectedPlan.herbal_teas_water}</p>
                </div>
              )}

              {/* General Guidelines */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-[#73695E]">
                <span className="font-bold text-[#40372D] block mb-0.5">General Dinacharya Rules:</span>
                <p>{selectedPlan.general_rules}</p>
              </div>
            </div>
          ) : (
            <p className="text-center py-12 text-xs text-[#73695E]">Select a nutrition plan to view details.</p>
          )}
        </div>
      </div>

      {/* New Diet Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Create Clinical Diet Plan
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#73695E] hover:text-[#244C3A]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDiet} className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Select Patient *</label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Doctor *</label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Dosha Focus</label>
                <select
                  value={formData.dosha_focus}
                  onChange={(e) => setFormData({ ...formData, dosha_focus: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                >
                  <option value="Vata Shamaka">Vata Shamaka (Air Pacifying)</option>
                  <option value="Pitta Shamaka">Pitta Shamaka (Cooling / Anti-inflammatory)</option>
                  <option value="Kapha Shamaka">Kapha Shamaka (Light / Stimulating)</option>
                  <option value="Vata-Pitta Shamaka">Vata-Pitta Shamaka</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Pathya (Wholesome Foods)</label>
                <textarea
                  rows={2}
                  value={formData.pathya_foods}
                  onChange={(e) => setFormData({ ...formData, pathya_foods: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Apathya (Restricted Foods)</label>
                <textarea
                  rows={2}
                  value={formData.apathya_foods}
                  onChange={(e) => setFormData({ ...formData, apathya_foods: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                />
              </div>

              <div className="pt-4 border-t border-[#E5DFD3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E5DFD3] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#244C3A] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Diet Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
