from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.models import Appointment, Therapist, TreatmentRoom, Therapy, AppointmentStatus

def parse_time_minutes(time_str: str) -> int:
    """Converts HH:MM string to minutes since midnight."""
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def minutes_to_time(minutes: int) -> str:
    """Converts minutes since midnight to HH:MM format."""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"

def calculate_end_time(start_time: str, duration_minutes: int) -> str:
    """Calculates end time HH:MM given start time and duration in minutes."""
    start_mins = parse_time_minutes(start_time)
    end_mins = start_mins + duration_minutes
    return minutes_to_time(end_mins)

def check_time_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """Returns True if the two time ranges overlap."""
    s1, e1 = parse_time_minutes(start1), parse_time_minutes(end1)
    s2, e2 = parse_time_minutes(start2), parse_time_minutes(end2)
    return max(s1, s2) < min(e1, e2)

class SchedulingService:

    @staticmethod
    def validate_and_check_conflicts(
        db: Session,
        date_str: str,
        start_time: str,
        end_time: str,
        therapist_id: int,
        room_id: int,
        therapy_id: int,
        exclude_appointment_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Rigorous validation for scheduling rules:
        1. Checks therapist qualification for therapy.
        2. Checks therapist working hours.
        3. Checks therapist overlapping appointments.
        4. Checks room overlapping appointments.
        Raises HTTPException(409 Conflict) with clear details if conflict exists.
        """
        # Fetch entities
        therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
        if not therapist:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found.")
        
        room = db.query(TreatmentRoom).filter(TreatmentRoom.id == room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment room not found.")
        
        therapy = db.query(Therapy).filter(Therapy.id == therapy_id).first()
        if not therapy:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapy not found.")

        # 1. Therapist qualification check
        supported = [s.strip().lower() for s in therapist.supported_therapies.split(",")]
        therapy_name_lower = therapy.name.lower()
        # Allow if therapy name matches or "general" is in qualifications
        is_qualified = any(t in therapy_name_lower or therapy_name_lower in t for t in supported) or "panchakarma" in therapist.qualification.lower()
        if not is_qualified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Therapist {therapist.full_name} is not certified for {therapy.name}. Supported: {therapist.supported_therapies}"
            )

        # 2. Therapist working hours check
        appt_start_m = parse_time_minutes(start_time)
        appt_end_m = parse_time_minutes(end_time)
        work_start_m = parse_time_minutes(therapist.working_hours_start)
        work_end_m = parse_time_minutes(therapist.working_hours_end)

        if appt_start_m < work_start_m or appt_end_m > work_end_m:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested time ({start_time} - {end_time}) falls outside therapist working hours ({therapist.working_hours_start} - {therapist.working_hours_end})."
            )

        # 3. Check therapist overlapping appointments
        active_statuses = [
            AppointmentStatus.SCHEDULED.value,
            AppointmentStatus.CONFIRMED.value,
            AppointmentStatus.IN_PROGRESS.value
        ]

        therapist_appts_query = db.query(Appointment).filter(
            Appointment.date == date_str,
            Appointment.therapist_id == therapist_id,
            Appointment.status.in_(active_statuses)
        )
        if exclude_appointment_id:
            therapist_appts_query = therapist_appts_query.filter(Appointment.id != exclude_appointment_id)
        
        therapist_appts = therapist_appts_query.all()
        for appt in therapist_appts:
            if check_time_overlap(start_time, end_time, appt.start_time, appt.end_time):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Scheduling Conflict: Therapist {therapist.full_name} is already booked for appointment #{appt.appointment_number} from {appt.start_time} to {appt.end_time}."
                )

        # 4. Check room overlapping appointments
        room_appts_query = db.query(Appointment).filter(
            Appointment.date == date_str,
            Appointment.room_id == room_id,
            Appointment.status.in_(active_statuses)
        )
        if exclude_appointment_id:
            room_appts_query = room_appts_query.filter(Appointment.id != exclude_appointment_id)
        
        room_appts = room_appts_query.all()
        for appt in room_appts:
            if check_time_overlap(start_time, end_time, appt.start_time, appt.end_time):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Scheduling Conflict: Treatment Room '{room.name}' ({room.room_number}) is already reserved from {appt.start_time} to {appt.end_time} for #{appt.appointment_number}."
                )

        return {
            "valid": True,
            "message": "Slot is verified and conflict-free."
        }

    @staticmethod
    def find_alternative_slots(
        db: Session,
        date_str: str,
        therapy_id: int,
        duration_minutes: int,
        preferred_time: Optional[str] = None
    ) -> List[Dict]:
        """Scans therapists and rooms to locate feasible conflict-free alternative slots."""
        therapists = db.query(Therapist).filter(Therapist.is_available == True).all()
        rooms = db.query(TreatmentRoom).filter(TreatmentRoom.is_active == True).all()
        therapy = db.query(Therapy).filter(Therapy.id == therapy_id).first()
        if not therapy:
            return []

        active_statuses = [
            AppointmentStatus.SCHEDULED.value,
            AppointmentStatus.CONFIRMED.value,
            AppointmentStatus.IN_PROGRESS.value
        ]
        existing_appts = db.query(Appointment).filter(
            Appointment.date == date_str,
            Appointment.status.in_(active_statuses)
        ).all()

        slots = ["08:30", "09:30", "10:30", "11:30", "14:00", "15:00", "16:00", "17:00"]
        alternatives = []

        for slot_start in slots:
            slot_end = calculate_end_time(slot_start, duration_minutes)
            start_m = parse_time_minutes(slot_start)
            end_m = parse_time_minutes(slot_end)

            for therapist in therapists:
                # check hours
                if start_m < parse_time_minutes(therapist.working_hours_start) or end_m > parse_time_minutes(therapist.working_hours_end):
                    continue
                # check overlap
                t_conflict = any(
                    a.therapist_id == therapist.id and check_time_overlap(slot_start, slot_end, a.start_time, a.end_time)
                    for a in existing_appts
                )
                if t_conflict:
                    continue

                for room in rooms:
                    r_conflict = any(
                        a.room_id == room.id and check_time_overlap(slot_start, slot_end, a.start_time, a.end_time)
                        for a in existing_appts
                    )
                    if r_conflict:
                        continue

                    alternatives.append({
                        "date": date_str,
                        "start_time": slot_start,
                        "end_time": slot_end,
                        "therapist_id": therapist.id,
                        "therapist_name": therapist.full_name,
                        "room_id": room.id,
                        "room_name": room.name,
                    })
                    if len(alternatives) >= 5:
                        return alternatives

        return alternatives
