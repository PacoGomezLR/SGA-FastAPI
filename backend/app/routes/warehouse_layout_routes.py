from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.warehouse import WarehouseResponse
from app.schemas.warehouse_layout import GenerateLayoutRequest, WarehouseLayoutCreate
from app.security.dependencies import require_role
from app.services.warehouse_layout_service import WarehouseLayoutService

router = APIRouter(prefix="/warehouse-layout", tags=["Warehouse Layout"])


@router.post(
    "/",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_warehouse_with_layout(
    data: WarehouseLayoutCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = WarehouseLayoutService(db)
    return service.create_warehouse_with_layout(data)


@router.post(
    "/{warehouse_id}/generate"
)
def generate_layout(
    warehouse_id: int,
    data: GenerateLayoutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = WarehouseLayoutService(db)
    return service.generate_layout(warehouse_id, data.pasillos)
