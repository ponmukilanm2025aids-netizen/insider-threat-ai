import React, { useState, useEffect } from 'react';
import { Flower2, Clock, IndianRupee, ShieldAlert, Sparkles, MapPin, CheckCircle2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { Therapy } from '../../types';

export const TherapiesCatalogPage: React.FC = () => {
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTherapy, setSelectedTherapy] = useState<Therapy | null>(null);

  useEffect(() => {
    loadTherapies();
  }, []);

  const loadTherapies = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTherapies();
      setTherapies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
          Panchakarma Therapy Catalog (Chikitsa Vidhi)
        </h1>
        <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
          Authentic Kerala Ayurveda Panchakarma procedures, preparation protocols, and clinical indications
        </p>
      </div>

      {/* Demonstration Data Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 text-xs text-amber-900 flex items-center gap-2">
        <Sparkles size={16} className="text-[#B99756] shrink-0" />
        <span>
          <strong>Clinical Notice:</strong> Standardized protocol parameters and prices shown are configurable demonstration data for SIH25023. Panchakarma regimens must be authorized by licensed Ayurvedic clinicians.
        </span>
      </div>

      {/* Therapy Cards Grid */}
      {loading ? (
        <p className="text-center py-12 text-xs text-[#73695E]">Loading Panchakarma therapies...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapies.map((th) => (
            <div
              key={th.id}
              onClick={() => setSelectedTherapy(th)}
              className="bg-white p-6 rounded-3xl border border-[#E5DFD3] hover:border-[#244C3A]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#B99756]">{th.code}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <IndianRupee size={12} /> {th.indicative_price}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#244C3A] group-hover:text-[#1A382B] transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                  {th.name}
                </h3>
                <p className="text-xs text-[#73695E] mt-2 line-clamp-3 leading-relaxed">
                  {th.description}
                </p>

                <div className="mt-4 pt-3 border-t border-[#E5DFD3]/60 space-y-1.5 text-xs text-[#73695E]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Clock size={13} /> Session Duration:</span>
                    <span className="font-semibold text-[#40372D]">{th.default_duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><MapPin size={13} /> Room Setup:</span>
                    <span className="font-semibold text-[#40372D] truncate max-w-[150px]">{th.required_room_type}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DFD3]/60 flex items-center justify-between text-xs">
                <span className="text-[#B99756] font-semibold group-hover:underline">
                  View Full Clinical Protocol →
                </span>
                <span className="text-[11px] text-[#73695E]">Skills: {th.required_therapist_skills}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Therapy Details Modal */}
      {selectedTherapy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <div>
                <span className="font-mono text-xs font-bold text-[#B99756]">{selectedTherapy.code}</span>
                <h2 className="text-2xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                  {selectedTherapy.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTherapy(null)}
                className="p-1 rounded-lg text-[#73695E] hover:text-[#244C3A]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs sm:text-sm">
              <p className="text-[#40372D] leading-relaxed">{selectedTherapy.description}</p>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]">
                <div>
                  <span className="text-[#73695E] block font-semibold">Duration:</span>
                  <span className="text-base font-bold text-[#244C3A]">{selectedTherapy.default_duration_minutes} Minutes</span>
                </div>
                <div>
                  <span className="text-[#73695E] block font-semibold">Demonstration Price:</span>
                  <span className="text-base font-bold text-emerald-800">₹{selectedTherapy.indicative_price}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#73695E] block font-semibold">Required Suite / Apparatus:</span>
                  <span className="font-medium text-[#40372D]">{selectedTherapy.required_room_type}</span>
                </div>
              </div>

              {selectedTherapy.preparation_instructions && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <h4 className="font-bold text-emerald-900 mb-1">Pre-Procedure Preparation (Purva Karma):</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">{selectedTherapy.preparation_instructions}</p>
                </div>
              )}

              {selectedTherapy.precautions && (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                  <h4 className="font-bold text-rose-900 mb-1">Contraindications & Precautions (Varjya):</h4>
                  <p className="text-xs text-rose-800 leading-relaxed">{selectedTherapy.precautions}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5DFD3] flex justify-end">
                <button
                  onClick={() => setSelectedTherapy(null)}
                  className="px-6 py-2 bg-[#244C3A] text-white rounded-xl font-semibold shadow-xs hover:bg-[#1A382B]"
                >
                  Close Protocol View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
