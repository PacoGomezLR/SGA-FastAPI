from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Product(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), nullable=False)

    unidad_medida: Mapped[str] = mapped_column(String(30), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # NUEVO CAMPO
    stock_minimo: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación: cada producto pertenece a una categoría
    categoria = relationship("Category", back_populates="productos")

    # Relación con stock
    stock_items = relationship("Stock", back_populates="producto")
    lineas_recepcion = relationship("ReceptionLine", back_populates="producto")
    lineas_salida = relationship("ShipmentLine", back_populates="producto")