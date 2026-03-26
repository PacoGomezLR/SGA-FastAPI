from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.stock import StockCreate, StockUpdate, StockResponse
from app.services.stock_service import StockService

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/", response_model=list[StockResponse])
def get_all_stock(db: Session = Depends(get_db)):
    service = StockService(db)
    return service.get_all_stock()


@router.get("/by-product/", response_model=list[StockResponse])
def get_stock_by_product(
    producto_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = StockService(db)
    return service.get_stock_by_product(producto_id)


@router.get("/by-location/", response_model=list[StockResponse])
def get_stock_by_location(
    ubicacion_id: int = Query(...),
    db: Session = Depends(get_db)
):
    service = StockService(db)
    return service.get_stock_by_location(ubicacion_id)


@router.get("/{stock_id}", response_model=StockResponse)
def get_stock(stock_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.get_stock_by_id(stock_id)


@router.post("/", response_model=StockResponse, status_code=201)
def create_stock(stock_data: StockCreate, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.create_stock(stock_data)


@router.put("/{stock_id}", response_model=StockResponse)
def update_stock(stock_id: int, stock_data: StockUpdate, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.update_stock(stock_id, stock_data)


@router.delete("/{stock_id}")
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.delete_stock(stock_id)