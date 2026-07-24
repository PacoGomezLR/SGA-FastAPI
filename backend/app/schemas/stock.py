from pydantic import BaseModel, Field
from typing import Optional


class StockBase(BaseModel):
    producto_id: int
    ubicacion_id: int
    cantidad: int = Field(ge=0)


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    producto_id: Optional[int] = None
    ubicacion_id: Optional[int] = None
    cantidad: Optional[int] = Field(default=None, ge=0)


class StockResponse(StockBase):
    id: int

    class Config:
        from_attributes = True


class StockDetailedResponse(BaseModel):
    id: Optional[int] = None
    producto_id: int
    producto_nombre: Optional[str] = None
    categoria_nombre: Optional[str] = None

    seccion_id: Optional[int] = None
    seccion_nombre: Optional[str] = None

    ubicacion_id: Optional[int] = None
    ubicacion_nombre: Optional[str] = None

    cantidad: int
    stock_minimo: Optional[int] = None
    bajo_stock: bool

    class Config:
        from_attributes = True