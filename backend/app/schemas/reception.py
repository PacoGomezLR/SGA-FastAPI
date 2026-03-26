from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ------------------------
# LINEA DE RECEPCIÓN
# ------------------------

class ReceptionLineBase(BaseModel):
    producto_id: int
    cantidad: int
    ubicacion_destino_id: Optional[int] = None
    observaciones: Optional[str] = None


class ReceptionLineCreate(ReceptionLineBase):
    pass


class ReceptionLineResponse(ReceptionLineBase):
    id: int

    class Config:
        from_attributes = True


# ------------------------
# RECEPCIÓN
# ------------------------

class ReceptionBase(BaseModel):
    almacen_id: int
    observaciones: Optional[str] = None


class ReceptionCreate(ReceptionBase):
    lineas: List[ReceptionLineCreate]


class ReceptionResponse(ReceptionBase):
    id: int
    fecha: datetime
    usuario_id: int
    estado: str
    creado_en: datetime
    lineas: List[ReceptionLineResponse]

    class Config:
        from_attributes = True