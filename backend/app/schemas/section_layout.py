from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.section import SectionCreate


class GridLayout(BaseModel):
    num_columnas: int = Field(..., ge=1, le=200)
    num_filas: int = Field(..., ge=1, le=200)


class SectionLayoutCreate(BaseModel):
    seccion: SectionCreate
    layout: Optional[GridLayout] = None


class GenerateLayoutRequest(BaseModel):
    layout: GridLayout


class ResizeSectionRequest(BaseModel):
    """
    Redimensiona la rejilla de una sección añadiendo o quitando columnas/filas
    por el final. Al ser cada sección una estantería autocontenida, no hay
    efecto sobre otras secciones.
    """
    num_columnas: Optional[int] = Field(default=None, ge=1, le=200)
    num_filas: Optional[int] = Field(default=None, ge=1, le=200)


class ResizeSectionResult(BaseModel):
    mensaje: str
