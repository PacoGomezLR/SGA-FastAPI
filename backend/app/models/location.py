from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Location(Base):
    __tablename__ = "ubicaciones"

    __table_args__ = (
        UniqueConstraint("zona_id", "codigo", name="uq_ubicacion_zona_codigo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    zona_id: Mapped[int] = mapped_column(ForeignKey("zonas.id"), nullable=False)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Coordenadas lógicas dentro de la rejilla de la zona, usadas para la
    # representación 2D/3D del almacén
    eje_y: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    eje_x: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relación: cada ubicación pertenece a una zona
    zona = relationship("Zone", back_populates="ubicaciones")

    # Relación futura con stock
    stock_items = relationship("Stock", back_populates="ubicacion")
    lineas_recepcion = relationship("ReceptionLine", back_populates="ubicacion_destino")
    lineas_salida = relationship("ShipmentLine", back_populates="ubicacion_origen")