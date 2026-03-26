from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Reception(Base):
    __tablename__ = "recepciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    almacen_id: Mapped[int] = mapped_column(ForeignKey("almacenes.id"), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="borrador", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("User", back_populates="recepciones")
    almacen = relationship("Warehouse", back_populates="recepciones")
    lineas = relationship(
        "ReceptionLine",
        back_populates="recepcion",
        cascade="all, delete-orphan"
    )