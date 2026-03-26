from pydantic import BaseModel
from typing import Optional


class LocationBase(BaseModel):
    zona_id: int
    codigo: str
    descripcion: Optional[str] = None
    activa: bool = True


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    zona_id: Optional[int] = None
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None


class LocationResponse(LocationBase):
    id: int

    class Config:
        from_attributes = True