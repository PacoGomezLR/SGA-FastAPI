from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SectionBase(BaseModel):
    nombre: str = Field(..., min_length=1)
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = True

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("El nombre no puede estar vacío")
        return value


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio_update(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("El nombre no puede estar vacío")
        return value


class SectionResponse(SectionBase):
    id: int
    num_columnas: Optional[int] = None
    num_filas: Optional[int] = None
    pos_x: Optional[int] = None
    pos_y: Optional[int] = None
    espejo: bool = False
    rotacion: int = 0

    class Config:
        from_attributes = True


class SectionOccupancyResponse(BaseModel):
    seccion_id: int
    seccion_nombre: str
    ubicaciones_totales: int
    ubicaciones_ocupadas: int
    porcentaje_ocupacion: float


class SectionPositionUpdate(BaseModel):
    pos_x: Optional[int] = None
    pos_y: Optional[int] = None


class SectionMirrorUpdate(BaseModel):
    espejo: bool


class SectionRotationUpdate(BaseModel):
    direccion: int

    @field_validator("direccion")
    @classmethod
    def direccion_valida(cls, value: int) -> int:
        if value not in (1, -1):
            raise ValueError("direccion debe ser 1 (horario) o -1 (antihorario)")
        return value
