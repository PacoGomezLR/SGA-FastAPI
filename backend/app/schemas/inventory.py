from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# =========================
# LÍNEAS DE INVENTARIO
# =========================

class InventoryLineBase(BaseModel):
    producto_id: int
    ubicacion_id: int
    cantidad_real: int = Field(..., ge=0)
    observaciones: Optional[str] = None


class InventoryLineCreate(InventoryLineBase):
    pass


class InventoryLineResponse(BaseModel):
    id: int
    inventario_id: int
    producto_id: int
    ubicacion_id: int
    cantidad_sistema: int
    cantidad_real: int
    diferencia: int
    ajuste_aplicado: bool
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


# =========================
# CABECERA DE INVENTARIO
# =========================

class InventoryBase(BaseModel):
    almacen_id: int
    observaciones: Optional[str] = None


class InventoryCreate(InventoryBase):
    lineas: list[InventoryLineCreate] = []


class InventoryUpdate(BaseModel):
    observaciones: Optional[str] = None
    estado: Optional[str] = None


class InventoryResponse(BaseModel):
    id: int
    fecha: datetime
    usuario_id: int
    almacen_id: int
    estado: str
    observaciones: Optional[str] = None
    creado_en: datetime
    lineas: list[InventoryLineResponse] = []

    class Config:
        from_attributes = True