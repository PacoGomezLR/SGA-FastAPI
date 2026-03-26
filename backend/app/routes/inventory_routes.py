from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.inventory import (
    InventoryCreate,
    InventoryLineCreate,
    InventoryResponse,
    InventoryUpdate,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventories", tags=["Inventories"])


@router.get("/", response_model=list[InventoryResponse])
def get_inventories(db: Session = Depends(get_db)):
    service = InventoryService(db)
    return service.get_all_inventories()


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory(inventory_id: int, db: Session = Depends(get_db)):
    service = InventoryService(db)
    return service.get_inventory_by_id(inventory_id)


@router.post("/", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(inventory_data: InventoryCreate, db: Session = Depends(get_db)):
    service = InventoryService(db)

    # Usuario provisional hasta integrar autenticación real
    usuario_id = 3

    return service.create_inventory(inventory_data, usuario_id)


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    db: Session = Depends(get_db)
):
    service = InventoryService(db)
    return service.update_inventory(inventory_id, inventory_data)


@router.post("/{inventory_id}/lines", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def add_line_to_inventory(
    inventory_id: int,
    line_data: InventoryLineCreate,
    db: Session = Depends(get_db)
):
    service = InventoryService(db)
    service.add_line_to_inventory(inventory_id, line_data)
    return service.get_inventory_by_id(inventory_id)


@router.post("/{inventory_id}/count", response_model=InventoryResponse)
def mark_inventory_as_counted(inventory_id: int, db: Session = Depends(get_db)):
    service = InventoryService(db)
    return service.mark_inventory_as_counted(inventory_id)


@router.post("/{inventory_id}/adjust", response_model=InventoryResponse)
def apply_inventory_adjustment(inventory_id: int, db: Session = Depends(get_db)):
    service = InventoryService(db)
    return service.apply_inventory_adjustment(inventory_id)


@router.post("/{inventory_id}/lines/{line_id}/adjust", response_model=InventoryResponse)
def apply_line_adjustment(
    inventory_id: int,
    line_id: int,
    db: Session = Depends(get_db)
):
    service = InventoryService(db)
    return service.apply_line_adjustment(inventory_id, line_id)


@router.post("/{inventory_id}/cancel", response_model=InventoryResponse)
def cancel_inventory(inventory_id: int, db: Session = Depends(get_db)):
    service = InventoryService(db)
    return service.cancel_inventory(inventory_id)