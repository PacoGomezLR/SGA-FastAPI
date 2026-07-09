from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Zone(Base):
    __tablename__ = "zonas"

    __table_args__ = (
        UniqueConstraint("almacen_id", "nombre", name="uq_zona_almacen_nombre"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    almacen_id: Mapped[int] = mapped_column(ForeignKey("almacenes.id"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Datos lógicos de layout, usados para la representación 2D/3D del almacén
    numero_pasillo: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    lado: Mapped[Optional[str]] = mapped_column(String(1), nullable=True)

    # Relación: cada zona pertenece a un almacén
    almacen = relationship("Warehouse", back_populates="zonas")

    # Relación: una zona puede tener muchas ubicaciones
    ubicaciones = relationship("Location", back_populates="zona")