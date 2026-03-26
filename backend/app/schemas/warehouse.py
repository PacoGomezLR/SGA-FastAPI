from pydantic import BaseModel
from typing import Optional


class WarehouseBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None


class WarehouseResponse(WarehouseBase):
    id: int

    class Config:
        from_attributes = True