from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse
from app.security.dependencies import require_role
from app.services.location_service import LocationService

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get(
    "/",
    response_model=list[LocationResponse]
)
def get_locations(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = LocationService(db)
    return service.get_all_locations()


@router.get(
    "/{location_id}",
    response_model=LocationResponse
)
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = LocationService(db)
    return service.get_location_by_id(location_id)


@router.post(
    "/",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = LocationService(db)
    return service.create_location(location_data)


@router.put(
    "/{location_id}",
    response_model=LocationResponse
)
def update_location(
    location_id: int,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = LocationService(db)
    return service.update_location(location_id, location_data)


@router.delete(
    "/{location_id}"
)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador"))
):
    service = LocationService(db)
    return service.delete_location(location_id)