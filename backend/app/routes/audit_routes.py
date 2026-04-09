from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.security.dependencies import require_role
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get(
    "/",
    response_model=list[AuditLogResponse]
)
def get_audit_logs(
    usuario_id: int | None = Query(default=None),
    modulo: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrador", "supervisor")),
):
    service = AuditService(db)

    if usuario_id is not None:
        return service.get_logs_by_user(usuario_id)

    if modulo is not None:
        return service.get_logs_by_module(modulo)

    return service.get_all_logs()


@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse
)
def get_audit_log(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrador", "supervisor")),
):
    service = AuditService(db)
    return service.get_log_by_id(audit_id)