from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.movement import MovementCreate, MovementResponse
from app.services.movement_service import MovementService

router = APIRouter(prefix="/movements", tags=["Movements"])


@router.get("/", response_model=list[MovementResponse])
def get_movements(db: Session = Depends(get_db)):
    service = MovementService(db)
    return service.get_all_movements()


# 🔹 ESTE VA ANTES QUE /{movement_id}
@router.get("/product/{producto_id}", response_model=list[MovementResponse])
def get_movements_by_product(producto_id: int, db: Session = Depends(get_db)):
    service = MovementService(db)
    return service.get_movements_by_product(producto_id)


@router.get("/{movement_id}", response_model=MovementResponse)
def get_movement(movement_id: int, db: Session = Depends(get_db)):
    service = MovementService(db)
    return service.get_movement_by_id(movement_id)


@router.post("/", response_model=MovementResponse, status_code=status.HTTP_201_CREATED)
def create_movement(movement_data: MovementCreate, db: Session = Depends(get_db)):
    service = MovementService(db)

    # Usuario provisional hasta integrar autenticación real
    usuario_id = 3

    return service.create_movement(movement_data, usuario_id)