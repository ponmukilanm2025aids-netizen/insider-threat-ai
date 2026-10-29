import axios from 'axios';
import {
  User, Patient, Doctor, Therapist, TreatmentRoom, Therapy,
  Appointment, AISlotRecommendationResponse, TreatmentPlan,
  TreatmentSession, Prescription, DietPlan, Invoice, InventoryItem,
  Notification, DashboardStats
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ayursutra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Service Methods
export const apiService = {
  // Auth
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data;
  },
  async getDemoAccounts() {
    const res = await api.get('/auth/demo-accounts');
    return res.data;
  },

  // Patients
  async getPatients(params?: { search?: string; status_filter?: string; skip?: number; limit?: number }): Promise<Patient[]> {
    const res = await api.get('/patients', { params });
    return res.data;
  },
  async searchPatients(q: string): Promise<Patient[]> {
    const res = await api.get('/patients/search', { params: { q } });
    return res.data;
  },
  async getPatient(id: number): Promise<Patient> {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },
  async getPatientFullProfile(id: number) {
    const res = await api.get(`/patients/${id}/full-profile`);
    return res.data;
  },
  async createPatient(data: Partial<Patient>): Promise<Patient> {
    const res = await api.post('/patients', data);
    return res.data;
  },
  async updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
    const res = await api.put(`/patients/${id}`, data);
    return res.data;
  },
  async deletePatient(id: number) {
    const res = await api.delete(`/patients/${id}`);
    return res.data;
  },

  // Doctors & Therapists
  async getDoctors(): Promise<Doctor[]> {
    const res = await api.get('/doctors');
    return res.data;
  },
  async getTherapists(): Promise<Therapist[]> {
    const res = await api.get('/therapists');
    return res.data;
  },
  async getTherapistWorkload(date?: string) {
    const res = await api.get('/therapists/workload', { params: { date } });
    return res.data;
  },

  // Therapies & Rooms
  async getTherapies(activeOnly: boolean = true): Promise<Therapy[]> {
    const res = await api.get('/therapies', { params: { active_only: activeOnly } });
    return res.data;
  },
  async getRooms(): Promise<TreatmentRoom[]> {
    const res = await api.get('/rooms');
    return res.data;
  },

  // Appointments
  async getAppointments(params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    patient_id?: number;
    therapist_id?: number;
    doctor_id?: number;
    status_filter?: string;
  }): Promise<Appointment[]> {
    const res = await api.get('/appointments', { params });
    return res.data;
  },
  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const res = await api.post('/appointments', data);
    return res.data;
  },
  async updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment> {
    const res = await api.put(`/appointments/${id}`, data);
    return res.data;
  },
  async deleteAppointment(id: number) {
    const res = await api.delete(`/appointments/${id}`);
    return res.data;
  },

  // AI Scheduling
  async recommendSlots(payload: {
    therapy_id: number;
    preferred_date: string;
    preferred_time_of_day?: string;
    patient_id?: number;
  }): Promise<AISlotRecommendationResponse> {
    const res = await api.post('/scheduling/recommend-slots', payload);
    return res.data;
  },
  async checkConflict(params: {
    date: string;
    start_time: string;
    duration_minutes: number;
    therapist_id: number;
    room_id: number;
    therapy_id: number;
    exclude_appointment_id?: number;
  }) {
    const res = await api.get('/scheduling/check-conflict', { params });
    return res.data;
  },

  // Clinical - Treatment Plans, Sessions, Prescriptions & Diet
  async getTreatmentPlans(params?: { patient_id?: number; status_filter?: string }): Promise<TreatmentPlan[]> {
    const res = await api.get('/treatment-plans', { params });
    return res.data;
  },
  async createTreatmentPlan(data: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    const res = await api.post('/treatment-plans', data);
    return res.data;
  },
  async updateTreatmentPlan(id: number, data: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    const res = await api.put(`/treatment-plans/${id}`, data);
    return res.data;
  },
  async getTreatmentSessions(params?: { plan_id?: number; patient_id?: number }): Promise<TreatmentSession[]> {
    const res = await api.get('/treatment-sessions', { params });
    return res.data;
  },
  async logTreatmentSession(data: Partial<TreatmentSession>): Promise<TreatmentSession> {
    const res = await api.post('/treatment-sessions', data);
    return res.data;
  },
  async getPrescriptions(patient_id?: number): Promise<Prescription[]> {
    const res = await api.get('/prescriptions', { params: { patient_id } });
    return res.data;
  },
  async getPrescription(id: number): Promise<Prescription> {
    const res = await api.get(`/prescriptions/${id}`);
    return res.data;
  },
  async createPrescription(data: any): Promise<Prescription> {
    const res = await api.post('/prescriptions', data);
    return res.data;
  },
  async getDietPlans(patient_id?: number): Promise<DietPlan[]> {
    const res = await api.get('/diet-plans', { params: { patient_id } });
    return res.data;
  },
  async createDietPlan(data: Partial<DietPlan>): Promise<DietPlan> {
    const res = await api.post('/diet-plans', data);
    return res.data;
  },

  // Billing
  async getInvoices(params?: { patient_id?: number; payment_status?: string }): Promise<Invoice[]> {
    const res = await api.get('/billing/invoices', { params });
    return res.data;
  },
  async getInvoice(id: number): Promise<Invoice> {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data;
  },
  async createInvoice(data: any): Promise<Invoice> {
    const res = await api.post('/billing/invoices', data);
    return res.data;
  },
  async payInvoice(id: number, amount: number, paymentMethod: string = 'UPI'): Promise<Invoice> {
    const res = await api.put(`/billing/invoices/${id}/pay`, null, {
      params: { amount, payment_method: paymentMethod },
    });
    return res.data;
  },

  // Inventory
  async getInventory(params?: { category?: string; low_stock_only?: boolean }): Promise<InventoryItem[]> {
    const res = await api.get('/inventory/items', { params });
    return res.data;
  },
  async createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await api.post('/inventory/items', data);
    return res.data;
  },
  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await api.put(`/inventory/items/${id}`, data);
    return res.data;
  },
  async logInventoryTransaction(data: { item_id: number; transaction_type: string; quantity: number; reference_note?: string; created_by?: string }) {
    const res = await api.post('/inventory/transactions', data);
    return res.data;
  },
  async getInventoryAlerts() {
    const res = await api.get('/inventory/alerts');
    return res.data;
  },

  // Reports
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },
  async getAnalytics() {
    const res = await api.get('/reports/analytics');
    return res.data;
  },

  // Notifications
  async getNotifications(unread_only: boolean = false): Promise<Notification[]> {
    const res = await api.get('/notifications', { params: { unread_only } });
    return res.data;
  },
  async markNotificationRead(id: number): Promise<Notification> {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  async markAllNotificationsRead() {
    const res = await api.put('/notifications/mark-all-read');
    return res.data;
  },
};

export default api;
