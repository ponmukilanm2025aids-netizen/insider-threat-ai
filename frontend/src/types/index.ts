export type UserRole = 'ADMIN' | 'DOCTOR' | 'THERAPIST' | 'RECEPTIONIST';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: number;
  user_id?: number;
  full_name: string;
  specialization: string;
  qualification: string;
  registration_number?: string;
  email: string;
  phone: string;
  experience_years: number;
  consultation_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface Therapist {
  id: number;
  user_id?: number;
  full_name: string;
  qualification: string;
  phone: string;
  email: string;
  supported_therapies: string;
  working_hours_start: string;
  working_hours_end: string;
  is_available: boolean;
  experience_years: number;
  created_at: string;
}

export interface TreatmentRoom {
  id: number;
  room_number: string;
  name: string;
  room_type: string;
  facilities: string;
  is_active: boolean;
  created_at: string;
}

export interface Therapy {
  id: number;
  name: string;
  code: string;
  description: string;
  default_duration_minutes: number;
  indicative_price: number;
  required_room_type: string;
  required_therapist_skills: string;
  preparation_instructions?: string;
  precautions?: string;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: number;
  patient_id: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  emergency_contact?: string;
  blood_group?: string;
  prakriti: string;
  allergies: string;
  medical_history?: string;
  assigned_doctor_id?: number;
  assigned_doctor?: Doctor;
  status: 'Active' | 'In Treatment' | 'Completed' | 'Discharged';
  registration_date: string;
  created_at: string;
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-show';

export interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  therapist_id: number;
  therapy_id: number;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
  therapist?: Therapist;
  therapy?: Therapy;
  room?: TreatmentRoom;
}

export interface SlotSuggestion {
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  therapist_id: number;
  therapist_name: string;
  room_id: number;
  room_name: string;
  score: number;
  confidence_level: 'Optimal' | 'High' | 'Good';
  explanation: string[];
  is_conflict_free: boolean;
}

export interface AISlotRecommendationResponse {
  therapy_name: string;
  duration_minutes: number;
  date: string;
  suggestions: SlotSuggestion[];
  algorithm_info: string;
}

export interface TreatmentSession {
  id: number;
  treatment_plan_id: number;
  appointment_id?: number;
  patient_id: number;
  therapist_id: number;
  therapy_id: number;
  session_number: number;
  session_date: string;
  attendance: string;
  vitals: string;
  therapist_notes?: string;
  doctor_observations?: string;
  patient_feedback?: string;
  pain_score_before: number;
  pain_score_after: number;
  created_at: string;
  therapist?: Therapist;
  therapy?: Therapy;
}

export interface TreatmentPlan {
  id: number;
  plan_number: string;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  primary_dosha: string;
  goal: string;
  total_sessions: number;
  completed_sessions: number;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Completed' | 'Paused';
  special_instructions?: string;
  created_at: string;
  doctor?: Doctor;
  sessions?: TreatmentSession[];
}

export interface PrescriptionItem {
  id?: number;
  prescription_id?: number;
  medicine_name: string;
  dosage_form: string;
  dosage: string;
  timing: string;
  frequency: string;
  duration_days: number;
  instructions: string;
}

export interface Prescription {
  id: number;
  prescription_number: string;
  patient_id: number;
  doctor_id: number;
  consultation_date: string;
  diagnosis: string;
  general_advice?: string;
  follow_up_date?: string;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
  items: PrescriptionItem[];
}

export interface DietPlan {
  id: number;
  plan_number: string;
  patient_id: number;
  doctor_id: number;
  title: string;
  dosha_focus: string;
  start_date: string;
  end_date: string;
  pathya_foods: string;
  apathya_foods: string;
  breakfast_plan: string;
  lunch_plan: string;
  dinner_plan: string;
  herbal_teas_water?: string;
  general_rules: string;
  status: string;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  appointment_id?: number;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'Paid' | 'Pending' | 'Partial';
  payment_method: string;
  notes?: string;
  created_at: string;
  patient?: Patient;
  items: InvoiceItem[];
}

export interface InventoryItem {
  id: number;
  item_code: string;
  name: string;
  category: string;
  batch_number: string;
  stock_quantity: number;
  unit: string;
  reorder_threshold: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
  supplier_name: string;
  location: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'appointment' | 'inventory' | 'billing' | 'clinical' | 'conflict';
  is_read: boolean;
  severity: 'info' | 'warning' | 'danger' | 'success';
  link?: string;
  created_at: string;
}

export interface DashboardStats {
  total_patients: number;
  total_appointments?: number;
  completed_treatments?: number;
  today_appointments_count: number;
  ongoing_treatments_count: number;
  available_therapists_count: number;
  pending_payments_total: number;
  low_stock_count: number;
  weekly_appointments: { date: string; day: string; total: number; completed: number }[];
  therapy_distribution: { name: string; count: number }[];
  recent_patients: Patient[];
  upcoming_appointments: Appointment[];
  alerts: Notification[];
}
