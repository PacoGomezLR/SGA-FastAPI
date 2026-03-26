from pydantic import BaseModel
from typing import Optional


class ZoneBase(BaseModel):
    almacen_id: int
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    almacen_id: Optional[int] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None


class ZoneResponse(ZoneBase):
    id: int

    class Config:
        from_attributes = True