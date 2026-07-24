from typing import Optional

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Section(Base):
    __tablename__ = "secciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Dimensiones de la rejilla propia de la sección (estantería autocontenida)
    num_columnas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    num_filas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Posición libre en el mapa 2D del almacén. None = usar el layout
    # automático (secciones colocadas una junto a otra en orden).
    pos_x: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pos_y: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Espejo puramente visual: invierte el orden de dibujado de las columnas
    # en el mapa 2D (para que el "frente" de la estantería quede del lado
    # contrario). No afecta a la columna real de ninguna ubicación ni a su
    # código.
    espejo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Rotación puramente visual, en cuartos de vuelta en sentido horario:
    # 0 = sin rotar, 1 = 90°, 2 = 180°, 3 = 270°. Independiente del espejo y
    # no afecta a la columna/fila real de ninguna ubicación.
    rotacion: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relación: una sección puede tener muchas ubicaciones directamente
    ubicaciones = relationship("Location", back_populates="seccion")
    recepciones = relationship("Reception", back_populates="seccion")
    salidas = relationship("Shipment", back_populates="seccion")
