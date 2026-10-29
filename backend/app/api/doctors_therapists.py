from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.models import Doctor, Therapist, Appointment, AppointmentStatus
from backend.app.schemas.schemas import (
    DoctorCreate, DoctorUpdate, DoctorOut,
    TherapistCreate, TherapistUpdate, TherapistOut
)
from backend.app.api.deps import get_current_user

router = APIRouter(tags=["Doctors & Therapists"])

# Doctors Endpoints
@router.get("/doctors", response_model=List[DoctorOut])
def list_doctors(db: Session = Depends(get_db), user = Depends(get_current_user)):
    return db.query(Doctor).filter(Doctor.is_active == True).all()

@router.get("/doctors/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")
    return doc

@router.post("/doctors", response_model=DoctorOut, status_code=status.HTTP_201_CREATED)
def create_doctor(doc_in: DoctorCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    doc = Doctor(**doc_in.dict())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.put("/doctors/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, doc_in: DoctorUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")
    for field, val in doc_in.dict(exclude_unset=True).items():
        setattr(doc, field, val)
    db.commit()
    db.refresh(doc)
    return doc

# Therapists Endpoints
@router.get("/therapists", response_model=List[TherapistOut])
def list_therapists(db: Session = Depends(get_db), user = Depends(get_current_user)):
    return db.query(Therapist).all()

@router.get("/therapists/workload")
def get_therapists_workload(date: Optional[str] = None, db: Session = Depends(get_db), user = Depends(get_current_user)):
    target_date = date or datetime.utcnow().strftime("%Y-%m-%d")
    therapists = db.query(Therapist).all()

    active_statuses = [
        AppointmentStatus.SCHEDULED.value,
        AppointmentStatus.CONFIRMED.value,
        AppointmentStatus.IN_PROGRESS.value,
        AppointmentStatus.COMPLETED.value
    ]
    appts = db.query(Appointment).filter(
        Appointment.date == target_date,
        Appointment.status.in_(active_statuses)
    ).all()

    workload_summary = []
    for t in therapists:
        assigned = [a for a in appts if a.therapist_id == t.id]
        workload_summary.append({
            "therapist_id": t.id,
            "full_name": t.full_name,
            "qualification": t.qualification,
            "supported_therapies": t.supported_therapies,
            "working_hours": f"{t.working_hours_start} - {t.working_hours_end}",
            "is_available": t.is_available,
            "date": target_date,
            "assigned_sessions_count": len(assigned),
            "sessions": [
                {
                    "appointment_number": a.appointment_number,
                    "start_time": a.start_time,
                    "end_time": a.end_time,
                    "status": a.status
                }
                for a in assigned
            ]
        })
    return workload_summary

@router.get("/therapists/{therapist_id}", response_model=TherapistOut)
def get_therapist(therapist_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found.")
    return therapist

@router.post("/therapists", response_model=TherapistOut, status_code=status.HTTP_201_CREATED)
def create_therapist(t_in: TherapistCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    t = Therapist(**t_in.dict())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.put("/therapists/{therapist_id}", response_model=TherapistOut)
def update_therapist(therapist_id: int, t_in: TherapistUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    t = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found.")
    for field, val in t_in.dict(exclude_unset=True).items():
        setattr(t, field, val)
    db.commit()
    db.refresh(t)
    return t
