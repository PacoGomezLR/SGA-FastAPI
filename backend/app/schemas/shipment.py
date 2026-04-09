from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ShipmentLineBase(BaseModel):
    producto_id: int
    ubicacion_origen_id: int
    cantidad: float = Field(..., gt=0)
    observaciones: Optional[str] = None


class ShipmentLineCreate(ShipmentLineBase):
    pass


class ShipmentLineResponse(ShipmentLineBase):
    id: int

    class Config:
        from_attributes = True


class ShipmentBase(BaseModel):
    almacen_id: int
    observaciones: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    lineas: list[ShipmentLineCreate]


class ShipmentResponse(ShipmentBase):
    id: int
    fecha: datetime
    usuario_id: int
    estado: str
    creado_en: datetime
    lineas: list[ShipmentLineResponse] = []

    class Config:
        from_attributes = True