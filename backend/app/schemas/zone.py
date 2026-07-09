from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ZoneBase(BaseModel):
    almacen_id: int
    nombre: str = Field(..., min_length=1)
    descripcion: Optional[str] = None
    activo: bool = True
    numero_pasillo: Optional[int] = Field(default=None, ge=1)
    lado: Optional[str] = None

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("El nombre no puede estar vacío")
        return value

    @field_validator("lado")
    @classmethod
    def lado_valido(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ("D", "I"):
            raise ValueError("El lado debe ser 'D' o 'I'")
        return value


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    almacen_id: Optional[int] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None
    numero_pasillo: Optional[int] = Field(default=None, ge=1)
    lado: Optional[str] = None

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio_update(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("El nombre no puede estar vacío")
        return value

    @field_validator("lado")
    @classmethod
    def lado_valido_update(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ("D", "I"):
            raise ValueError("El lado debe ser 'D' o 'I'")
        return value


class ZoneResponse(ZoneBase):
    id: int

    class Config:
        from_attributes = True