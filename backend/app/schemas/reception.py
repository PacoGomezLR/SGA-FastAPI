from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ReceptionLineBase(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)
    ubicacion_destino_id: Optional[int] = None
    observaciones: Optional[str] = None


class ReceptionLineCreate(ReceptionLineBase):
    pass


class ReceptionLineUpdate(ReceptionLineBase):
    pass


class ReceptionLineResponse(ReceptionLineBase):
    id: int

    class Config:
        from_attributes = True


class ReceptionBase(BaseModel):
    almacen_id: int
    observaciones: Optional[str] = None


class ReceptionCreate(ReceptionBase):
    lineas: List[ReceptionLineCreate] = Field(min_length=1)


class ReceptionUpdate(ReceptionBase):
    lineas: List[ReceptionLineUpdate] = Field(min_length=1)


class ReceptionResponse(ReceptionBase):
    id: int
    fecha: datetime
    usuario_id: int
    estado: str
    creado_en: datetime
    lineas: List[ReceptionLineResponse]

    class Config:
        from_attributes = True