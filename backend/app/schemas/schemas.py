from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime, date

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "RECEPTIONIST"
    phone: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Doctor & Therapist Schemas
class DoctorBase(BaseModel):
    full_name: str
    specialization: str
    qualification: str = "BAMS, MD (Ayurveda)"
    registration_number: Optional[str] = None
    email: EmailStr
    phone: str
    experience_years: int = 5
    consultation_fee: float = 500.0
    is_active: bool = True

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    phone: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    is_active: Optional[bool] = None

class DoctorOut(DoctorBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class TherapistBase(BaseModel):
    full_name: str
    qualification: str = "Diploma in Panchakarma Therapy"
    phone: str
    email: EmailStr
    supported_therapies: str = "Abhyanga, Shirodhara, Basti, Nasya, Swedana"
    working_hours_start: str = "08:00"
    working_hours_end: str = "18:00"
    is_available: bool = True
    experience_years: int = 4

class TherapistCreate(TherapistBase):
    pass

class TherapistUpdate(BaseModel):
    full_name: Optional[str] = None
    qualification: Optional[str] = None
    phone: Optional[str] = None
    supported_therapies: Optional[str] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None
    is_available: Optional[bool] = None
    experience_years: Optional[int] = None

class TherapistOut(TherapistBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Rooms Schemas
class TreatmentRoomBase(BaseModel):
    room_number: str
    name: str
    room_type: str = "General Therapy Suite"
    facilities: str = "Dhara Table, Steam Box, Hot Water"
    is_active: bool = True

class TreatmentRoomCreate(TreatmentRoomBase):
    pass

class TreatmentRoomOut(TreatmentRoomBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Therapy Schemas
class TherapyBase(BaseModel):
    name: str
    code: str
    description: str
    default_duration_minutes: int = 60
    indicative_price: float = 1500.0
    required_room_type: str = "General Therapy Suite"
    required_therapist_skills: str = "General Panchakarma"
    preparation_instructions: Optional[str] = None
    precautions: Optional[str] = None
    is_active: bool = True

class TherapyCreate(TherapistBase):
    pass

class TherapyUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    default_duration_minutes: Optional[int] = None
    indicative_price: Optional[float] = None
    required_room_type: Optional[str] = None
    required_therapist_skills: Optional[str] = None
    preparation_instructions: Optional[str] = None
    precautions: Optional[str] = None
    is_active: Optional[bool] = None

class TherapyOut(TherapyBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Patient Schemas
class PatientBase(BaseModel):
    full_name: str
    date_of_birth: str
    age: int
    gender: str = "Male"
    phone: str
    email: Optional[str] = None
    address: str
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    prakriti: str = "Vata-Pitta"
    allergies: str = "None documented"
    medical_history: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    status: str = "Active"

class PatientCreate(PatientBase):
    patient_id: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    prakriti: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    status: Optional[str] = None

class PatientOut(PatientBase):
    id: int
    patient_id: str
    registration_date: date
    created_at: datetime
    assigned_doctor: Optional[DoctorOut] = None
    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    therapist_id: int
    therapy_id: int
    room_id: int
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: Optional[str] = None
    duration_minutes: int = 60
    status: str = "Scheduled"
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    therapist_id: Optional[int] = None
    room_id: Optional[int] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

class AppointmentOut(AppointmentBase):
    id: int
    appointment_number: str
    created_at: datetime
    patient: Optional[PatientOut] = None
    doctor: Optional[DoctorOut] = None
    therapist: Optional[TherapistOut] = None
    therapy: Optional[TherapyOut] = None
    room: Optional[TreatmentRoomOut] = None
    class Config:
        from_attributes = True

# AI Recommendation Schemas
class AISlotRecommendationRequest(BaseModel):
    therapy_id: int
    preferred_date: str
    preferred_time_of_day: Optional[str] = "Any" # Morning, Afternoon, Evening, Any
    patient_id: Optional[int] = None

class SlotSuggestion(BaseModel):
    slot_id: str
    date: str
    start_time: str
    end_time: str
    therapist_id: int
    therapist_name: str
    room_id: int
    room_name: str
    score: float # 0.0 to 1.0
    confidence_level: str # Optimal, High, Medium
    explanation: List[str]
    is_conflict_free: bool

class AISlotRecommendationResponse(BaseModel):
    therapy_name: str
    duration_minutes: int
    date: str
    suggestions: List[SlotSuggestion]
    algorithm_info: str

# Treatment Progress Schemas
class TreatmentSessionBase(BaseModel):
    session_number: int
    session_date: str
    attendance: str = "Present"
    vitals: str = "BP: 120/80, Pulse: 72"
    therapist_notes: Optional[str] = None
    doctor_observations: Optional[str] = None
    patient_feedback: Optional[str] = None
    pain_score_before: int = 5
    pain_score_after: int = 3

class TreatmentSessionCreate(TreatmentSessionBase):
    treatment_plan_id: int
    appointment_id: Optional[int] = None
    patient_id: int
    therapist_id: int
    therapy_id: int

class TreatmentSessionOut(TreatmentSessionBase):
    id: int
    treatment_plan_id: int
    appointment_id: Optional[int] = None
    patient_id: int
    therapist_id: int
    therapy_id: int
    created_at: datetime
    therapist: Optional[TherapistOut] = None
    therapy: Optional[TherapyOut] = None
    class Config:
        from_attributes = True

class TreatmentPlanBase(BaseModel):
    patient_id: int
    doctor_id: int
    diagnosis: str
    primary_dosha: str = "Vata"
    goal: str
    total_sessions: int = 7
    completed_sessions: int = 0
    start_date: str
    end_date: str
    status: str = "Active"
    special_instructions: Optional[str] = None

class TreatmentPlanCreate(TreatmentPlanBase):
    pass

class TreatmentPlanUpdate(BaseModel):
    diagnosis: Optional[str] = None
    primary_dosha: Optional[str] = None
    goal: Optional[str] = None
    total_sessions: Optional[int] = None
    completed_sessions: Optional[int] = None
    status: Optional[str] = None
    special_instructions: Optional[str] = None

class TreatmentPlanOut(TreatmentPlanBase):
    id: int
    plan_number: str
    created_at: datetime
    doctor: Optional[DoctorOut] = None
    sessions: List[TreatmentSessionOut] = []
    class Config:
        from_attributes = True

# Prescription Schemas
class PrescriptionItemBase(BaseModel):
    medicine_name: str
    dosage_form: str = "Taila"
    dosage: str = "15ml"
    timing: str = "After Meals"
    frequency: str = "Twice daily"
    duration_days: int = 14
    instructions: str = "With warm water"

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItemOut(PrescriptionItemBase):
    id: int
    prescription_id: int
    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    patient_id: int
    doctor_id: int
    consultation_date: Optional[str] = None
    diagnosis: str
    general_advice: Optional[str] = None
    follow_up_date: Optional[str] = None
    items: List[PrescriptionItemCreate] = []

class PrescriptionOut(BaseModel):
    id: int
    prescription_number: str
    patient_id: int
    doctor_id: int
    consultation_date: str
    diagnosis: str
    general_advice: Optional[str] = None
    follow_up_date: Optional[str] = None
    created_at: datetime
    patient: Optional[PatientOut] = None
    doctor: Optional[DoctorOut] = None
    items: List[PrescriptionItemOut] = []
    class Config:
        from_attributes = True

# Diet Plan Schemas
class DietPlanBase(BaseModel):
    patient_id: int
    doctor_id: int
    title: str
    dosha_focus: str = "Vata-Pitta Shamaka"
    start_date: str
    end_date: str
    pathya_foods: str
    apathya_foods: str
    breakfast_plan: str
    lunch_plan: str
    dinner_plan: str
    herbal_teas_water: Optional[str] = None
    general_rules: str = "Eat warm, light food."
    status: str = "Active"

class DietPlanCreate(DietPlanBase):
    pass

class DietPlanUpdate(BaseModel):
    title: Optional[str] = None
    dosha_focus: Optional[str] = None
    pathya_foods: Optional[str] = None
    apathya_foods: Optional[str] = None
    breakfast_plan: Optional[str] = None
    lunch_plan: Optional[str] = None
    dinner_plan: Optional[str] = None
    herbal_teas_water: Optional[str] = None
    general_rules: Optional[str] = None
    status: Optional[str] = None

class DietPlanOut(DietPlanBase):
    id: int
    plan_number: str
    created_at: datetime
    patient: Optional[PatientOut] = None
    doctor: Optional[DoctorOut] = None
    class Config:
        from_attributes = True

# Billing Schemas
class InvoiceItemBase(BaseModel):
    description: str
    item_type: str = "Therapy"
    quantity: int = 1
    unit_price: float
    total_price: float

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemOut(InvoiceItemBase):
    id: int
    invoice_id: int
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    subtotal: float
    discount: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    paid_amount: float = 0.0
    payment_status: str = "Pending"
    payment_method: str = "UPI"
    notes: Optional[str] = None
    items: List[InvoiceItemCreate] = []

class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    patient_id: int
    appointment_id: Optional[int] = None
    invoice_date: str
    due_date: Optional[str] = None
    subtotal: float
    discount: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    payment_status: str
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime
    patient: Optional[PatientOut] = None
    items: List[InvoiceItemOut] = []
    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryItemBase(BaseModel):
    item_code: str
    name: str
    category: str = "Herbal Oil"
    batch_number: str
    stock_quantity: float
    unit: str = "ml"
    reorder_threshold: float = 500.0
    purchase_price: float = 0.0
    selling_price: float = 0.0
    expiry_date: str
    supplier_name: str = "Kottakkal Arya Vaidya Sala"
    location: str = "Shelf A"

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    stock_quantity: Optional[float] = None
    reorder_threshold: Optional[float] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    expiry_date: Optional[str] = None
    supplier_name: Optional[str] = None
    location: Optional[str] = None

class InventoryTransactionBase(BaseModel):
    transaction_type: str # Inward, Usage, Return, Wastage
    quantity: float
    reference_note: Optional[str] = None
    created_by: str = "Pharmacy Staff"

class InventoryTransactionCreate(InventoryTransactionBase):
    item_id: int

class InventoryTransactionOut(InventoryTransactionBase):
    id: int
    item_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class InventoryItemOut(InventoryItemBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    severity: str
    link: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Dashboard Stats Schema
class DashboardStatsOut(BaseModel):
    total_patients: int
    total_appointments: int = 0
    completed_treatments: int = 0
    today_appointments_count: int
    ongoing_treatments_count: int
    available_therapists_count: int
    pending_payments_total: float
    low_stock_count: int
    weekly_appointments: List[dict]
    therapy_distribution: List[dict]
    recent_patients: List[PatientOut]
    upcoming_appointments: List[AppointmentOut]
    alerts: List[NotificationOut]
