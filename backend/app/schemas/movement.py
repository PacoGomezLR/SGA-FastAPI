from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class MovementBase(BaseModel):
    producto_id: int
    ubicacion_origen_id: int
    ubicacion_destino_id: int | None = None
    cantidad: int = Field(..., gt=0)
    observaciones: Optional[str] = None


class MovementCreate(MovementBase):
    pass


class MovementResponse(MovementBase):
    id: int
    tipo_movimiento: str
    fecha: datetime
    usuario_id: int
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)