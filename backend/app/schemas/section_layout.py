from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.section import SectionCreate


class PasilloLayout(BaseModel):
    numero_pasillo: int = Field(..., ge=1)
    lado_d: bool = False
    lado_i: bool = False
    eje_y_max: int = Field(..., ge=1)
    fila_inicio: int = Field(..., ge=1)
    fila_fin: int = Field(..., ge=1)

    @field_validator("eje_y_max", "fila_inicio", "fila_fin")
    @classmethod
    def dentro_de_limite(cls, value: int) -> int:
        if value > 200:
            raise ValueError("El tamaño de la rejilla es demasiado grande")
        return value

    @field_validator("fila_fin")
    @classmethod
    def fila_fin_no_menor_que_inicio(cls, value: int, info) -> int:
        fila_inicio = info.data.get("fila_inicio")
        if fila_inicio is not None and value < fila_inicio:
            raise ValueError("La fila final no puede ser menor que la fila de inicio")
        return value


class SectionLayoutCreate(BaseModel):
    seccion: SectionCreate
    pasillos: list[PasilloLayout] = Field(default_factory=list)


class GenerateLayoutRequest(BaseModel):
    pasillos: list[PasilloLayout] = Field(default_factory=list)
