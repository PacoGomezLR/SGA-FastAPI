from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Shipment(Base):
    __tablename__ = "salidas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    almacen_id: Mapped[int] = mapped_column(ForeignKey("almacenes.id"), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="borrador", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("User", back_populates="salidas")
    almacen = relationship("Warehouse", back_populates="salidas")
    lineas = relationship(
        "ShipmentLine",
        back_populates="salida",
        cascade="all, delete-orphan"
    )