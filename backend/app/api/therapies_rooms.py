from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.models import Therapy, TreatmentRoom
from backend.app.schemas.schemas import (
    TherapyCreate, TherapyUpdate, TherapyOut,
    TreatmentRoomCreate, TreatmentRoomOut
)
from backend.app.api.deps import get_current_user

router = APIRouter(tags=["Therapies & Treatment Rooms"])

# Therapy Catalog Endpoints
@router.get("/therapies", response_model=List[TherapyOut])
def list_therapies(active_only: bool = True, db: Session = Depends(get_db), user = Depends(get_current_user)):
    query = db.query(Therapy)
    if active_only:
        query = query.filter(Therapy.is_active == True)
    return query.order_by(Therapy.name.asc()).all()

@router.get("/therapies/{therapy_id}", response_model=TherapyOut)
def get_therapy(therapy_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    th = db.query(Therapy).filter(Therapy.id == therapy_id).first()
    if not th:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapy not found.")
    return th

@router.post("/therapies", response_model=TherapyOut, status_code=status.HTTP_201_CREATED)
def create_therapy(th_in: TherapyUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Note: Using TherapyUpdate schema fields for create
    th = Therapy(
        name=th_in.name,
        code=th_in.code,
        description=th_in.description,
        default_duration_minutes=th_in.default_duration_minutes or 60,
        indicative_price=th_in.indicative_price or 1500.0,
        required_room_type=th_in.required_room_type or "General Therapy Suite",
        required_therapist_skills=th_in.required_therapist_skills or "General Panchakarma",
        preparation_instructions=th_in.preparation_instructions,
        precautions=th_in.precautions,
        is_active=th_in.is_active if th_in.is_active is not None else True
    )
    db.add(th)
    db.commit()
    db.refresh(th)
    return th

@router.put("/therapies/{therapy_id}", response_model=TherapyOut)
def update_therapy(therapy_id: int, th_in: TherapyUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    th = db.query(Therapy).filter(Therapy.id == therapy_id).first()
    if not th:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapy not found.")
    for field, val in th_in.dict(exclude_unset=True).items():
        setattr(th, field, val)
    db.commit()
    db.refresh(th)
    return th

# Treatment Rooms Endpoints
@router.get("/rooms", response_model=List[TreatmentRoomOut])
def list_rooms(db: Session = Depends(get_db), user = Depends(get_current_user)):
    return db.query(TreatmentRoom).filter(TreatmentRoom.is_active == True).order_by(TreatmentRoom.room_number.asc()).all()

@router.post("/rooms", response_model=TreatmentRoomOut, status_code=status.HTTP_201_CREATED)
def create_room(room_in: TreatmentRoomCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    room = TreatmentRoom(**room_in.dict())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room
