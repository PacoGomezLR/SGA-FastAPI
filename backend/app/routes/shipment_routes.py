from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.shipment import ShipmentCreate, ShipmentResponse
from app.security.dependencies import get_current_user, require_role
from app.services.shipment_service import ShipmentService

router = APIRouter(prefix="/shipments", tags=["Shipments"])


@router.get(
    "/",
    response_model=list[ShipmentResponse]
)
def get_shipments(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = ShipmentService(db)
    return service.get_all_shipments()


@router.get(
    "/{shipment_id}",
    response_model=ShipmentResponse
)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = ShipmentService(db)
    return service.get_shipment_by_id(shipment_id)


@router.post(
    "/",
    response_model=ShipmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_shipment(
    shipment_data: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = ShipmentService(db)

    return service.create_shipment(shipment_data, current_user.id)


@router.put(
    "/{shipment_id}/confirm",
    response_model=ShipmentResponse
)
def confirm_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = ShipmentService(db)
    return service.confirm_shipment(shipment_id)