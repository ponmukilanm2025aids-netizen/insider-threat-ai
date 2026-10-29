from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from backend.app.core.database import get_db
from backend.app.models.models import InventoryItem, InventoryTransaction, Notification
from backend.app.schemas.schemas import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemOut,
    InventoryTransactionCreate, InventoryTransactionOut
)
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory & Pharmacy Management"])

@router.get("/items", response_model=List[InventoryItemOut])
def list_inventory_items(
    category: Optional[str] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(InventoryItem)
    if category and category != "All":
        query = query.filter(InventoryItem.category == category)
    if low_stock_only:
        query = query.filter(InventoryItem.stock_quantity <= InventoryItem.reorder_threshold)
    return query.order_by(InventoryItem.name.asc()).all()

@router.get("/items/{item_id}", response_model=InventoryItemOut)
def get_inventory_item(item_id: int, db: Session = Depends(get_db), user = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found.")
    return item

@router.post("/items", response_model=InventoryItemOut, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_in: InventoryItemCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    existing = db.query(InventoryItem).filter(InventoryItem.item_code == item_in.item_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Item code {item_in.item_code} already exists.")
    
    item = InventoryItem(**item_in.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/items/{item_id}", response_model=InventoryItemOut)
def update_inventory_item(
    item_id: int,
    item_in: InventoryItemUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found.")
    
    for field, val in item_in.dict(exclude_unset=True).items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return item

@router.post("/transactions", response_model=InventoryTransactionOut, status_code=status.HTTP_201_CREATED)
def log_inventory_transaction(
    tx_in: InventoryTransactionCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == tx_in.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found.")

    if tx_in.transaction_type in ["Usage", "Wastage"]:
        if item.stock_quantity < tx_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {item.name}. Available: {item.stock_quantity} {item.unit}, Requested: {tx_in.quantity} {item.unit}"
            )
        item.stock_quantity -= tx_in.quantity
    elif tx_in.transaction_type in ["Inward", "Return"]:
        item.stock_quantity += tx_in.quantity

    tx = InventoryTransaction(**tx_in.dict())
    db.add(tx)

    # Check for low-stock condition
    if item.stock_quantity <= item.reorder_threshold:
        db.add(Notification(
            title="Low Stock Alert",
            message=f"{item.name} is low on stock ({item.stock_quantity} {item.unit} remaining, reorder threshold {item.reorder_threshold} {item.unit}).",
            notification_type="inventory",
            severity="warning",
            link="/inventory"
        ))

    db.commit()
    db.refresh(tx)
    return tx

@router.get("/alerts")
def get_inventory_alerts(db: Session = Depends(get_db), user = Depends(get_current_user)):
    items = db.query(InventoryItem).all()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    sixty_days_ahead = (datetime.utcnow() + timedelta(days=60)).strftime("%Y-%m-%d")

    low_stock = []
    near_expiry = []
    expired = []

    for item in items:
        if item.stock_quantity <= item.reorder_threshold:
            low_stock.append({
                "id": item.id,
                "name": item.name,
                "item_code": item.item_code,
                "stock": item.stock_quantity,
                "reorder_threshold": item.reorder_threshold,
                "unit": item.unit
            })
        if item.expiry_date < today_str:
            expired.append({
                "id": item.id,
                "name": item.name,
                "batch_number": item.batch_number,
                "expiry_date": item.expiry_date
            })
        elif item.expiry_date <= sixty_days_ahead:
            near_expiry.append({
                "id": item.id,
                "name": item.name,
                "batch_number": item.batch_number,
                "expiry_date": item.expiry_date
            })

    return {
        "low_stock": low_stock,
        "near_expiry": near_expiry,
        "expired": expired,
        "total_alerts": len(low_stock) + len(near_expiry) + len(expired)
    }
