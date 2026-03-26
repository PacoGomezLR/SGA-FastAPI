from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, audit_data: AuditLogCreate) -> AuditLog:
        audit = AuditLog(
            usuario_id=audit_data.usuario_id,
            modulo=audit_data.modulo,
            accion=audit_data.accion,
            entidad=audit_data.entidad,
            entidad_id=audit_data.entidad_id,
            detalle=audit_data.detalle,
        )
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(audit)
        return audit

    def get_all(self) -> list[AuditLog]:
        return self.db.query(AuditLog).order_by(AuditLog.fecha.desc()).all()

    def get_by_id(self, audit_id: int) -> AuditLog | None:
        return self.db.query(AuditLog).filter(AuditLog.id == audit_id).first()

    def get_by_user(self, usuario_id: int) -> list[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(AuditLog.usuario_id == usuario_id)
            .order_by(AuditLog.fecha.desc())
            .all()
        )

    def get_by_module(self, modulo: str) -> list[AuditLog]:
        return (
            self.db.query(AuditLog)
            .filter(AuditLog.modulo == modulo)
            .order_by(AuditLog.fecha.desc())
            .all()
        )