import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestRegressor
from backend.app.models.models import Therapist, TreatmentRoom, Therapy, Appointment, AppointmentStatus
from backend.app.services.scheduling_service import parse_time_minutes, minutes_to_time, calculate_end_time, check_time_overlap

# Initialize a demonstration AI heuristic regressor trained on simulated operational slot efficiency
def _init_prototype_model() -> RandomForestRegressor:
    """
    Initializes a scikit-learn RandomForest prototype model.
    Feature vector: [hour_of_day, session_duration_hrs, current_therapist_daily_load, room_suitability_score]
    Target: operational efficiency score (0.0 to 1.0)
    Note: Demonstrative operational model for SIH25023; not clinically validated.
    """
    X_sample = np.array([
        [9, 1.0, 1, 1.0],  # Morning, normal load, ideal room -> optimal
        [10, 1.5, 2, 0.9],
        [11, 1.0, 3, 0.8],
        [14, 1.0, 1, 1.0], # Early afternoon
        [15, 1.5, 4, 0.7], # High workload
        [17, 1.0, 5, 0.6], # Late evening, tired therapist
        [8, 1.0, 0, 1.0],  # Fresh morning start
        [12, 2.0, 4, 0.5], # Heavy session during lunch
    ])
    y_sample = np.array([0.95, 0.88, 0.80, 0.89, 0.70, 0.58, 0.94, 0.52])
    
    model = RandomForestRegressor(n_estimators=10, random_state=42)
    model.fit(X_sample, y_sample)
    return model

ai_efficiency_model = _init_prototype_model()

class AISchedulingService:

    @classmethod
    def recommend_optimal_slots(
        cls,
        db: Session,
        therapy_id: int,
        date_str: str,
        preferred_time_of_day: str = "Any",
        patient_id: Optional[int] = None,
        max_suggestions: int = 5
    ) -> Dict[str, Any]:
        """
        Synthesizes operational constraints, therapist qualifications, workload balance,
        and machine-learning scoring to provide transparently ranked slot suggestions.
        """
        therapy = db.query(Therapy).filter(Therapy.id == therapy_id).first()
        if not therapy:
            return {
                "therapy_name": "Unknown",
                "duration_minutes": 60,
                "date": date_str,
                "suggestions": [],
                "algorithm_info": "Therapy not found"
            }

        duration = therapy.default_duration_minutes
        therapists = db.query(Therapist).filter(Therapist.is_available == True).all()
        rooms = db.query(TreatmentRoom).filter(TreatmentRoom.is_active == True).all()

        active_statuses = [
            AppointmentStatus.SCHEDULED.value,
            AppointmentStatus.CONFIRMED.value,
            AppointmentStatus.IN_PROGRESS.value
        ]
        daily_appts = db.query(Appointment).filter(
            Appointment.date == date_str,
            Appointment.status.in_(active_statuses)
        ).all()

        # Compute current workload per therapist today
        therapist_load = {t.id: 0 for t in therapists}
        for appt in daily_appts:
            if appt.therapist_id in therapist_load:
                therapist_load[appt.therapist_id] += 1

        candidate_time_windows = [
            ("08:30", "Morning"),
            ("09:30", "Morning"),
            ("10:30", "Morning"),
            ("11:30", "Morning"),
            ("14:00", "Afternoon"),
            ("15:00", "Afternoon"),
            ("16:00", "Evening"),
            ("17:00", "Evening"),
        ]

        # Filter by preference if specified
        if preferred_time_of_day and preferred_time_of_day != "Any":
            candidate_time_windows = [
                (t, tod) for (t, tod) in candidate_time_windows
                if tod.lower() == preferred_time_of_day.lower()
            ] or candidate_time_windows # Fallback to all if none in range

        feasible_slots = []

        for slot_start, time_of_day in candidate_time_windows:
            slot_end = calculate_end_time(slot_start, duration)
            start_m = parse_time_minutes(slot_start)
            end_m = parse_time_minutes(slot_end)
            hour_val = start_m / 60.0

            for therapist in therapists:
                # 1. Skill certification check
                supported = [s.strip().lower() for s in therapist.supported_therapies.split(",")]
                is_qualified = any(therapy.name.lower() in s or s in therapy.name.lower() for s in supported) or "panchakarma" in therapist.qualification.lower()
                if not is_qualified:
                    continue

                # 2. Operating hours check
                w_start = parse_time_minutes(therapist.working_hours_start)
                w_end = parse_time_minutes(therapist.working_hours_end)
                if start_m < w_start or end_m > w_end:
                    continue

                # 3. Therapist conflict check
                has_t_conflict = any(
                    a.therapist_id == therapist.id and check_time_overlap(slot_start, slot_end, a.start_time, a.end_time)
                    for a in daily_appts
                )
                if has_t_conflict:
                    continue

                for room in rooms:
                    # 4. Room conflict check
                    has_r_conflict = any(
                        a.room_id == room.id and check_time_overlap(slot_start, slot_end, a.start_time, a.end_time)
                        for a in daily_appts
                    )
                    if has_r_conflict:
                        continue

                    # Room suitability
                    room_suitability = 1.0 if therapy.required_room_type.lower() in room.room_type.lower() else 0.85

                    # Current therapist load
                    current_load = therapist_load.get(therapist.id, 0)

                    # Explainable Rule Score breakdown
                    explanation_points = []
                    rule_score = 0.0

                    # Factor 1: Qualification & Skills
                    rule_score += 0.35
                    explanation_points.append(f"Certified: {therapist.full_name} specializes in {therapy.name}")

                    # Factor 2: Conflict freedom
                    rule_score += 0.30
                    explanation_points.append(f"Zero overlap: Therapist & Room '{room.name}' fully available")

                    # Factor 3: Workload balance
                    if current_load <= 2:
                        rule_score += 0.20
                        explanation_points.append(f"Optimal therapist energy: {current_load} session(s) prior today")
                    elif current_load <= 4:
                        rule_score += 0.12
                        explanation_points.append(f"Moderate workload: {current_load} session(s) scheduled")
                    else:
                        rule_score += 0.05
                        explanation_points.append(f"High workload: {current_load} sessions today")

                    # Factor 4: Room match
                    if room_suitability == 1.0:
                        rule_score += 0.15
                        explanation_points.append(f"Dedicated {room.room_type} equipped with required Panchakarma apparatus")
                    else:
                        rule_score += 0.10
                        explanation_points.append(f"Adaptable suite available with standard amenities")

                    # Factor 5: scikit-learn regressor prototype augmentation
                    features = np.array([[hour_val, duration / 60.0, current_load, room_suitability]])
                    ml_pred = float(ai_efficiency_model.predict(features)[0])

                    # Blended score (70% explainable rules + 30% ML operational prototype)
                    final_score = round(0.70 * rule_score + 0.30 * ml_pred, 2)
                    final_score = min(max(final_score, 0.50), 0.99)

                    if final_score >= 0.85:
                        confidence = "Optimal"
                    elif final_score >= 0.70:
                        confidence = "High"
                    else:
                        confidence = "Good"

                    explanation_points.append(f"ML operational fitness rating: {int(ml_pred * 100)}%")

                    feasible_slots.append({
                        "slot_id": f"{date_str}_{slot_start}_{therapist.id}_{room.id}",
                        "date": date_str,
                        "start_time": slot_start,
                        "end_time": slot_end,
                        "therapist_id": therapist.id,
                        "therapist_name": therapist.full_name,
                        "room_id": room.id,
                        "room_name": f"{room.name} ({room.room_number})",
                        "score": final_score,
                        "confidence_level": confidence,
                        "explanation": explanation_points,
                        "is_conflict_free": True
                    })

        # Sort slots descending by score
        feasible_slots.sort(key=lambda x: x["score"], reverse=True)

        return {
            "therapy_name": therapy.name,
            "duration_minutes": duration,
            "date": date_str,
            "suggestions": feasible_slots[:max_suggestions],
            "algorithm_info": "Hybrid Explainable Rule Engine + scikit-learn RandomForest Operational prototype. Note: Operational decision support; clinical approval remains with authorized doctors."
        }
