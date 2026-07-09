from typing import Optional

from pydantic import BaseModel, Field, field_validator


class LocationBase(BaseModel):
    zona_id: int
    codigo: str = Field(..., min_length=1)
    descripcion: Optional[str] = None
    activa: bool = True
    eje_y: Optional[int] = Field(default=None, ge=1)
    eje_x: Optional[int] = Field(default=None, ge=1)

    @field_validator("codigo")
    @classmethod
    def codigo_no_vacio(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("El código no puede estar vacío")
        return value


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    zona_id: Optional[int] = None
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None
    eje_y: Optional[int] = Field(default=None, ge=1)
    eje_x: Optional[int] = Field(default=None, ge=1)

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