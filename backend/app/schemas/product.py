from pydantic import BaseModel
from typing import Optional


class ProductBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    sku: str
    categoria_id: int
    unidad_medida: str
    activo: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    sku: Optional[str] = None
    categoria_id: Optional[int] = None
    unidad_medida: Optional[str] = None
    activo: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True