from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
 


class Movement(Base):
    __tablename__ = "movements"

    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_movements_cantidad_positiva"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    producto_id: Mapped[int] = mapped_column(
        ForeignKey("productos.id"),
        nullable=False
    )

    ubicacion_origen_id: Mapped[int] = mapped_column(
        ForeignKey("ubicaciones.id"),
        nullable=False
    )

    ubicacion_destino_id: Mapped[int | None] = mapped_column(
        ForeignKey("ubicaciones.id"),
        nullable=True
    )

    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)

    tipo_movimiento: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="traslado"
    )

    fecha: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    observaciones: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    creado_en: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    producto = relationship("Product")
    ubicacion_origen = relationship("Location", foreign_keys=[ubicacion_origen_id])
    ubicacion_destino = relationship("Location", foreign_keys=[ubicacion_destino_id])
    usuario = relationship("User")