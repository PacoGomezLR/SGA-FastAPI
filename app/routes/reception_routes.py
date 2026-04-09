from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.reception import ReceptionCreate, ReceptionResponse, ReceptionUpdate
from app.security.dependencies import get_current_user, require_role
from app.services.reception_service import ReceptionService

router = APIRouter(prefix="/receptions", tags=["Receptions"])


@router.get(
    "/",
    response_model=list[ReceptionResponse],
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def get_all_receptions(db: Session = Depends(get_db)):
    service = ReceptionService(db)
    return service.get_all_receptions()


@router.get(
    "/{reception_id}",
    response_model=ReceptionResponse,
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def get_reception_by_id(reception_id: int, db: Session = Depends(get_db)):
    service = ReceptionService(db)
    return service.get_reception_by_id(reception_id)


@router.post(
    "/",
    response_model=ReceptionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def create_reception(
    reception_data: ReceptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = ReceptionService(db)
    return service.create_reception(reception_data, current_user.id)


@router.put(
    "/{reception_id}",
    response_model=ReceptionResponse,
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))]
)
def update_reception(
    reception_id: int,
    reception_data: ReceptionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = ReceptionService(db)
    return service.update_reception(reception_id, reception_data, current_user.id)


@router.put(
    "/{reception_id}/confirm",
    response_model=ReceptionResponse,
    dependencies=[Depends(require_role("administrador", "supervisor"))]
)
def confirm_reception(
    reception_id: int,
    db: Session = Depends(get_db)
):
    service = ReceptionService(db)
    return service.confirm_reception(reception_id)