from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Warehouse(Base):
    __tablename__ = "almacenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relación: un almacén puede tener muchas zonas
    zonas = relationship("Zone", back_populates="almacen")
    recepciones = relationship("Reception", back_populates="almacen")
    salidas = relationship("Shipment", back_populates="almacen")