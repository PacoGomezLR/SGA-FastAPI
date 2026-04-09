from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.zone import ZoneCreate, ZoneUpdate, ZoneResponse
from app.security.dependencies import require_role
from app.services.zone_service import ZoneService

router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get(
    "/",
    response_model=list[ZoneResponse]
)
def get_zones(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = ZoneService(db)
    return service.get_all_zones()


@router.get(
    "/{zone_id}",
    response_model=ZoneResponse
)
def get_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = ZoneService(db)
    return service.get_zone_by_id(zone_id)


@router.post(
    "/",
    response_model=ZoneResponse,
    status_code=status.HTTP_201_CREATED
)
def create_zone(
    zone_data: ZoneCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = ZoneService(db)
    return service.create_zone(zone_data)


@router.put(
    "/{zone_id}",
    response_model=ZoneResponse
)
def update_zone(
    zone_id: int,
    zone_data: ZoneUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = ZoneService(db)
    return service.update_zone(zone_id, zone_data)


@router.delete(
    "/{zone_id}"
)
def delete_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador"))
):
    service = ZoneService(db)
    return service.delete_zone(zone_id)