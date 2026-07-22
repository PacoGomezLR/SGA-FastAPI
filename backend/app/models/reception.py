from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Reception(Base):
    __tablename__ = "recepciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    seccion_id: Mapped[int] = mapped_column(ForeignKey("secciones.id"), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="borrador", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    usuario: Mapped["User"] = relationship("User", back_populates="recepciones")
    seccion: Mapped["Section"] = relationship("Section", back_populates="recepciones")
    lineas: Mapped[list["ReceptionLine"]] = relationship(
        "ReceptionLine",
        back_populates="recepcion",
        cascade="all, delete-orphan"
    )