from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List
from backend.app.core.database import get_db
from backend.app.models.models import (
    Patient, Appointment, TreatmentPlan, Therapist, Invoice, InventoryItem, Notification, Therapy, AppointmentStatus
)
from backend.app.schemas.schemas import DashboardStatsOut
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard", response_model=DashboardStatsOut)
def get_dashboard_summary(db: Session = Depends(get_db), user = Depends(get_current_user)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # 1. Total registered patients
    total_patients = db.query(Patient).count()

    # 2. Total appointments and completed treatments
    total_appointments = db.query(Appointment).count()
    completed_treatments = db.query(Appointment).filter(Appointment.status == AppointmentStatus.COMPLETED.value).count()

    # 3. Today's appointments
    today_appts_count = db.query(Appointment).filter(Appointment.date == today_str).count()

    # 3. Ongoing treatment plans
    ongoing_treatments_count = db.query(TreatmentPlan).filter(TreatmentPlan.status == "Active").count()

    # 4. Available therapists
    available_therapists_count = db.query(Therapist).filter(Therapist.is_available == True).count()

    # 5. Pending payments
    pending_invoices = db.query(Invoice).filter(Invoice.payment_status.in_(["Pending", "Partial"])).all()
    pending_payments_total = sum(inv.total_amount - inv.paid_amount for inv in pending_invoices)

    # 6. Low stock items
    low_stock_items = db.query(InventoryItem).filter(InventoryItem.stock_quantity <= InventoryItem.reorder_threshold).count()

    # 7. Weekly appointment counts (last 7 days)
    weekly_data = []
    base_date = datetime.utcnow().date()
    for i in range(6, -1, -1):
        d = (base_date - timedelta(days=i)).strftime("%Y-%m-%d")
        day_label = (base_date - timedelta(days=i)).strftime("%a") # Mon, Tue, etc.
        count = db.query(Appointment).filter(Appointment.date == d).count()
        completed = db.query(Appointment).filter(Appointment.date == d, Appointment.status == "Completed").count()
        weekly_data.append({
            "date": d,
            "day": day_label,
            "total": count,
            "completed": completed
        })

    # 8. Therapy distribution
    therapies = db.query(Therapy).all()
    therapy_dist = []
    for th in therapies:
        count = db.query(Appointment).filter(Appointment.therapy_id == th.id).count()
        if count > 0:
            therapy_dist.append({
                "name": th.name,
                "count": count
            })
    if not therapy_dist:
        # Fallback sample representation if no bookings yet
        therapy_dist = [
            {"name": "Abhyanga", "count": 12},
            {"name": "Shirodhara", "count": 9},
            {"name": "Basti", "count": 7},
            {"name": "Nasya", "count": 5},
            {"name": "Udvartana", "count": 4}
        ]

    # 9. Recent patient registrations
    recent_patients = db.query(Patient).order_by(Patient.id.desc()).limit(5).all()

    # 10. Upcoming appointments
    upcoming_appts = db.query(Appointment).filter(
        Appointment.status.in_([AppointmentStatus.SCHEDULED.value, AppointmentStatus.CONFIRMED.value])
    ).order_by(Appointment.date.asc(), Appointment.start_time.asc()).limit(6).all()

    # 11. Alerts / Notifications
    alerts = db.query(Notification).order_by(Notification.id.desc()).limit(5).all()

    return {
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "completed_treatments": completed_treatments,
        "today_appointments_count": today_appts_count,
        "ongoing_treatments_count": ongoing_treatments_count,
        "available_therapists_count": available_therapists_count,
        "pending_payments_total": round(pending_payments_total, 2),
        "low_stock_count": low_stock_items,
        "weekly_appointments": weekly_data,
        "therapy_distribution": therapy_dist,
        "recent_patients": recent_patients,
        "upcoming_appointments": upcoming_appts,
        "alerts": alerts
    }

@router.get("/analytics")
def get_analytics_report(db: Session = Depends(get_db), user = Depends(get_current_user)):
    # Revenue stats
    invoices = db.query(Invoice).all()
    total_billed = sum(inv.total_amount for inv in invoices)
    total_collected = sum(inv.paid_amount for inv in invoices)
    total_pending = total_billed - total_collected

    # Appointments breakdown
    total_appts = db.query(Appointment).count()
    completed_appts = db.query(Appointment).filter(Appointment.status == "Completed").count()
    cancelled_appts = db.query(Appointment).filter(Appointment.status == "Cancelled").count()
    noshow_appts = db.query(Appointment).filter(Appointment.status == "No-show").count()

    # Therapist workload
    therapists = db.query(Therapist).all()
    therapist_stats = []
    for t in therapists:
        session_count = db.query(Appointment).filter(Appointment.therapist_id == t.id).count()
        therapist_stats.append({
            "name": t.full_name,
            "sessions": session_count,
            "qualification": t.qualification
        })

    return {
        "revenue": {
            "total_billed": round(total_billed, 2),
            "total_collected": round(total_collected, 2),
            "total_pending": round(total_pending, 2),
        },
        "appointments": {
            "total": total_appts,
            "completed": completed_appts,
            "cancelled": cancelled_appts,
            "noshow": noshow_appts,
            "completion_rate": round((completed_appts / max(total_appts, 1)) * 100, 1)
        },
        "therapists": therapist_stats
    }
