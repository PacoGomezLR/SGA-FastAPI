from fastapi import HTTPException, status
from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert
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
        self.db.flush()
        return new_stock

    def update(self, stock: Stock, stock_data: StockUpdate):
        update_data = stock_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(stock, key, value)

        self.db.flush()
        return stock

    def create_from_movement(self, producto_id: int, ubicacion_id: int, cantidad: int):
        """
        Mantengo este método por compatibilidad con tu código actual,
        pero internamente delega en add_stock() para no duplicar lógica.
        """
        return self.add_stock(producto_id, ubicacion_id, cantidad)

    def add_stock(self, producto_id: int, ubicacion_id: int, cantidad: int):
        """
        Suma stock de forma segura.
        Si no existe el registro producto+ubicacion, lo crea.
        Si existe, incrementa la cantidad.

        Usa UPSERT de PostgreSQL para evitar problemas de concurrencia
        al crear o actualizar stock en destino.
        """
        if cantidad <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad a sumar debe ser mayor que 0"
            )

        stmt = insert(Stock).values(
            producto_id=producto_id,
            ubicacion_id=ubicacion_id,
            cantidad=cantidad
        )

        stmt = stmt.on_conflict_do_update(
            index_elements=["producto_id", "ubicacion_id"],
            set_={"cantidad": Stock.cantidad + cantidad}
        )

        self.db.execute(stmt)
        self.db.flush()

        return self.get_by_product_and_location(producto_id, ubicacion_id)

    def remove_stock(self, producto_id: int, ubicacion_id: int, cantidad: int):
        """
        Resta stock de forma atómica y segura ante concurrencia.

        En lugar de:
        - leer stock
        - comprobar en Python
        - restar en Python

        hace un UPDATE directo con condición:
        cantidad >= cantidad_solicitada

        Así evitamos que dos procesos lean el mismo stock y ambos resten.
        """
        if cantidad <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad a descontar debe ser mayor que 0"
            )

        stmt = (
            update(Stock)
            .where(
                Stock.producto_id == producto_id,
                Stock.ubicacion_id == ubicacion_id,
                Stock.cantidad >= cantidad
            )
            .values(cantidad=Stock.cantidad - cantidad)
        )

        result = self.db.execute(stmt)

        if result.rowcount != 1:
            stock = self.get_by_product_and_location(producto_id, ubicacion_id)

            if not stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No existe stock para el producto {producto_id} en la ubicación {ubicacion_id}"
                )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para el producto {producto_id} en la ubicación {ubicacion_id}"
            )

        self.db.flush()
        return self.get_by_product_and_location(producto_id, ubicacion_id)

    def delete(self, stock: Stock):
        self.db.delete(stock)
        self.db.flush()