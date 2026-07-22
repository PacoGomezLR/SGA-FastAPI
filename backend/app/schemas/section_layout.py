from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.section import SectionCreate


class PasilloLayout(BaseModel):
    numero_pasillo: int = Field(..., ge=1)
    lado_d: bool = False
    lado_i: bool = False
    eje_y_max: int = Field(..., ge=1)
    eje_x_max: int = Field(..., ge=1)

    @field_validator("eje_y_max", "eje_x_max")
    @classmethod
    def dentro_de_limite(cls, value: int) -> int:
        if value > 200:
            raise ValueError("El tamaño de la rejilla es demasiado grande")
        return value


class SectionLayoutCreate(BaseModel):
    seccion: SectionCreate
    pasillos: list[PasilloLayout] = Field(default_factory=list)


class GenerateLayoutRequest(BaseModel):
    pasillos: list[PasilloLayout] = Field(default_factory=list)
