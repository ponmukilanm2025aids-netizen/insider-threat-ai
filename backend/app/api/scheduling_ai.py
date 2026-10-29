from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.app.core.database import get_db
from backend.app.services.ai_scheduling_service import AISchedulingService
from backend.app.services.scheduling_service import SchedulingService, calculate_end_time
from backend.app.schemas.schemas import AISlotRecommendationRequest, AISlotRecommendationResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/scheduling", tags=["AI Scheduling Engine"])

@router.post("/recommend-slots", response_model=AISlotRecommendationResponse)
def recommend_slots(
    request: AISlotRecommendationRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Ranks feasible appointment slots using transparent Ayurvedic operational constraints:
    therapist certification, room suitability, workload balancing, patient preference,
    and scikit-learn regression fitness prototype.
    """
    result = AISchedulingService.recommend_optimal_slots(
        db=db,
        therapy_id=request.therapy_id,
        date_str=request.preferred_date,
        preferred_time_of_day=request.preferred_time_of_day or "Any",
        patient_id=request.patient_id
    )
    return result

@router.get("/check-conflict")
def preview_conflict_check(
    date: str,
    start_time: str,
    duration_minutes: int,
    therapist_id: int,
    room_id: int,
    therapy_id: int,
    exclude_appointment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Dry-run conflict checking. If conflict exists, returns conflict reason and
    automatically searches for available alternative slots on the same day.
    """
    end_time = calculate_end_time(start_time, duration_minutes)
    try:
        SchedulingService.validate_and_check_conflicts(
            db=db,
            date_str=date,
            start_time=start_time,
            end_time=end_time,
            therapist_id=therapist_id,
            room_id=room_id,
            therapy_id=therapy_id,
            exclude_appointment_id=exclude_appointment_id
        )
        return {
            "has_conflict": False,
            "message": "Slot is fully available and conflict-free.",
            "alternatives": []
        }
    except HTTPException as e:
        alternatives = SchedulingService.find_alternative_slots(
            db=db,
            date_str=date,
            therapy_id=therapy_id,
            duration_minutes=duration_minutes
        )
        return {
            "has_conflict": True,
            "conflict_status": e.status_code,
            "conflict_detail": e.detail,
            "message": e.detail,
            "alternatives": alternatives
        }
