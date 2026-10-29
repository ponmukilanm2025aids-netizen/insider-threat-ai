from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token, get_password_hash
from backend.app.models.models import User, UserRole
from backend.app.schemas.schemas import LoginRequest, Token, UserOut, UserCreate
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled.")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-accounts")
def get_demo_accounts():
    """Returns accessible demo accounts for development testing"""
    return [
        {
            "role": "ADMIN",
            "name": "Dr. Varma (Medical Director)",
            "email": "admin@ayursutra.hospital",
            "password": "Password123!",
            "description": "Full access to hospital administration, settings, audits, and billing"
        },
        {
            "role": "DOCTOR",
            "name": "Dr. Rajesh K (Ayurvedacharya)",
            "email": "doctor@ayursutra.hospital",
            "password": "Password123!",
            "description": "Prescriptions, Panchakarma protocols, clinical observation approval"
        },
        {
            "role": "THERAPIST",
            "name": "Suresh Nair (Lead Therapist)",
            "email": "therapist@ayursutra.hospital",
            "password": "Password123!",
            "description": "Daily treatment schedule, session notes, vitals and attendance logging"
        },
        {
            "role": "RECEPTIONIST",
            "name": "Pooja Menon (Front Desk)",
            "email": "reception@ayursutra.hospital",
            "password": "Password123!",
            "description": "Patient registration, appointment scheduling, billing, and invoices"
        }
    ]
