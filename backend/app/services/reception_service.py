from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.movement import Movement
from app.models.product import Product
from app.models.warehouse import Warehouse
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

        self._validate_almacen(reception_data.almacen_id)

        for linea in reception_data.lineas:
            self._validate_line(linea, reception_data.almacen_id)

        try:
            recepcion_creada = self.repository.create(reception_data, usuario_id)

            AuditService(self.db).log_action(
                usuario_id=usuario_id,
                modulo="receptions",
                accion="create",
                entidad="recepcion",
                entidad_id=recepcion_creada.id,
                detalle=f"Recepción creada en almacén {recepcion_creada.almacen_id}"
            )

            self.db.commit()
            self.db.refresh(recepcion_creada)
            return recepcion_creada

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al crear la recepción"
            )

    def update_reception(self, reception_id: int, reception_data: ReceptionUpdate, usuario_id: int):
        recepcion = self.repository.get_by_id(reception_id)

        if not recepcion:
            raise HTTPException(404, "Recepción no encontrada")

        if recepcion.estado != "borrador":
            raise HTTPException(400, "Solo se puede editar en borrador")

        self._validate_almacen(reception_data.almacen_id)

        for linea in reception_data.lineas:
            self._validate_line(linea, reception_data.almacen_id)

        try:
            recepcion = self.repository.update(recepcion, reception_data)

            AuditService(self.db).log_action(
                usuario_id=usuario_id,
                modulo="receptions",
                accion="update",
                entidad="recepcion",
                entidad_id=recepcion.id,
                detalle="Recepción actualizada"
            )

            self.db.commit()
            self.db.refresh(recepcion)
            return recepcion

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al actualizar la recepción"
            )

    def confirm_reception(self, reception_id: int):
        recepcion = self.repository.get_by_id(reception_id)

        if not recepcion:
            raise HTTPException(404, "Recepción no encontrada")

        if recepcion.estado == "confirmada":
            raise HTTPException(400, "Ya confirmada")

        if recepcion.estado != "borrador":
            raise HTTPException(400, "Solo se puede confirmar en borrador")

        if not recepcion.lineas:
            raise HTTPException(400, "Sin líneas")

        self._validate_almacen(recepcion.almacen_id)

        try:
            for linea in recepcion.lineas:

                self._validate_line(linea, recepcion.almacen_id)

                # 🔥 SUMA DE STOCK
                self.stock_repository.add_stock(
                    producto_id=linea.producto_id,
                    ubicacion_id=linea.ubicacion_destino_id,
                    cantidad=linea.cantidad
                )

                # 🔥 MOVIMIENTO
                movimiento = Movement(
                    producto_id=linea.producto_id,
                    ubicacion_origen_id=None,
                    ubicacion_destino_id=linea.ubicacion_destino_id,
                    cantidad=linea.cantidad,
                    tipo_movimiento="entrada",
                    origen_tipo="recepcion",
                    origen_id=recepcion.id,
                    usuario_id=recepcion.usuario_id,
                    observaciones=f"Entrada por recepción {recepcion.id}"
                )

                self.db.add(movimiento)

                # 🔥 CLAVE → asegura persistencia en cada iteración
                self.db.flush()

            recepcion.estado = "confirmada"

            AuditService(self.db).log_action(
                usuario_id=recepcion.usuario_id,
                modulo="receptions",
                accion="confirm",
                entidad="recepcion",
                entidad_id=recepcion.id,
                detalle="Recepción confirmada"
            )

            self.db.commit()
            self.db.refresh(recepcion)
            return recepcion

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al confirmar la recepción"
            )

    def _validate_almacen(self, almacen_id: int):
        almacen = self.db.query(Warehouse).filter(Warehouse.id == almacen_id).first()

        if not almacen:
            raise HTTPException(404, "Almacén no existe")

        if not almacen.activo:
            raise HTTPException(400, "Almacén inactivo")

    def _validate_line(self, linea, almacen_id: int):

        if linea.cantidad <= 0:
            raise HTTPException(400, "Cantidad inválida")

        producto = self.db.query(Product).filter(Product.id == linea.producto_id).first()
        if not producto:
            raise HTTPException(404, "Producto no existe")

        if not producto.activo:
            raise HTTPException(400, "Producto inactivo")

        if linea.ubicacion_destino_id is None:
            raise HTTPException(400, "Falta ubicación")

        ubicacion = self.db.query(Location).filter(Location.id == linea.ubicacion_destino_id).first()

        if not ubicacion:
            raise HTTPException(404, "Ubicación no existe")

        if not ubicacion.activa:
            raise HTTPException(400, "Ubicación inactiva")

        if not ubicacion.zona or ubicacion.zona.almacen_id != almacen_id:
            raise HTTPException(400, "Ubicación no pertenece al almacén")