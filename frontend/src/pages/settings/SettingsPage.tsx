import React from 'react';
import { Settings, ShieldCheck, Clock, Building2, Check, Lock, Database } from 'lucide-react';
import { LotusLogo } from '../../components/common/LotusLogo';

export const SettingsPage: React.FC = () => {
  const permissionMatrix = [
    { module: 'Dashboard Statistics', admin: true, doctor: true, therapist: true, reception: true },
    { module: 'Patient Registration & Edit', admin: true, doctor: true, therapist: false, reception: true },
    { module: 'Therapy Catalog Management', admin: true, doctor: true, therapist: false, reception: false },
    { module: 'Appointment Booking & Rescheduling', admin: true, doctor: true, therapist: true, reception: true },
    { module: 'AI Conflict & Slot Recommender', admin: true, doctor: true, therapist: true, reception: true },
    { module: 'Prescription Authoring', admin: true, doctor: true, therapist: false, reception: false },
    { module: 'Diet Plan Authoring', admin: true, doctor: true, therapist: false, reception: false },
    { module: 'Treatment Session Logs & Vitals', admin: true, doctor: true, therapist: true, reception: false },
    { module: 'Invoice Creation & Billing Settlement', admin: true, doctor: false, therapist: false, reception: true },
    { module: 'Dispensary Stock & Inward/Outward', admin: true, doctor: true, therapist: true, reception: true },
    { module: 'Financial & Utilization Reports', admin: true, doctor: true, therapist: false, reception: false },
    { module: 'System Configuration & Audits', admin: true, doctor: false, therapist: false, reception: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
          Hospital Administration & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
          AYUSH clinical accreditation, facility timing, and role-based access control matrix
        </p>
      </div>

      {/* Hospital Identity & AYUSH Accreditation Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DFD3] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
          <LotusLogo size={48} subtitle="Panchakarma Center of Excellence" />
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#B99756]/20 text-[#8F6F33] border border-[#B99756]/40">
            SIH25023 Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#73695E]">
          <div className="p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]/60">
            <span className="font-semibold block text-[#40372D] mb-1">Facility Name:</span>
            <p className="font-bold text-[#244C3A] text-sm">AyurSutra Kerala Ayurveda Hospital</p>
            <p className="text-[11px] text-[#73695E] mt-0.5">Govt. AYUSH License: KER-AYU-2026-098</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]/60">
            <span className="font-semibold block text-[#40372D] mb-1">Clinic Operating Hours:</span>
            <p className="font-bold text-[#40372D]">08:00 AM – 06:00 PM (Mon – Sun)</p>
            <p className="text-[11px] text-[#73695E] mt-0.5">Emergency Panchakarma: On Call</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]/60">
            <span className="font-semibold block text-[#40372D] mb-1">Deployment Engine:</span>
            <p className="font-bold text-[#244C3A]">FastAPI + PostgreSQL + Vite</p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">● Database Connected & Active</p>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Permission Matrix */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DFD3] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-[#244C3A]" />
          <h2 className="text-base font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Role-Based Authorization Matrix (RBAC)
          </h2>
        </div>
        <p className="text-xs text-[#73695E]">
          Enforces data access boundaries to prevent unauthorized staff from altering clinical records or financial statements.
        </p>

        <div className="border border-[#E5DFD3] rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#FAF7EF] border-b border-[#E5DFD3] text-[#73695E] font-semibold">
              <tr>
                <th className="py-3 px-4">Functional Module</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Doctor (Vaidya)</th>
                <th className="py-3 px-4 text-center">Therapist</th>
                <th className="py-3 px-4 text-center">Receptionist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60 text-[#40372D]">
              {permissionMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FAF7EF]/20">
                  <td className="py-2.5 px-4 font-medium text-[#244C3A]">{row.module}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.admin ? (
                      <span className="inline-flex text-emerald-700 font-bold">✓</span>
                    ) : (
                      <span className="text-[#73695E]/40 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.doctor ? (
                      <span className="inline-flex text-emerald-700 font-bold">✓</span>
                    ) : (
                      <span className="text-[#73695E]/40 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.therapist ? (
                      <span className="inline-flex text-emerald-700 font-bold">✓</span>
                    ) : (
                      <span className="text-[#73695E]/40 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.reception ? (
                      <span className="inline-flex text-emerald-700 font-bold">✓</span>
                    ) : (
                      <span className="text-[#73695E]/40 font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
