from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.location import Location
    from app.models.user import User


class Movement(Base):
    __tablename__ = "movimientos"

    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_movimientos_cantidad_positiva"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    producto_id: Mapped[int] = mapped_column(
        ForeignKey("productos.id"),
        nullable=False
    )

    ubicacion_origen_id: Mapped[int | None] = mapped_column(
        ForeignKey("ubicaciones.id"),
        nullable=True
    )

    ubicacion_destino_id: Mapped[int | None] = mapped_column(
        ForeignKey("ubicaciones.id"),
        nullable=True
    )

    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)

    tipo_movimiento: Mapped[str] = mapped_column(
        Enum("entrada", "salida", "traslado", "ajuste", name="tipo_movimiento_enum"),
        nullable=False,
        default="traslado"
    )

    origen_tipo: Mapped[str] = mapped_column(
    Enum(
        "manual",
        "recepcion",
        "salida",
        "movimiento",
        "inventario",
        "legacy",
        name="origen_movimiento_enum"
    ),
    nullable=False
)

    origen_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
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

    producto: Mapped["Product"] = relationship("Product")
    ubicacion_origen: Mapped["Location | None"] = relationship(
        "Location",
        foreign_keys=[ubicacion_origen_id]
    )
    ubicacion_destino: Mapped["Location | None"] = relationship(
        "Location",
        foreign_keys=[ubicacion_destino_id]
    )
    usuario: Mapped["User"] = relationship("User")