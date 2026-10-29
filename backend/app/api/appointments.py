from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.models import (
    Appointment, AppointmentStatus, Therapy, Therapist, TreatmentRoom, Patient, Doctor, Notification
)
from backend.app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from backend.app.services.scheduling_service import SchedulingService, calculate_end_time
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments & Scheduling"])

def generate_appointment_number(db: Session) -> str:
    count = db.query(Appointment).count() + 1
    return f"APT-2026-{count:04d}"

@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    patient_id: Optional[int] = None,
    therapist_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(Appointment)
    if date:
        query = query.filter(Appointment.date == date)
    if start_date and end_date:
        query = query.filter(Appointment.date >= start_date, Appointment.date <= end_date)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if therapist_id:
        query = query.filter(Appointment.therapist_id == therapist_id)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status_filter and status_filter != "All":
        query = query.filter(Appointment.status == status_filter)
    
    return query.order_by(Appointment.date.desc(), Appointment.start_time.asc()).all()

@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    return appt

@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Determine therapy duration
    therapy = db.query(Therapy).filter(Therapy.id == appt_in.therapy_id).first()
    if not therapy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapy not found.")

    duration = appt_in.duration_minutes or therapy.default_duration_minutes
    end_time = appt_in.end_time or calculate_end_time(appt_in.start_time, duration)

    # STRICT CONFLICT VALIDATION ON BACKEND
    SchedulingService.validate_and_check_conflicts(
        db=db,
        date_str=appt_in.date,
        start_time=appt_in.start_time,
        end_time=end_time,
        therapist_id=appt_in.therapist_id,
        room_id=appt_in.room_id,
        therapy_id=appt_in.therapy_id
    )

    appt_num = generate_appointment_number(db)
    appt_data = appt_in.dict()
    appt_data["appointment_number"] = appt_num
    appt_data["end_time"] = end_time
    appt_data["duration_minutes"] = duration

    appt = Appointment(**appt_data)
    db.add(appt)

    # In-app notification creation
    patient = db.query(Patient).filter(Patient.id == appt_in.patient_id).first()
    therapist = db.query(Therapist).filter(Therapist.id == appt_in.therapist_id).first()
    p_name = patient.full_name if patient else "Patient"
    t_name = therapist.full_name if therapist else "Therapist"

    notif = Notification(
        title="Appointment Scheduled",
        message=f"{therapy.name} scheduled for {p_name} on {appt_in.date} at {appt_in.start_time} with {t_name}.",
        notification_type="appointment",
        severity="success",
        link=f"/appointments?id={appt.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(appt)
    return appt

@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    appt_in: AppointmentUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    target_date = appt_in.date or appt.date
    target_start = appt_in.start_time or appt.start_time
    target_duration = appt_in.duration_minutes or appt.duration_minutes
    target_end = appt_in.end_time or calculate_end_time(target_start, target_duration)
    target_therapist_id = appt_in.therapist_id or appt.therapist_id
    target_room_id = appt_in.room_id or appt.room_id

    # If rescheduling date/time/room/therapist and not cancelling, re-check conflict
    is_rescheduling = (
        appt_in.date is not None or
        appt_in.start_time is not None or
        appt_in.therapist_id is not None or
        appt_in.room_id is not None
    )
    if is_rescheduling and appt_in.status != AppointmentStatus.CANCELLED.value:
        SchedulingService.validate_and_check_conflicts(
            db=db,
            date_str=target_date,
            start_time=target_start,
            end_time=target_end,
            therapist_id=target_therapist_id,
            room_id=target_room_id,
            therapy_id=appt.therapy_id,
            exclude_appointment_id=appointment_id
        )

    update_dict = appt_in.dict(exclude_unset=True)
    if "start_time" in update_dict and "end_time" not in update_dict:
        update_dict["end_time"] = target_end

    for field, val in update_dict.items():
        setattr(appt, field, val)

    # Notification on cancellation or rescheduling
    if appt_in.status == AppointmentStatus.CANCELLED.value:
        db.add(Notification(
            title="Appointment Cancelled",
            message=f"Appointment #{appt.appointment_number} on {appt.date} was cancelled. Reason: {appt.cancellation_reason or 'Not specified'}.",
            notification_type="appointment",
            severity="warning"
        ))

    db.commit()
    db.refresh(appt)
    return appt

@router.delete("/{appointment_id}", status_code=status.HTTP_200_OK)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    
    db.delete(appt)
    db.commit()
    return {"message": f"Appointment #{appt.appointment_number} removed successfully."}
