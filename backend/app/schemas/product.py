from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ProductBase(BaseModel):
    nombre: str = Field(..., min_length=1)
    descripcion: Optional[str] = None
    sku: Optional[str] = None
    categoria_id: int
    unidad_medida: str = Field(..., min_length=1)
    activo: bool = True
    stock_minimo: int = Field(default=0, ge=0)

    @field_validator("nombre", "unidad_medida")
    @classmethod
    def no_vacio(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Este campo no puede estar vacío")
        return value

    @field_validator("sku")
    @classmethod
    def validar_sku(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        if not value.strip():
            return None
        return value.strip()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    sku: Optional[str] = None
    categoria_id: Optional[int] = None
    unidad_medida: Optional[str] = None
    activo: Optional[bool] = None
    stock_minimo: Optional[int] = Field(default=None, ge=0)

    @field_validator("nombre", "unidad_medida")
    @classmethod
    def no_vacio_update(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Este campo no puede estar vacío")
        return value

    @field_validator("sku")
    @classmethod
    def validar_sku_update(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        if not value.strip():
            return None
        return value.strip()


class ProductResponse(ProductBase):
    id: int
    categoria_nombre: Optional[str] = None

    class Config:
        from_attributes = True