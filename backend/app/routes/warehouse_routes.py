from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseResponse
from app.services.warehouse_service import WarehouseService

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@router.get("/", response_model=list[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    service = WarehouseService(db)
    return service.get_all_warehouses()


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    service = WarehouseService(db)
    return service.get_warehouse_by_id(warehouse_id)


@router.post("/", response_model=WarehouseResponse, status_code=201)
def create_warehouse(warehouse_data: WarehouseCreate, db: Session = Depends(get_db)):
    service = WarehouseService(db)
    return service.create_warehouse(warehouse_data)


@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(warehouse_id: int, warehouse_data: WarehouseUpdate, db: Session = Depends(get_db)):
    service = WarehouseService(db)
    return service.update_warehouse(warehouse_id, warehouse_data)


@router.delete("/{warehouse_id}")
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    service = WarehouseService(db)
    return service.delete_warehouse(warehouse_id)