import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.models import User, Patient, Appointment, Therapist, TreatmentRoom, Therapy, InventoryItem

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_auth_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@ayursutra.hospital",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" == "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_auth_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@ayursutra.hospital",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_demo_accounts_endpoint():
    response = client.get("/api/v1/auth/demo-accounts")
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) == 4
    roles = [a["role"] for a in accounts]
    assert "ADMIN" in roles
    assert "DOCTOR" in roles
    assert "THERAPIST" in roles
    assert "RECEPTIONIST" in roles

def test_patient_crud():
    # 1. Create Patient
    unique_phone = f"+91 99999 {int(datetime.utcnow().timestamp()) % 100000:05d}"
    create_payload = {
        "full_name": "Kavitha Menon",
        "date_of_birth": "1992-06-12",
        "age": 33,
        "gender": "Female",
        "phone": unique_phone,
        "email": "kavitha.m@test.com",
        "address": "Ernakulam, Kochi",
        "prakriti": "Pitta-Vata",
        "allergies": "None",
        "medical_history": "Mild insomnia and digestive sluggishness"
    }
    create_res = client.post("/api/v1/patients", json=create_payload)
    assert create_res.status_code == 201
    created_patient = create_res.json()
    patient_id = created_patient["id"]
    assert created_patient["full_name"] == "Kavitha Menon"
    assert created_patient["patient_id"].startswith("AYUR-")

    # 2. Get Patient
    get_res = client.get(f"/api/v1/patients/{patient_id}")
    assert get_res.status_code == 200
    assert get_res.json()["phone"] == unique_phone

    # 3. Update Patient
    update_res = client.put(f"/api/v1/patients/{patient_id}", json={
        "allergies": "Sensitive to dust",
        "status": "In Treatment"
    })
    assert update_res.status_code == 200
    assert update_res.json()["allergies"] == "Sensitive to dust"
    assert update_res.json()["status"] == "In Treatment"

    # 4. Search Patient
    search_res = client.get(f"/api/v1/patients?search=Kavitha")
    assert search_res.status_code == 200
    assert any(p["id"] == patient_id for p in search_res.json())

    # 5. Delete Patient
    del_res = client.delete(f"/api/v1/patients/{patient_id}")
    assert del_res.status_code == 200

def test_appointment_therapist_scheduling_conflict():
    """Demonstrates that the system detects and rejects overlapping therapist bookings with HTTP 409 Conflict."""
    test_date = (datetime.utcnow() + timedelta(days=15)).strftime("%Y-%m-%d")
    
    # Create first appointment: Therapist 1, 09:00 - 10:00
    first_appt = {
        "patient_id": 1,
        "doctor_id": 1,
        "therapist_id": 1,
        "therapy_id": 1, # Abhyanga
        "room_id": 1,    # Room 101
        "date": test_date,
        "start_time": "09:00",
        "end_time": "10:00",
        "duration_minutes": 60,
        "status": "Scheduled"
    }
    res1 = client.post("/api/v1/appointments", json=first_appt)
    assert res1.status_code == 201, res1.text
    appt1_id = res1.json()["id"]

    try:
        # Create second appointment trying to book SAME therapist at overlapping time (09:30 - 10:30) in Room 2
        conflicting_appt = {
            "patient_id": 2,
            "doctor_id": 1,
            "therapist_id": 1, # SAME THERAPIST
            "therapy_id": 1,
            "room_id": 2,      # Different room
            "date": test_date,
            "start_time": "09:30",
            "end_time": "10:30",
            "duration_minutes": 60,
            "status": "Scheduled"
        }
        res2 = client.post("/api/v1/appointments", json=conflicting_appt)
        # Must return 409 Conflict
        assert res2.status_code == 409
        assert "Scheduling Conflict" in res2.json()["detail"]
        assert "Therapist" in res2.json()["detail"]
    finally:
        # Cleanup
        client.delete(f"/api/v1/appointments/{appt1_id}")

def test_appointment_room_scheduling_conflict():
    """Demonstrates that the system detects and rejects overlapping room bookings with HTTP 409 Conflict."""
    test_date = (datetime.utcnow() + timedelta(days=16)).strftime("%Y-%m-%d")

    # Book room 101 with Therapist 1 from 14:00 to 15:00
    res1 = client.post("/api/v1/appointments", json={
        "patient_id": 1,
        "doctor_id": 1,
        "therapist_id": 1,
        "therapy_id": 1,
        "room_id": 1,
        "date": test_date,
        "start_time": "14:00",
        "end_time": "15:00",
        "duration_minutes": 60,
        "status": "Scheduled"
    })
    assert res1.status_code == 201
    appt1_id = res1.json()["id"]

    try:
        # Try to book SAME room 101 with Therapist 2 from 14:15 to 15:15
        conflicting_appt = {
            "patient_id": 2,
            "doctor_id": 2,
            "therapist_id": 2, # Different therapist
            "therapy_id": 1,
            "room_id": 1,      # SAME ROOM
            "date": test_date,
            "start_time": "14:15",
            "end_time": "15:15",
            "duration_minutes": 60,
            "status": "Scheduled"
        }
        res2 = client.post("/api/v1/appointments", json=conflicting_appt)
        # Must return 409 Conflict
        assert res2.status_code == 409
        assert "Scheduling Conflict" in res2.json()["detail"]
        assert "Treatment Room" in res2.json()["detail"]
    finally:
        # Cleanup
        client.delete(f"/api/v1/appointments/{appt1_id}")

def test_ai_scheduling_recommender():
    test_date = (datetime.utcnow() + timedelta(days=20)).strftime("%Y-%m-%d")
    payload = {
        "therapy_id": 2, # Shirodhara
        "preferred_date": test_date,
        "preferred_time_of_day": "Morning",
        "patient_id": 1
    }
    res = client.post("/api/v1/scheduling/recommend-slots", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["therapy_name"] == "Shirodhara"
    assert len(data["suggestions"]) > 0
    top_suggestion = data["suggestions"][0]
    assert top_suggestion["score"] > 0.0
    assert len(top_suggestion["explanation"]) > 0
    assert top_suggestion["is_conflict_free"] is True

def test_inventory_usage_and_alert():
    db = SessionLocal()
    item = db.query(InventoryItem).filter(InventoryItem.item_code == "OIL-003").first()
    original_qty = item.stock_quantity
    item_id = item.id
    db.close()

    # Log usage
    tx_payload = {
        "item_id": item_id,
        "transaction_type": "Usage",
        "quantity": 100.0,
        "reference_note": "Prepared Abhyanga warm oil for session",
        "created_by": "Therapist Suresh"
    }
    tx_res = client.post("/api/v1/inventory/transactions", json=tx_payload)
    assert tx_res.status_code == 201

    # Check updated quantity
    get_res = client.get(f"/api/v1/inventory/items/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["stock_quantity"] == original_qty - 100.0

def test_billing_invoice_creation_and_payment():
    payload = {
        "patient_id": 1,
        "subtotal": 2000.0,
        "discount": 100.0,
        "tax_amount": 95.0,
        "total_amount": 1995.0,
        "paid_amount": 0.0,
        "payment_status": "Pending",
        "payment_method": "Cash",
        "items": [
            {
                "description": "Udvartana Therapy Session",
                "item_type": "Therapy",
                "quantity": 1,
                "unit_price": 2000.0,
                "total_price": 2000.0
            }
        ]
    }
    res = client.post("/api/v1/billing/invoices", json=payload)
    assert res.status_code == 201
    inv = res.json()
    inv_id = inv["id"]
    assert inv["payment_status"] == "Pending"

    # Settle payment
    pay_res = client.put(f"/api/v1/billing/invoices/{inv_id}/pay?amount=1995.0&payment_method=UPI")
    assert pay_res.status_code == 200
    assert pay_res.json()["payment_status"] == "Paid"
    assert pay_res.json()["paid_amount"] == 1995.0

def test_dashboard_stats():
    res = client.get("/api/v1/reports/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_patients"] >= 5
    assert "total_appointments" in data
    assert "completed_treatments" in data
    assert "weekly_appointments" in data
    assert "therapy_distribution" in data
    assert "upcoming_appointments" in data

def test_patient_search_by_name_and_id():
    # Search by existing patient name
    res1 = client.get("/api/v1/patients/search?q=Meenakshi")
    assert res1.status_code == 200
    results1 = res1.json()
    assert len(results1) > 0
    assert any("Meenakshi" in p["full_name"] for p in results1)

    # Search by AYUR ID
    res2 = client.get("/api/v1/patients/search?q=AYUR-2026")
    assert res2.status_code == 200
    results2 = res2.json()
    assert len(results2) > 0
    assert all("AYUR-2026" in p["patient_id"] for p in results2)

def test_appointment_status_updates():
    # Fetch first appointment
    res = client.get("/api/v1/appointments")
    assert res.status_code == 200
    appts = res.json()
    assert len(appts) > 0
    appt_id = appts[0]["id"]

    # 1. Update to Completed
    res_comp = client.put(f"/api/v1/appointments/{appt_id}", json={"status": "Completed"})
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "Completed"

    # 2. Update to Cancelled
    res_canc = client.put(f"/api/v1/appointments/{appt_id}", json={"status": "Cancelled"})
    assert res_canc.status_code == 200
    assert res_canc.json()["status"] == "Cancelled"

    # 3. Update back to Scheduled
    res_sched = client.put(f"/api/v1/appointments/{appt_id}", json={"status": "Scheduled"})
    assert res_sched.status_code == 200
    assert res_sched.json()["status"] == "Scheduled"
