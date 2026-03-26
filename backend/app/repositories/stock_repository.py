from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.schemas.stock import StockCreate, StockUpdate


class StockRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Stock).all()

    def get_by_id(self, stock_id: int):
        return self.db.query(Stock).filter(Stock.id == stock_id).first()

    def get_by_product_and_location(self, producto_id: int, ubicacion_id: int):
        return (
            self.db.query(Stock)
            .filter(
                Stock.producto_id == producto_id,
                Stock.ubicacion_id == ubicacion_id
            )
            .first()
        )

    def get_by_product(self, producto_id: int):
        return self.db.query(Stock).filter(Stock.producto_id == producto_id).all()

    def get_by_location(self, ubicacion_id: int):
        return self.db.query(Stock).filter(Stock.ubicacion_id == ubicacion_id).all()

    def create(self, stock_data: StockCreate):
        new_stock = Stock(**stock_data.model_dump())
        self.db.add(new_stock)
        self.db.commit()
        self.db.refresh(new_stock)
        return new_stock

    def update(self, stock: Stock, stock_data: StockUpdate):
        update_data = stock_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(stock, key, value)

        self.db.commit()
        self.db.refresh(stock)
        return stock

    def create_from_movement(self, producto_id: int, ubicacion_id: int, cantidad: int):
        stock = Stock(
            producto_id=producto_id,
            ubicacion_id=ubicacion_id,
            cantidad=cantidad
        )
        self.db.add(stock)
        self.db.flush()
        self.db.refresh(stock)
        return stock

    def delete(self, stock: Stock):
        self.db.delete(stock)
        self.db.commit()