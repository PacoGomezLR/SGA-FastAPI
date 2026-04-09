from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Stock(Base):
    __tablename__ = "stock"

    __table_args__ = (
        UniqueConstraint("producto_id", "ubicacion_id", name="uq_stock_producto_ubicacion"),
        CheckConstraint("cantidad >= 0", name="ck_stock_cantidad_no_negativa"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    ubicacion_id: Mapped[int] = mapped_column(ForeignKey("ubicaciones.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relación: cada stock pertenece a un producto
    producto = relationship("Product", back_populates="stock_items")

    # Relación: cada stock pertenece a una ubicación
    ubicacion = relationship("Location", back_populates="stock_items")