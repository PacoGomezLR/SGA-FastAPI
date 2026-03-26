from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ReceptionLine(Base):
    __tablename__ = "lineas_recepcion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recepcion_id: Mapped[int] = mapped_column(ForeignKey("recepciones.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    ubicacion_destino_id: Mapped[int | None] = mapped_column(ForeignKey("ubicaciones.id"), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    recepcion = relationship("Reception", back_populates="lineas")
    producto = relationship("Product", back_populates="lineas_recepcion")
    ubicacion_destino = relationship("Location", back_populates="lineas_recepcion")