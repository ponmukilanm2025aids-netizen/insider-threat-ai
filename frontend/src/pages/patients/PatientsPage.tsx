import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Search, Plus, Filter, Eye, Edit2, Trash2, X,
  Phone, Mail, MapPin, Calendar, Heart, ShieldAlert, FileText, CheckCircle2
} from 'lucide-react';
import { apiService } from '../../services/api';
import { Patient, Doctor } from '../../types';
import { Badge } from '../../components/common/Badge';

export const PatientsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientProfile, setPatientProfile] = useState<any | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '1990-01-01',
    age: 36,
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    blood_group: 'O+',
    prakriti: 'Vata-Pitta',
    allergies: 'None documented',
    medical_history: '',
    assigned_doctor_id: undefined as number | undefined,
    status: 'Active' as Patient['status'],
  });

  useEffect(() => {
    loadPatients();
    loadDoctors();
    if (searchParams.get('register') === 'true') {
      setShowRegisterModal(true);
    }
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPatients({
        search: searchTerm || undefined,
        status_filter: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await apiService.getDoctors();
      setDoctors(data);
      if (data.length > 0 && !formData.assigned_doctor_id) {
        setFormData((prev) => ({ ...prev, assigned_doctor_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients();
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    const computedAge = calculateAge(dob);
    setFormData((prev) => ({
      ...prev,
      date_of_birth: dob,
      age: isNaN(computedAge) ? prev.age : computedAge,
    }));
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await apiService.updatePatient(editingPatient.id, formData);
        setEditingPatient(null);
      } else {
        await apiService.createPatient(formData);
      }
      setShowRegisterModal(false);
      resetForm();
      loadPatients();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save patient record.');
    }
  };

  const handleViewProfile = async (p: Patient) => {
    setSelectedPatient(p);
    setShowProfileDrawer(true);
    try {
      const full = await apiService.getPatientFullProfile(p.id);
      setPatientProfile(full);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (p: Patient) => {
    setEditingPatient(p);
    setFormData({
      full_name: p.full_name,
      date_of_birth: p.date_of_birth,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      email: p.email || '',
      address: p.address,
      emergency_contact: p.emergency_contact || '',
      blood_group: p.blood_group || 'O+',
      prakriti: p.prakriti,
      allergies: p.allergies,
      medical_history: p.medical_history || '',
      assigned_doctor_id: p.assigned_doctor_id,
      status: p.status,
    });
    setShowRegisterModal(true);
  };

  const handleDeletePatient = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove patient record for ${name}?`)) {
      try {
        await apiService.deletePatient(id);
        loadPatients();
      } catch (err) {
        alert('Failed to delete patient record.');
      }
    }
  };

  const resetForm = () => {
    setEditingPatient(null);
    setFormData({
      full_name: '',
      date_of_birth: '1990-01-01',
      age: 36,
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      emergency_contact: '',
      blood_group: 'O+',
      prakriti: 'Vata-Pitta',
      allergies: 'None documented',
      medical_history: '',
      assigned_doctor_id: doctors[0]?.id,
      status: 'Active',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Patient Management (Rogi Pariksha)
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Complete Ayurvedic patient demographics, dosha prakriti, and clinical records
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowRegisterModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Register New Patient
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5DFD3] flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73695E]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name or ID (e.g. Aarav, AYUR-2026-0001)..."
              className="w-full pl-10 pr-9 py-2 bg-[#FAF7EF]/60 border border-[#E5DFD3] rounded-xl text-xs sm:text-sm text-[#40372D] focus:outline-none focus:border-[#244C3A]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  apiService.getPatients({ status_filter: statusFilter !== 'All' ? statusFilter : undefined }).then(setPatients);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#73695E] hover:text-[#244C3A] p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-[#73695E] flex items-center gap-1">
            <Filter size={14} /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            className="px-3 py-2 bg-[#FAF7EF]/60 border border-[#E5DFD3] rounded-xl text-xs sm:text-sm text-[#40372D] focus:outline-none focus:border-[#244C3A]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="In Treatment">In Treatment</option>
            <option value="Completed">Completed</option>
            <option value="Discharged">Discharged</option>
          </select>
          <button
            onClick={loadPatients}
            className="px-4 py-2 bg-[#FAF7EF] hover:bg-[#E5DFD3]/50 border border-[#E5DFD3] text-xs font-semibold text-[#244C3A] rounded-xl transition-colors cursor-pointer"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-3xl border border-[#E5DFD3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF7EF] border-b border-[#E5DFD3] text-[#73695E] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Prakriti</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60 text-[#40372D]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#73695E]">
                    Loading patient records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#73695E]">
                    No matching patient records found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7EF]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#244C3A]">
                      {p.patient_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#244C3A]">
                      {p.full_name}
                      {p.allergies && p.allergies !== 'None' && p.allergies !== 'None documented' && (
                        <span className="block text-[10px] text-amber-700 font-normal truncate max-w-xs">
                          ⚠️ Allergy: {p.allergies}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#73695E]">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="dosha">{p.prakriti}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[#73695E]">
                      <div className="flex flex-col">
                        <span>{p.phone}</span>
                        {p.email && <span className="text-[11px] truncate max-w-[150px]">{p.email}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="status">{p.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewProfile(p)}
                          className="p-1.5 rounded-lg text-[#244C3A] hover:bg-[#244C3A]/10 transition-colors"
                          title="View Full Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 rounded-lg text-[#B99756] hover:bg-[#B99756]/10 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(p.id, p.full_name)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Patient"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Registration & Edit Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                {editingPatient ? 'Edit Patient Record' : 'Register New Patient'}
              </h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-[#73695E] hover:text-[#244C3A]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="mt-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Meenakshi Sundaram"
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 94471 00000"
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={handleDobChange}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#40372D] mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#40372D] mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Ayurvedic Prakriti (Dosha)</label>
                  <select
                    value={formData.prakriti}
                    onChange={(e) => setFormData({ ...formData, prakriti: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none font-medium"
                  >
                    <option value="Vata">Vata (Air/Ether dominant)</option>
                    <option value="Pitta">Pitta (Fire/Water dominant)</option>
                    <option value="Kapha">Kapha (Earth/Water dominant)</option>
                    <option value="Vata-Pitta">Vata-Pitta</option>
                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                    <option value="Vata-Kapha">Vata-Kapha</option>
                    <option value="Tridosha (Sama)">Tridosha (Balanced)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Name & Contact phone"
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#40372D] mb-1">Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Residential address..."
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#40372D] mb-1">Allergies (Herbal & Modern Medicines)</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Dust, Shellfish, Sulfa drugs"
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#40372D] mb-1">Medical History & Chief Complaints</label>
                <textarea
                  rows={2}
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  placeholder="Chronic conditions, previous surgeries, Roganidana..."
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Assigned Doctor</label>
                  <select
                    value={formData.assigned_doctor_id}
                    onChange={(e) => setFormData({ ...formData, assigned_doctor_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#40372D] mb-1">Treatment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A] focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="In Treatment">In Treatment</option>
                    <option value="Completed">Completed</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5DFD3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-[#E5DFD3] rounded-xl text-xs font-semibold text-[#73695E] hover:bg-[#FAF7EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#244C3A] hover:bg-[#1A382B] text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  {editingPatient ? 'Update Patient' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Full Profile Drawer */}
      {showProfileDrawer && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 sm:p-8 shadow-2xl border-l border-[#E5DFD3] animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3]">
              <div>
                <span className="text-xs font-mono font-bold text-[#B99756]">{selectedPatient.patient_id}</span>
                <h2 className="text-2xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                  {selectedPatient.full_name}
                </h2>
              </div>
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="p-1 rounded-lg text-[#73695E] hover:text-[#244C3A]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-6 text-xs sm:text-sm">
              {/* Demographics Card */}
              <div className="bg-[#FAF7EF] p-4 rounded-2xl border border-[#E5DFD3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#73695E]">Prakriti (Dosha Constitution):</span>
                  <Badge variant="dosha">{selectedPatient.prakriti}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#73695E]">Current Status:</span>
                  <Badge variant="status">{selectedPatient.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#73695E]">Age / Gender / Blood:</span>
                  <span className="font-bold text-[#40372D]">
                    {selectedPatient.age} yrs • {selectedPatient.gender} • {selectedPatient.blood_group}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#73695E]">Phone:</span>
                  <span className="font-medium text-[#40372D]">{selectedPatient.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#73695E]">Address:</span>
                  <span className="font-medium text-[#40372D] text-right truncate max-w-xs">{selectedPatient.address}</span>
                </div>
              </div>

              {/* Medical History & Allergies */}
              <div className="space-y-3">
                <h3 className="font-bold text-[#244C3A] text-sm">Medical History & Allergies</h3>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900">
                  <span className="font-bold block text-xs">Allergies:</span>
                  <p className="text-xs mt-0.5">{selectedPatient.allergies}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7EF] border border-[#E5DFD3] text-[#40372D]">
                  <span className="font-bold block text-xs text-[#73695E]">Chief Complaints & Diagnosis:</span>
                  <p className="text-xs mt-0.5 leading-relaxed">{selectedPatient.medical_history || 'None documented.'}</p>
                </div>
              </div>

              {/* Prescriptions & Treatment Plans Summary */}
              {patientProfile && (
                <div className="space-y-4 pt-4 border-t border-[#E5DFD3]">
                  <h3 className="font-bold text-[#244C3A] text-sm">Clinical Timeline & Active Regimens</h3>

                  <div>
                    <p className="font-semibold text-xs text-[#73695E] mb-2">
                      Active Treatment Plans ({patientProfile.treatment_plans?.length || 0})
                    </p>
                    {patientProfile.treatment_plans?.length > 0 ? (
                      patientProfile.treatment_plans.map((pl: any) => (
                        <div key={pl.id} className="p-3 mb-2 rounded-xl border border-[#E5DFD3] bg-white text-xs">
                          <div className="flex items-center justify-between font-bold text-[#244C3A]">
                            <span>{pl.plan_number}: {pl.diagnosis}</span>
                            <Badge variant="status">{pl.status}</Badge>
                          </div>
                          <p className="text-[#73695E] mt-1">
                            Progress: {pl.completed_sessions} of {pl.total_sessions} sessions completed
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#73695E]">No active treatment plan created yet.</p>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-xs text-[#73695E] mb-2">
                      Prescription History ({patientProfile.prescriptions?.length || 0})
                    </p>
                    {patientProfile.prescriptions?.length > 0 ? (
                      patientProfile.prescriptions.map((rx: any) => (
                        <div key={rx.id} className="p-3 mb-2 rounded-xl border border-[#E5DFD3] bg-white text-xs">
                          <p className="font-bold text-[#244C3A]">{rx.prescription_number} ({rx.consultation_date})</p>
                          <p className="text-[#73695E]">{rx.diagnosis}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#73695E]">No digital prescription logged yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
