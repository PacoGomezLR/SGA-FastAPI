from fastapi import HTTPException, status
from sqlalchemy import update, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.models.product import Product
from app.models.category import Category
from app.models.location import Location
from app.models.zone import Zone
from app.models.section import Section

from app.schemas.stock import StockCreate, StockUpdate


class StockRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Stock).all()

    def get_all_with_details(self, low: bool = False, seccion_id: int | None = None):
        cantidad_expr = func.coalesce(Stock.cantidad, 0)
        bajo_stock_expr = cantidad_expr <= Product.stock_minimo

        query = (
            self.db.query(
                Stock.id.label("id"),

                Product.id.label("producto_id"),
                Product.nombre.label("producto_nombre"),
                Category.nombre.label("categoria_nombre"),

                Product.stock_minimo.label("stock_minimo"),

                Section.id.label("seccion_id"),
                Section.nombre.label("seccion_nombre"),

                Zone.id.label("zona_id"),
                Zone.nombre.label("zona_nombre"),

                Stock.ubicacion_id.label("ubicacion_id"),
                Location.codigo.label("ubicacion_nombre"),

                cantidad_expr.label("cantidad"),
                bajo_stock_expr.label("bajo_stock")
            )
            .select_from(Stock)
            .join(Product, Product.id == Stock.producto_id)
            .outerjoin(Category, Category.id == Product.categoria_id)
            .outerjoin(Location, Location.id == Stock.ubicacion_id)
            .outerjoin(Zone, Zone.id == Location.zona_id)
            .outerjoin(Section, Section.id == Zone.seccion_id)
        )

        if low:
            query = query.filter(bajo_stock_expr)

        if seccion_id is not None:
            query = query.filter(Section.id == seccion_id)

        return (
            query.order_by(
                bajo_stock_expr.desc(),
                Product.nombre.asc(),
                Section.nombre.asc().nulls_last(),
                Zone.nombre.asc().nulls_last(),
                Location.codigo.asc().nulls_last()
            )
            .all()
        )

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
        return self.add_stock(producto_id, ubicacion_id, cantidad)

    def add_stock(self, producto_id: int, ubicacion_id: int, cantidad: int):
        if cantidad <= 0:
            raise HTTPException(
                status_code=400,
                detail="La cantidad a sumar debe ser mayor que 0"
            )

        stmt = pg_insert(Stock).values(
            producto_id=producto_id,
            ubicacion_id=ubicacion_id,
            cantidad=cantidad
        )
        stmt = stmt.on_conflict_do_update(
            constraint="uq_stock_producto_ubicacion",
            set_={"cantidad": Stock.cantidad + stmt.excluded.cantidad}
        )

        self.db.execute(stmt)
        self.db.flush()

        return self.get_by_product_and_location(producto_id, ubicacion_id)

    def remove_stock(self, producto_id: int, ubicacion_id: int, cantidad: int):
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
            .returning(
                Stock.id,
                Stock.producto_id,
                Stock.ubicacion_id,
                Stock.cantidad
            )
        )

        result = self.db.execute(stmt)
        row = result.fetchone()

        if not row:
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