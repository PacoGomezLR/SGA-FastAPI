from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.movement import Movement
from app.models.product import Product
from app.repositories.reception_repository import ReceptionRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.reception import ReceptionCreate, ReceptionUpdate
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
            self._validate_line(linea, reception_data.almacen_id)

        try:
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

            self.db.commit()
            self.db.refresh(recepcion_creada)
            return recepcion_creada

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear la recepción: {str(e)}"
            )

    def update_reception(self, reception_id: int, reception_data: ReceptionUpdate, usuario_id: int):
        recepcion = self.repository.get_by_id(reception_id)

        if not recepcion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recepción no encontrada"
            )

        if recepcion.estado != "borrador":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede editar una recepción en borrador"
            )

        if not reception_data.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La recepción debe tener al menos una línea"
            )

        for linea in reception_data.lineas:
            self._validate_line(linea, reception_data.almacen_id)

        try:
            recepcion_actualizada = self.repository.update(recepcion, reception_data)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=usuario_id,
                modulo="receptions",
                accion="update",
                entidad="recepcion",
                entidad_id=recepcion_actualizada.id,
                detalle=f"Recepción actualizada en almacén {recepcion_actualizada.almacen_id} con {len(reception_data.lineas)} líneas"
            )

            self.db.commit()
            self.db.refresh(recepcion_actualizada)
            return recepcion_actualizada

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar la recepción: {str(e)}"
            )

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

        if recepcion.estado != "borrador":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede confirmar una recepción en borrador"
            )

        if not recepcion.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La recepción no tiene líneas"
            )

        try:
            for linea in recepcion.lineas:
                self._validate_line(linea, recepcion.almacen_id)

                self.stock_repository.add_stock(
                    producto_id=linea.producto_id,
                    ubicacion_id=linea.ubicacion_destino_id,
                    cantidad=linea.cantidad
                )

                movimiento = Movement(
                    producto_id=linea.producto_id,
                    ubicacion_origen_id=None,
                    ubicacion_destino_id=linea.ubicacion_destino_id,
                    cantidad=linea.cantidad,
                    tipo_movimiento="entrada",
                    origen_tipo="recepcion",
                    origen_id=recepcion.id,
                    usuario_id=recepcion.usuario_id,
                    observaciones=f"Movimiento generado al confirmar la recepción {recepcion.id}"
                )
                self.db.add(movimiento)

            recepcion.estado = "confirmada"
            self.db.flush()

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=recepcion.usuario_id,
                modulo="receptions",
                accion="confirm",
                entidad="recepcion",
                entidad_id=recepcion.id,
                detalle=f"Recepción confirmada con {len(recepcion.lineas)} líneas"
            )

            self.db.commit()
            self.db.refresh(recepcion)
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

    def _validate_line(self, linea, almacen_id: int):
        if linea.cantidad <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La cantidad de la línea con producto {linea.producto_id} debe ser mayor que 0"
            )

        producto = (
            self.db.query(Product)
            .filter(Product.id == linea.producto_id)
            .first()
        )

        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El producto {linea.producto_id} no existe"
            )

        if not producto.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El producto {linea.producto_id} está inactivo"
            )

        if linea.ubicacion_destino_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La línea con producto {linea.producto_id} no tiene ubicación destino"
            )

        ubicacion = (
            self.db.query(Location)
            .filter(Location.id == linea.ubicacion_destino_id)
            .first()
        )

        if not ubicacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"La ubicación destino de la línea con producto {linea.producto_id} no existe"
            )

        if not ubicacion.activa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La ubicación destino de la línea con producto {linea.producto_id} está inactiva"
            )

        if not ubicacion.zona or ubicacion.zona.almacen_id != almacen_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La ubicación destino de la línea con producto {linea.producto_id} no pertenece al almacén de la recepción"
            )