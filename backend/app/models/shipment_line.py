from sqlalchemy import CheckConstraint, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ShipmentLine(Base):
    __tablename__ = "lineas_salida"

    __table_args__ = (
        CheckConstraint("cantidad > 0", name="check_linea_salida_cantidad_positiva"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    salida_id: Mapped[int] = mapped_column(ForeignKey("salidas.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    ubicacion_origen_id: Mapped[int] = mapped_column(ForeignKey("ubicaciones.id"), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    salida = relationship("Shipment", back_populates="lineas")
    producto = relationship("Product", back_populates="lineas_salida")
    ubicacion_origen = relationship("Location", back_populates="lineas_salida")