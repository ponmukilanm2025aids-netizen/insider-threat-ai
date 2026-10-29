from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.models import Invoice, InvoiceItem, Patient, Appointment
from backend.app.schemas.schemas import InvoiceCreate, InvoiceOut
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/billing", tags=["Billing & Payments"])

def generate_invoice_number(db: Session) -> str:
    count = db.query(Invoice).count() + 1
    return f"INV-2026-{count:04d}"

@router.get("/invoices", response_model=List[InvoiceOut])
def list_invoices(
    patient_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(Invoice)
    if patient_id:
        query = query.filter(Invoice.patient_id == patient_id)
    if payment_status and payment_status != "All":
        query = query.filter(Invoice.payment_status == payment_status)
    return query.order_by(Invoice.id.desc()).all()

@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
    return inv

@router.post("/invoices", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    inv_in: InvoiceCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    inv_num = generate_invoice_number(db)
    inv_dict = inv_in.dict(exclude={"items"})
    inv_dict["invoice_number"] = inv_num
    if not inv_dict.get("invoice_date"):
        inv_dict["invoice_date"] = datetime.utcnow().strftime("%Y-%m-%d")

    inv = Invoice(**inv_dict)
    db.add(inv)
    db.flush()

    for item in inv_in.items:
        db.add(InvoiceItem(
            invoice_id=inv.id,
            description=item.description,
            item_type=item.item_type,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        ))

    db.commit()
    db.refresh(inv)
    return inv

@router.put("/invoices/{invoice_id}/pay", response_model=InvoiceOut)
def record_payment(
    invoice_id: int,
    amount: float,
    payment_method: str = "UPI",
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    inv.paid_amount += amount
    inv.payment_method = payment_method

    if inv.paid_amount >= inv.total_amount:
        inv.payment_status = "Paid"
    elif inv.paid_amount > 0:
        inv.payment_status = "Partial"
    else:
        inv.payment_status = "Pending"

    db.commit()
    db.refresh(inv)
    return inv
