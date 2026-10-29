from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Any
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.models import Patient, Doctor, Appointment, TreatmentPlan, Prescription, DietPlan, Invoice
from backend.app.schemas.schemas import PatientCreate, PatientUpdate, PatientOut
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/patients", tags=["Patient Management"])

def generate_patient_id(db: Session) -> str:
    current_year = datetime.utcnow().year
    count = db.query(Patient).count() + 1
    return f"AYUR-{current_year}-{count:04d}"

@router.get("", response_model=List[PatientOut])
def list_patients(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(Patient)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(s),
                Patient.phone.ilike(s),
                Patient.patient_id.ilike(s),
                Patient.email.ilike(s)
            )
        )
    if status_filter and status_filter != "All":
        query = query.filter(Patient.status == status_filter)
    
    return query.order_by(Patient.id.desc()).offset(skip).limit(limit).all()

@router.get("/search", response_model=List[PatientOut])
def search_patients(
    q: str = Query(..., description="Search query by patient name or patient ID"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Search patients by patient name or AYUR ID using PostgreSQL ILIKE.
    """
    term = f"%{q.strip()}%"
    return db.query(Patient).filter(
        or_(
            Patient.full_name.ilike(term),
            Patient.patient_id.ilike(term)
        )
    ).order_by(Patient.id.desc()).all()

@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Auto-generate ID if not provided
    pid = patient_in.patient_id or generate_patient_id(db)

    # Check for duplicate phone
    existing = db.query(Patient).filter(Patient.phone == patient_in.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient with phone {patient_in.phone} already registered (#{existing.patient_id}: {existing.full_name})."
        )

    patient_dict = patient_in.dict()
    patient_dict["patient_id"] = pid
    patient = Patient(**patient_dict)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    return patient

@router.get("/{patient_id}/full-profile")
def get_patient_full_profile(
    patient_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.date.desc()).all()
    treatment_plans = db.query(TreatmentPlan).filter(TreatmentPlan.patient_id == patient_id).order_by(TreatmentPlan.id.desc()).all()
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).order_by(Prescription.id.desc()).all()
    diet_plans = db.query(DietPlan).filter(DietPlan.patient_id == patient_id).order_by(DietPlan.id.desc()).all()
    invoices = db.query(Invoice).filter(Invoice.patient_id == patient_id).order_by(Invoice.id.desc()).all()

    return {
        "patient": patient,
        "appointments_count": len(appointments),
        "appointments": appointments,
        "treatment_plans": treatment_plans,
        "prescriptions": prescriptions,
        "diet_plans": diet_plans,
        "invoices": invoices
    }

@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    
    update_data = patient_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(patient, field, val)
    
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    
    db.delete(patient)
    db.commit()
    return {"message": f"Patient {patient.full_name} ({patient.patient_id}) deleted successfully."}
