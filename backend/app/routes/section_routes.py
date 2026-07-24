from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.section import (
    SectionCreate,
    SectionUpdate,
    SectionResponse,
    SectionOccupancyResponse,
    SectionPositionUpdate,
    SectionMirrorUpdate,
    SectionRotationUpdate,
)
from app.security.dependencies import require_role
from app.services.section_service import SectionService

router = APIRouter(prefix="/sections", tags=["Sections"])


@router.get(
    "/",
    response_model=list[SectionResponse]
)
def get_sections(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = SectionService(db)
    return service.get_all_sections()


@router.get(
    "/occupancy",
    response_model=list[SectionOccupancyResponse]
)
def get_sections_occupancy(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = SectionService(db)
    return service.get_occupancy()


@router.get(
    "/{section_id}",
    response_model=SectionResponse
)
def get_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor", "operario"))
):
    service = SectionService(db)
    return service.get_section_by_id(section_id)


@router.post(
    "/",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_section(
    section_data: SectionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionService(db)
    return service.create_section(section_data)


@router.put(
    "/{section_id}",
    response_model=SectionResponse
)
def update_section(
    section_id: int,
    section_data: SectionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionService(db)
    return service.update_section(section_id, section_data)


@router.patch(
    "/{section_id}/position",
    response_model=SectionResponse
)
def update_section_position(
    section_id: int,
    data: SectionPositionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionService(db)
    return service.update_position(section_id, data)


@router.patch(
    "/{section_id}/mirror",
    response_model=SectionResponse
)
def update_section_mirror(
    section_id: int,
    data: SectionMirrorUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionService(db)
    return service.update_mirror(section_id, data)


@router.patch(
    "/{section_id}/rotation",
    response_model=SectionResponse
)
def update_section_rotation(
    section_id: int,
    data: SectionRotationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionService(db)
    return service.update_rotation(section_id, data)


@router.delete(
    "/{section_id}"
)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador"))
):
    service = SectionService(db)
    return service.delete_section(section_id)
