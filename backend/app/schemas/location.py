from typing import Optional

from pydantic import BaseModel, Field, field_validator


class LocationBase(BaseModel):
    seccion_id: int
    codigo: str = Field(..., min_length=1)
    descripcion: Optional[str] = None
    activa: bool = True
    columna: Optional[int] = Field(default=None, ge=1)
    fila: Optional[int] = Field(default=None, ge=1)

    @field_validator("codigo")
    @classmethod
    def codigo_no_vacio(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("El código no puede estar vacío")
        return value


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    seccion_id: Optional[int] = None
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None
    columna: Optional[int] = Field(default=None, ge=1)
    fila: Optional[int] = Field(default=None, ge=1)

    @field_validator("codigo")
    @classmethod
    def codigo_no_vacio_update(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("El código no puede estar vacío")
        return value


class LocationResponse(LocationBase):
    id: int

    class Config:
        from_attributes = True
