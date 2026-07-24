from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Location(Base):
    __tablename__ = "ubicaciones"

    __table_args__ = (
        UniqueConstraint("seccion_id", "codigo", name="uq_ubicacion_seccion_codigo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    seccion_id: Mapped[int] = mapped_column(ForeignKey("secciones.id"), nullable=False)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Coordenadas lógicas dentro de la rejilla de la sección, usadas para la
    # representación 2D del almacén
    columna: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fila: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relación: cada ubicación pertenece a una sección
    seccion = relationship("Section", back_populates="ubicaciones")

    stock_items = relationship("Stock", back_populates="ubicacion")
    lineas_recepcion = relationship("ReceptionLine", back_populates="ubicacion_destino")
    lineas_salida = relationship("ShipmentLine", back_populates="ubicacion_origen")
