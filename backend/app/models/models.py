from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Date, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
import enum
from backend.app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    THERAPIST = "THERAPIST"
    RECEPTIONIST = "RECEPTIONIST"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    CONFIRMED = "Confirmed"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No-show"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.RECEPTIONIST.value, nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    specialization = Column(String(255), nullable=False)
    qualification = Column(String(255), default="BAMS, MD (Ayurveda)")
    registration_number = Column(String(100), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=False)
    experience_years = Column(Integer, default=5)
    consultation_fee = Column(Float, default=500.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="doctor_profile")
    patients = relationship("Patient", back_populates="assigned_doctor")
    appointments = relationship("Appointment", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")
    treatment_plans = relationship("TreatmentPlan", back_populates="doctor")
    diet_plans = relationship("DietPlan", back_populates="doctor")

class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    qualification = Column(String(255), default="Diploma in Panchakarma Therapy")
    phone = Column(String(50), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    supported_therapies = Column(Text, default="Abhyanga, Shirodhara, Basti, Nasya, Swedana")
    working_hours_start = Column(String(10), default="08:00")
    working_hours_end = Column(String(10), default="18:00")
    is_available = Column(Boolean, default=True)
    experience_years = Column(Integer, default=4)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="therapist_profile")
    appointments = relationship("Appointment", back_populates="therapist")
    treatment_sessions = relationship("TreatmentSession", back_populates="therapist")

class TreatmentRoom(Base):
    __tablename__ = "treatment_rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    room_type = Column(String(100), default="General Therapy Suite")
    facilities = Column(Text, default="Dhara Table, Steam Box, Hot Water, Enema Apparatus")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="room")

class Therapy(Base):
    __tablename__ = "therapies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    default_duration_minutes = Column(Integer, default=60)
    indicative_price = Column(Float, default=1500.0)
    required_room_type = Column(String(100), default="General Therapy Suite")
    required_therapist_skills = Column(String(255), default="General Panchakarma")
    preparation_instructions = Column(Text, nullable=True)
    precautions = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="therapy")
    treatment_sessions = relationship("TreatmentSession", back_populates="therapy")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), default="Other")
    phone = Column(String(50), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=False)
    emergency_contact = Column(String(100), nullable=True)
    blood_group = Column(String(10), nullable=True)
    prakriti = Column(String(50), default="Vata-Pitta")
    allergies = Column(Text, default="None documented")
    medical_history = Column(Text, nullable=True)
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    status = Column(String(50), default="Active")
    registration_date = Column(Date, default=datetime.utcnow().date)
    created_at = Column(DateTime, default=datetime.utcnow)

    assigned_doctor = relationship("Doctor", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    treatment_plans = relationship("TreatmentPlan", back_populates="patient", cascade="all, delete-orphan")
    diet_plans = relationship("DietPlan", back_populates="patient", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="patient", cascade="all, delete-orphan")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    therapy_id = Column(Integer, ForeignKey("therapies.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("treatment_rooms.id"), nullable=False)
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(10), nullable=False)        # HH:MM
    end_time = Column(String(10), nullable=False)          # HH:MM
    duration_minutes = Column(Integer, default=60)
    status = Column(String(50), default=AppointmentStatus.SCHEDULED.value)
    notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    therapist = relationship("Therapist", back_populates="appointments")
    therapy = relationship("Therapy", back_populates="appointments")
    room = relationship("TreatmentRoom", back_populates="appointments")

class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    diagnosis = Column(String(255), nullable=False)
    primary_dosha = Column(String(50), default="Vata")
    goal = Column(Text, nullable=False)
    total_sessions = Column(Integer, default=7)
    completed_sessions = Column(Integer, default=0)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    status = Column(String(50), default="Active")
    special_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="treatment_plans")
    doctor = relationship("Doctor", back_populates="treatment_plans")
    sessions = relationship("TreatmentSession", back_populates="treatment_plan", cascade="all, delete-orphan")

class TreatmentSession(Base):
    __tablename__ = "treatment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    therapy_id = Column(Integer, ForeignKey("therapies.id"), nullable=False)
    session_number = Column(Integer, nullable=False)
    session_date = Column(String(20), nullable=False)
    attendance = Column(String(20), default="Present")
    vitals = Column(String(100), default="BP: 120/80, Pulse: 72 bpm")
    therapist_notes = Column(Text, nullable=True)
    doctor_observations = Column(Text, nullable=True)
    patient_feedback = Column(Text, nullable=True)
    pain_score_before = Column(Integer, default=5)
    pain_score_after = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

    treatment_plan = relationship("TreatmentPlan", back_populates="sessions")
    therapist = relationship("Therapist", back_populates="treatment_sessions")
    therapy = relationship("Therapy", back_populates="treatment_sessions")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    consultation_date = Column(String(20), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    diagnosis = Column(String(255), nullable=False)
    general_advice = Column(Text, nullable=True)
    follow_up_date = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    dosage_form = Column(String(100), default="Taila")  # Taila, Kwatha, Churna, Vati, Asava/Arishta
    dosage = Column(String(100), nullable=False)        # 15ml, 2 tablets, 1 spoon
    timing = Column(String(100), default="After Meals")  # Before Meals, After Meals, Empty Stomach
    frequency = Column(String(100), default="Twice daily")
    duration_days = Column(Integer, default=14)
    instructions = Column(Text, default="With warm water")

    prescription = relationship("Prescription", back_populates="items")

class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    title = Column(String(255), nullable=False)
    dosha_focus = Column(String(50), default="Vata-Pitta Shamaka")
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    pathya_foods = Column(Text, nullable=False)
    apathya_foods = Column(Text, nullable=False)
    breakfast_plan = Column(Text, nullable=False)
    lunch_plan = Column(Text, nullable=False)
    dinner_plan = Column(Text, nullable=False)
    herbal_teas_water = Column(Text, nullable=True)
    general_rules = Column(Text, default="Eat fresh, warm, light meals. Avoid cold drinks.")
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="diet_plans")
    doctor = relationship("Doctor", back_populates="diet_plans")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    invoice_date = Column(String(20), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    due_date = Column(String(20), nullable=True)
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    payment_status = Column(String(50), default="Pending")  # Paid, Pending, Partial
    payment_method = Column(String(50), default="UPI")      # UPI, Cash, Card, Net Banking
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    description = Column(String(255), nullable=False)
    item_type = Column(String(50), default="Therapy")  # Therapy, Medicine, Consultation, Other
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    invoice = relationship("Invoice", back_populates="items")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Herbal Oil") # Herbal Oil, Churnam, Kwatham, Asava, Consumable
    batch_number = Column(String(100), nullable=False)
    stock_quantity = Column(Float, default=0.0)
    unit = Column(String(50), default="ml")  # ml, grams, bottles, pcs
    reorder_threshold = Column(Float, default=500.0)
    purchase_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    expiry_date = Column(String(20), nullable=False)
    supplier_name = Column(String(255), default="Kottakkal Arya Vaidya Sala")
    location = Column(String(100), default="Main Pharmacy Shelf A")
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("InventoryTransaction", back_populates="item", cascade="all, delete-orphan")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False) # Inward, Usage, Return, Wastage
    quantity = Column(Float, nullable=False)
    reference_note = Column(Text, nullable=True)
    created_by = Column(String(255), default="Pharmacy Staff")
    created_at = Column(DateTime, default=datetime.utcnow)

    item = relationship("InventoryItem", back_populates="transactions")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="appointment") # appointment, inventory, billing, clinical, conflict
    is_read = Column(Boolean, default=False)
    severity = Column(String(20), default="info") # info, warning, danger, success
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
