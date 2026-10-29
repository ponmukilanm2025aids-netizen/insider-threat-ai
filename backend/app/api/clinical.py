from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.models import (
    TreatmentPlan, TreatmentSession, Prescription, PrescriptionItem, DietPlan, Patient, Doctor
)
from backend.app.schemas.schemas import (
    TreatmentPlanCreate, TreatmentPlanUpdate, TreatmentPlanOut,
    TreatmentSessionCreate, TreatmentSessionOut,
    PrescriptionCreate, PrescriptionOut,
    DietPlanCreate, DietPlanUpdate, DietPlanOut
)
from backend.app.api.deps import get_current_user

router = APIRouter(tags=["Clinical - Plans, Sessions, Prescriptions & Diet"])

# 1. Treatment Plans Endpoints
@router.get("/treatment-plans", response_model=List[TreatmentPlanOut])
def list_treatment_plans(
    patient_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(TreatmentPlan)
    if patient_id:
        query = query.filter(TreatmentPlan.patient_id == patient_id)
    if status_filter and status_filter != "All":
        query = query.filter(TreatmentPlan.status == status_filter)
    return query.order_by(TreatmentPlan.id.desc()).all()

@router.post("/treatment-plans", response_model=TreatmentPlanOut, status_code=status.HTTP_201_CREATED)
def create_treatment_plan(
    plan_in: TreatmentPlanCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    count = db.query(TreatmentPlan).count() + 1
    plan_num = f"PLAN-2026-{count:04d}"

    plan_data = plan_in.dict()
    plan_data["plan_number"] = plan_num
    plan = TreatmentPlan(**plan_data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/treatment-plans/{plan_id}", response_model=TreatmentPlanOut)
def update_treatment_plan(
    plan_id: int,
    plan_in: TreatmentPlanUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found.")
    for field, val in plan_in.dict(exclude_unset=True).items():
        setattr(plan, field, val)
    db.commit()
    db.refresh(plan)
    return plan

# 2. Treatment Sessions Endpoints
@router.get("/treatment-sessions", response_model=List[TreatmentSessionOut])
def list_treatment_sessions(
    plan_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(TreatmentSession)
    if plan_id:
        query = query.filter(TreatmentSession.treatment_plan_id == plan_id)
    if patient_id:
        query = query.filter(TreatmentSession.patient_id == patient_id)
    return query.order_by(TreatmentSession.session_number.asc()).all()

@router.post("/treatment-sessions", response_model=TreatmentSessionOut, status_code=status.HTTP_201_CREATED)
def log_treatment_session(
    session_in: TreatmentSessionCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    sess = TreatmentSession(**session_in.dict())
    db.add(sess)

    # Increment completed sessions count on parent plan
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == session_in.treatment_plan_id).first()
    if plan:
        plan.completed_sessions += 1
        if plan.completed_sessions >= plan.total_sessions:
            plan.status = "Completed"

    db.commit()
    db.refresh(sess)
    return sess

# 3. Prescriptions Endpoints
@router.get("/prescriptions", response_model=List[PrescriptionOut])
def list_prescriptions(
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(Prescription)
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    return query.order_by(Prescription.id.desc()).all()

@router.get("/prescriptions/{rx_id}", response_model=PrescriptionOut)
def get_prescription(rx_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
    if not rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")
    return rx

@router.post("/prescriptions", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
def create_prescription(
    rx_in: PrescriptionCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    count = db.query(Prescription).count() + 1
    rx_num = f"RX-2026-{count:04d}"

    rx_dict = rx_in.dict(exclude={"items"})
    rx_dict["prescription_number"] = rx_num
    if not rx_dict.get("consultation_date"):
        rx_dict["consultation_date"] = datetime.utcnow().strftime("%Y-%m-%d")

    rx = Prescription(**rx_dict)
    db.add(rx)
    db.flush()

    for item in rx_in.items:
        db.add(PrescriptionItem(
            prescription_id=rx.id,
            medicine_name=item.medicine_name,
            dosage_form=item.dosage_form,
            dosage=item.dosage,
            timing=item.timing,
            frequency=item.frequency,
            duration_days=item.duration_days,
            instructions=item.instructions
        ))

    db.commit()
    db.refresh(rx)
    return rx

# 4. Diet Plans Endpoints
@router.get("/diet-plans", response_model=List[DietPlanOut])
def list_diet_plans(
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(DietPlan)
    if patient_id:
        query = query.filter(DietPlan.patient_id == patient_id)
    return query.order_by(DietPlan.id.desc()).all()

@router.post("/diet-plans", response_model=DietPlanOut, status_code=status.HTTP_201_CREATED)
def create_diet_plan(
    diet_in: DietPlanCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    count = db.query(DietPlan).count() + 1
    d_num = f"DIET-2026-{count:04d}"

    d_data = diet_in.dict()
    d_data["plan_number"] = d_num
    diet = DietPlan(**d_data)
    db.add(diet)
    db.commit()
    db.refresh(diet)
    return diet

@router.put("/diet-plans/{diet_id}", response_model=DietPlanOut)
def update_diet_plan(
    diet_id: int,
    diet_in: DietPlanUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    diet = db.query(DietPlan).filter(DietPlan.id == diet_id).first()
    if not diet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diet plan not found.")
    for field, val in diet_in.dict(exclude_unset=True).items():
        setattr(diet, field, val)
    db.commit()
    db.refresh(diet)
    return diet
