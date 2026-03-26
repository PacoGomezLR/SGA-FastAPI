from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.audit_repository import AuditRepository
from app.schemas.audit_log import AuditLogCreate


class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = AuditRepository(db)

    def log_action(
        self,
        usuario_id: int | None,
        modulo: str,
        accion: str,
        entidad: str,
        entidad_id: int | None = None,
        detalle: str | None = None,
    ):
        audit_data = AuditLogCreate(
            usuario_id=usuario_id,
            modulo=modulo,
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            detalle=detalle,
        )
        return self.repository.create(audit_data)

    def get_all_logs(self):
        return self.repository.get_all()

    def get_log_by_id(self, audit_id: int):
        log = self.repository.get_by_id(audit_id)
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registro de auditoría no encontrado",
            )
        return log

    def get_logs_by_user(self, usuario_id: int):
        return self.repository.get_by_user(usuario_id)

    def get_logs_by_module(self, modulo: str):
        return self.repository.get_by_module(modulo)