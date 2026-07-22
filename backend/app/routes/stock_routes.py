from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.stock import (
    StockCreate,
    StockUpdate,
    StockResponse,
    StockDetailedResponse,
)
from app.security.dependencies import get_current_user, require_role
from app.services.stock_service import StockService

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get(
    "/",
    response_model=list[StockDetailedResponse],
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))],
)
def get_stock(
    low: bool = Query(False, description="Filtrar solo stock bajo"),
    seccion_id: int | None = Query(None, description="Filtrar por sección"),
    db: Session = Depends(get_db),
):
    service = StockService(db)
    return service.get_all_stock_detailed(low=low, seccion_id=seccion_id)


@router.get(
    "/by-product/",
    response_model=list[StockResponse],
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))],
)
def get_stock_by_product(
    producto_id: int = Query(...),
    db: Session = Depends(get_db),
):
    service = StockService(db)
    return service.get_stock_by_product(producto_id)


@router.get(
    "/by-location/",
    response_model=list[StockResponse],
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))],
)
def get_stock_by_location(
    ubicacion_id: int = Query(...),
    db: Session = Depends(get_db),
):
    service = StockService(db)
    return service.get_stock_by_location(ubicacion_id)


@router.get(
    "/{stock_id}",
    response_model=StockResponse,
    dependencies=[Depends(require_role("administrador", "supervisor", "operario"))],
)
def get_stock_by_id(stock_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.get_stock_by_id(stock_id)


@router.post(
    "/",
    response_model=StockResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("administrador", "supervisor"))],
)
def create_stock(
    stock_data: StockCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = StockService(db)
    return service.create_stock(stock_data)


@router.put(
    "/{stock_id}",
    response_model=StockResponse,
    dependencies=[Depends(require_role("administrador", "supervisor"))],
)
def update_stock(
    stock_id: int,
    stock_data: StockUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = StockService(db)
    return service.update_stock(stock_id, stock_data)


@router.delete(
    "/{stock_id}",
    dependencies=[Depends(require_role("administrador"))],
)
def delete_stock(
    stock_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = StockService(db)
    return service.delete_stock(stock_id)