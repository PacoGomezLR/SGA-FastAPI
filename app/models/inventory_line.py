from sqlalchemy import Boolean, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class InventoryLine(Base):
    __tablename__ = "lineas_inventario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    inventario_id: Mapped[int] = mapped_column(ForeignKey("inventarios.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    ubicacion_id: Mapped[int] = mapped_column(ForeignKey("ubicaciones.id"), nullable=False)

    cantidad_sistema: Mapped[int] = mapped_column(Integer, nullable=False)
    cantidad_real: Mapped[int] = mapped_column(Integer, nullable=False)
    diferencia: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    ajuste_aplicado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    inventario: Mapped["Inventory"] = relationship(
        "Inventory",
        back_populates="lineas"
    )