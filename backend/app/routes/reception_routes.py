from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.reception import ReceptionCreate, ReceptionResponse
from app.services.reception_service import ReceptionService

router = APIRouter(prefix="/recepciones", tags=["Recepciones"])


@router.get("/", response_model=list[ReceptionResponse])
def get_all_receptions(db: Session = Depends(get_db)):
    service = ReceptionService(db)
    return service.get_all_receptions()


@router.get("/{reception_id}", response_model=ReceptionResponse)
def get_reception_by_id(reception_id: int, db: Session = Depends(get_db)):
    service = ReceptionService(db)
    return service.get_reception_by_id(reception_id)


@router.post(
    "/",
    response_model=ReceptionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_reception(reception_data: ReceptionCreate, db: Session = Depends(get_db)):
    service = ReceptionService(db)

    # De momento ponemos un usuario fijo para avanzar en el MVP
    usuario_id = 3

    return service.create_reception(reception_data, usuario_id)


@router.put("/{reception_id}/confirmar", response_model=ReceptionResponse)
def confirm_reception(reception_id: int, db: Session = Depends(get_db)):
    service = ReceptionService(db)
    return service.confirm_reception(reception_id)