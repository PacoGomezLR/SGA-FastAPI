from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict


class MovementBase(BaseModel):
    producto_id: int
    ubicacion_origen_id: Optional[int] = None
    ubicacion_destino_id: Optional[int] = None
    cantidad: int = Field(..., gt=0)
    tipo_movimiento: Literal["entrada", "salida", "traslado", "ajuste"]
    origen_tipo: Literal["manual", "recepcion", "salida", "movimiento", "inventario", "legacy"]
    origen_id: int = Field(..., gt=0)
    observaciones: Optional[str] = None


class MovementCreate(MovementBase):
    pass


class MovementResponse(MovementBase):
    id: int
    usuario_id: int
    fecha: datetime

    # 🔥 nuevos campos para auditoría legible
    producto_nombre: Optional[str] = None
    ubicacion_origen_nombre: Optional[str] = None
    ubicacion_destino_nombre: Optional[str] = None
    usuario_nombre: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)