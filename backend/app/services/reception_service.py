from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.repositories.reception_repository import ReceptionRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.reception import ReceptionCreate
from app.services.audit_service import AuditService


class ReceptionService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ReceptionRepository(db)
        self.stock_repository = StockRepository(db)

    def get_all_receptions(self):
        return self.repository.get_all()

    def get_reception_by_id(self, reception_id: int):
        recepcion = self.repository.get_by_id(reception_id)
        if not recepcion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recepción no encontrada"
            )
        return recepcion

    def create_reception(self, reception_data: ReceptionCreate, usuario_id: int):
        if not reception_data.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La recepción debe tener al menos una línea"
            )

        for linea in reception_data.lineas:
            if linea.cantidad <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Todas las cantidades deben ser mayores que 0"
                )

        recepcion_creada = self.repository.create(reception_data, usuario_id)

        audit_service = AuditService(self.db)
        audit_service.log_action(
            usuario_id=usuario_id,
            modulo="receptions",
            accion="create",
            entidad="recepcion",
            entidad_id=recepcion_creada.id,
            detalle=f"Recepción creada en almacén {recepcion_creada.almacen_id} con {len(recepcion_creada.lineas)} líneas"
        )

        return recepcion_creada

    def confirm_reception(self, reception_id: int):
        recepcion = self.repository.get_by_id(reception_id)

        if not recepcion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recepción no encontrada"
            )

        if recepcion.estado == "confirmada":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La recepción ya está confirmada"
            )

        if not recepcion.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La recepción no tiene líneas"
            )

        try:
            for linea in recepcion.lineas:
                if linea.cantidad <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"La cantidad de la línea con producto {linea.producto_id} debe ser mayor que 0"
                    )

                if linea.ubicacion_destino_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"La línea con producto {linea.producto_id} no tiene ubicación destino"
                    )

                stock_existente = self.stock_repository.get_by_product_and_location(
                    linea.producto_id,
                    linea.ubicacion_destino_id
                )

                if stock_existente:
                    stock_existente.cantidad = stock_existente.cantidad + linea.cantidad
                else:
                    nuevo_stock = Stock(
                        producto_id=linea.producto_id,
                        ubicacion_id=linea.ubicacion_destino_id,
                        cantidad=linea.cantidad
                    )
                    self.db.add(nuevo_stock)

            self.db.flush()

            recepcion.estado = "confirmada"

            self.db.commit()
            self.db.refresh(recepcion)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=recepcion.usuario_id,
                modulo="receptions",
                accion="confirm",
                entidad="recepcion",
                entidad_id=recepcion.id,
                detalle=f"Recepción confirmada con {len(recepcion.lineas)} líneas"
            )

            return recepcion

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al confirmar la recepción: {str(e)}"
            )