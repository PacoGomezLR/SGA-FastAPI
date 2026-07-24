from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.section import SectionResponse
from app.schemas.section_layout import (
    GenerateLayoutRequest,
    ResizeSectionRequest,
    ResizeSectionResult,
    SectionLayoutCreate,
)
from app.security.dependencies import require_role
from app.services.section_layout_service import SectionLayoutService

router = APIRouter(prefix="/section-layout", tags=["Section Layout"])


@router.post(
    "/",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_section_with_layout(
    data: SectionLayoutCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionLayoutService(db)
    return service.create_section_with_layout(data)


@router.post(
    "/{section_id}/generate"
)
def generate_layout(
    section_id: int,
    data: GenerateLayoutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionLayoutService(db)
    return service.generate_layout(section_id, data.layout)


@router.patch(
    "/{section_id}/resize",
    response_model=ResizeSectionResult
)
def resize_section(
    section_id: int,
    data: ResizeSectionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("administrador", "supervisor"))
):
    service = SectionLayoutService(db)
    return service.resize_section(section_id, data)
