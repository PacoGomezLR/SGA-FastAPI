from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    modulo: str
    accion: str
    entidad: str
    entidad_id: int | None = None
    detalle: str | None = None


class AuditLogCreate(AuditLogBase):
    usuario_id: int | None = None


class AuditLogResponse(AuditLogBase):
    id: int
    fecha: datetime
    usuario_id: int | None = None

    model_config = ConfigDict(from_attributes=True)