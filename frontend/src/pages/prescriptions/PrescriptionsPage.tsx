import React, { useState, useEffect } from 'react';
import { FileText, Plus, Printer, Calendar, User, X, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { Prescription, Patient, Doctor } from '../../types';
import { LotusLogo } from '../../components/common/LotusLogo';

export const PrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Rx form
  const [rxForm, setRxForm] = useState({
    patient_id: undefined as number | undefined,
    doctor_id: undefined as number | undefined,
    diagnosis: 'Cervical Spondylosis (Manya Stambha)',
    general_advice: 'Avoid sleeping on excessive height pillows. Apply warm fomentation before sleep.',
    follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    items: [
      {
        medicine_name: 'Maharasnadi Kwatham',
        dosage_form: 'Kwatha',
        dosage: '15 ml + 45 ml warm water',
        timing: 'Before Meals',
        frequency: 'Twice daily',
        duration_days: 14,
        instructions: 'Drink warm at 7 AM and 7 PM',
      },
    ],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxs, pts, docs] = await Promise.all([
        apiService.getPrescriptions(),
        apiService.getPatients(),
        apiService.getDoctors(),
      ]);
      setPrescriptions(rxs);
      setPatients(pts);
      setDoctors(docs);

      if (rxs.length > 0) {
        setSelectedRx(rxs[0]);
      }
      if (pts.length > 0 && !rxForm.patient_id) {
        setRxForm((prev) => ({
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

  const handleAddItem = () => {
    setRxForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          medicine_name: '',
          dosage_form: 'Taila',
          dosage: '15 ml',
          timing: 'After Meals',
          frequency: 'Twice daily',
          duration_days: 14,
          instructions: 'With warm water',
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setRxForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreateRx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createPrescription(rxForm);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      alert('Failed to generate prescription.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Digital Prescriptions (Oushadha Patra)
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Ayurvedic classical formulation prescriptions with printable consultation format
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Write Prescription
        </button>
      </div>

      {/* Two Column Layout: Rx List vs Printable Sheet View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#244C3A] uppercase tracking-wider">
            Prescriptions History ({prescriptions.length})
          </h2>

          <div className="space-y-3">
            {prescriptions.map((rx) => {
              const isSelected = selectedRx?.id === rx.id;
              return (
                <div
                  key={rx.id}
                  onClick={() => setSelectedRx(rx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#244C3A] shadow-md ring-1 ring-[#244C3A]'
                      : 'bg-white/80 border-[#E5DFD3] hover:border-[#244C3A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#B99756]">{rx.prescription_number}</span>
                    <span className="text-[11px] text-[#73695E]">{rx.consultation_date}</span>
                  </div>
                  <h3 className="font-bold text-[#244C3A] text-sm leading-tight">{rx.diagnosis}</h3>
                  <p className="text-xs text-[#40372D] font-medium mt-1">
                    Patient: {rx.patient?.full_name}
                  </p>
                  <p className="text-[11px] text-[#73695E] mt-1">
                    {rx.items?.length || 0} formulation(s) prescribed
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Printable Prescription Preview Sheet */}
        <div className="lg:col-span-2">
          {selectedRx ? (
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E5DFD3] shadow-md space-y-6 relative print:border-none print:shadow-none">
              <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
                <LotusLogo size={46} subtitle="Ayurvedic Hospital & Panchakarma Center" />
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7EF] border border-[#B99756] text-[#8F6F33] text-xs font-semibold rounded-xl hover:bg-[#F5EFEB] transition-colors print:hidden"
                >
                  <Printer size={15} /> Print Prescription
                </button>
              </div>

              {/* Consultation Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]/60 text-xs">
                <div>
                  <span className="text-[#73695E] block">Patient Name:</span>
                  <span className="font-bold text-[#244C3A] text-sm">{selectedRx.patient?.full_name}</span>
                </div>
                <div>
                  <span className="text-[#73695E] block">Patient ID:</span>
                  <span className="font-mono font-semibold text-[#40372D]">{selectedRx.patient?.patient_id}</span>
                </div>
                <div>
                  <span className="text-[#73695E] block">Date:</span>
                  <span className="font-semibold text-[#40372D]">{selectedRx.consultation_date}</span>
                </div>
                <div>
                  <span className="text-[#73695E] block">Doctor:</span>
                  <span className="font-semibold text-[#244C3A]">{selectedRx.doctor?.full_name}</span>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="text-xs">
                <span className="font-bold text-[#73695E]">Ayurvedic Diagnosis (Roganidana):</span>
                <p className="text-sm font-bold text-[#244C3A] mt-0.5">{selectedRx.diagnosis}</p>
              </div>

              {/* Medicines Table */}
              <div>
                <h3 className="font-bold text-[#244C3A] text-xs uppercase tracking-wider mb-2">
                  Prescribed Formulations (Oushadha Vidhi)
                </h3>
                <div className="border border-[#E5DFD3] rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAF7EF] border-b border-[#E5DFD3] text-[#73695E] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Formulation Name</th>
                        <th className="py-2.5 px-3">Dosage & Vehicle</th>
                        <th className="py-2.5 px-3">Timing & Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DFD3]/60 text-[#40372D]">
                      {selectedRx.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7EF]/20">
                          <td className="py-2.5 px-3 font-bold text-[#244C3A]">
                            {item.medicine_name}
                            <span className="block text-[10px] text-[#73695E] font-normal">
                              Type: {item.dosage_form} • {item.instructions}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{item.dosage}</td>
                          <td className="py-2.5 px-3">
                            {item.timing} • {item.frequency}
                          </td>
                          <td className="py-2.5 px-3">{item.duration_days} Days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Advice */}
              {selectedRx.general_advice && (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">Clinical Advice:</span>
                  <p className="text-amber-800 leading-relaxed">{selectedRx.general_advice}</p>
                </div>
              )}

              {/* Footer Signature */}
              <div className="pt-6 border-t border-[#E5DFD3] flex items-center justify-between text-xs text-[#73695E]">
                <div>
                  <span>Next Follow-up Consultation: </span>
                  <strong className="text-[#244C3A]">{selectedRx.follow_up_date || 'After 14 days'}</strong>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#244C3A]">{selectedRx.doctor?.full_name}</p>
                  <p className="text-[10px]">{selectedRx.doctor?.qualification}</p>
                  <p className="text-[10px] font-mono">{selectedRx.doctor?.registration_number}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-12 text-xs text-[#73695E]">Select a prescription to preview.</p>
          )}
        </div>
      </div>

      {/* New Prescription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Write Digital Prescription
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#73695E] hover:text-[#244C3A]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRx} className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Select Patient *</label>
                  <select
                    value={rxForm.patient_id}
                    onChange={(e) => setRxForm({ ...rxForm, patient_id: parseInt(e.target.value) })}
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
                    value={rxForm.doctor_id}
                    onChange={(e) => setRxForm({ ...rxForm, doctor_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Ayurvedic Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={rxForm.diagnosis}
                  onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                />
              </div>

              {/* Medicines Formulations Array */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#244C3A]">Prescribed Formulations</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-[#B99756] hover:underline"
                  >
                    + Add Another Medicine
                  </button>
                </div>

                {rxForm.items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#244C3A]">Medicine #{idx + 1}</span>
                      {rxForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Medicine Name (e.g. Ksheerabala)"
                        value={item.medicine_name}
                        onChange={(e) => {
                          const updated = [...rxForm.items];
                          updated[idx].medicine_name = e.target.value;
                          setRxForm({ ...rxForm, items: updated });
                        }}
                        className="px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 15 ml with water)"
                        value={item.dosage}
                        onChange={(e) => {
                          const updated = [...rxForm.items];
                          updated[idx].dosage = e.target.value;
                          setRxForm({ ...rxForm, items: updated });
                        }}
                        className="px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-lg"
                      />
                      <select
                        value={item.dosage_form}
                        onChange={(e) => {
                          const updated = [...rxForm.items];
                          updated[idx].dosage_form = e.target.value;
                          setRxForm({ ...rxForm, items: updated });
                        }}
                        className="px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-lg"
                      >
                        <option value="Taila">Taila (Oil)</option>
                        <option value="Kwatha">Kwatha (Decoction)</option>
                        <option value="Churna">Churna (Powder)</option>
                        <option value="Vati">Vati (Tablet)</option>
                        <option value="Asava/Arishta">Asava/Arishta</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold mb-1">General Clinical Advice</label>
                <textarea
                  rows={2}
                  value={rxForm.general_advice}
                  onChange={(e) => setRxForm({ ...rxForm, general_advice: e.target.value })}
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
                  Generate Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
