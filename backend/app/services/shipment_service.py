from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.movement import Movement
from app.models.shipment import Shipment
from app.models.shipment_line import ShipmentLine
from app.repositories.location_repository import LocationRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.shipment import ShipmentCreate
from app.services.audit_service import AuditService


class ShipmentService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ShipmentRepository(db)
        self.product_repository = ProductRepository(db)
        self.location_repository = LocationRepository(db)
        self.stock_repository = StockRepository(db)

    def get_all_shipments(self):
        return self.repository.get_all()

    def get_shipment_by_id(self, shipment_id: int):
        salida = self.repository.get_by_id(shipment_id)
        if not salida:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Salida no encontrada"
            )
        return salida

    def create_shipment(self, shipment_data: ShipmentCreate, usuario_id: int):
        if not shipment_data.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La salida debe contener al menos una línea"
            )

        lineas_modelo = []

        for linea in shipment_data.lineas:
            producto = self.product_repository.get_by_id(linea.producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto con id {linea.producto_id} no encontrado"
                )

            ubicacion = self.location_repository.get_by_id(linea.ubicacion_origen_id)
            if not ubicacion:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ubicación con id {linea.ubicacion_origen_id} no encontrada"
                )

            if linea.cantidad <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La cantidad de cada línea debe ser mayor que 0"
                )

            lineas_modelo.append(
                ShipmentLine(
                    producto_id=linea.producto_id,
                    ubicacion_origen_id=linea.ubicacion_origen_id,
                    cantidad=linea.cantidad,
                    observaciones=linea.observaciones,
                )
            )

        nueva_salida = Shipment(
            usuario_id=usuario_id,
            almacen_id=shipment_data.almacen_id,
            observaciones=shipment_data.observaciones,
            estado="borrador",
            lineas=lineas_modelo
        )

        try:
            salida_creada = self.repository.create(nueva_salida)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=usuario_id,
                modulo="shipments",
                accion="create",
                entidad="salida",
                entidad_id=salida_creada.id,
                detalle=f"Salida creada en almacén {salida_creada.almacen_id} con {len(salida_creada.lineas)} líneas"
            )

            self.db.commit()
            self.db.refresh(salida_creada)
            return salida_creada

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear la salida: {str(e)}"
            )

    def confirm_shipment(self, shipment_id: int):
        salida = self.repository.get_by_id(shipment_id)

        if not salida:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Salida no encontrada"
            )

        if salida.estado != "borrador":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede confirmar una salida en estado borrador"
            )

        if not salida.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede confirmar una salida sin líneas"
            )

        try:
            for linea in salida.lineas:
                producto = self.product_repository.get_by_id(linea.producto_id)
                if not producto:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Producto con id {linea.producto_id} no encontrado"
                    )

                ubicacion = self.location_repository.get_by_id(linea.ubicacion_origen_id)
                if not ubicacion:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Ubicación con id {linea.ubicacion_origen_id} no encontrada"
                    )

                self.stock_repository.remove_stock(
                    producto_id=linea.producto_id,
                    ubicacion_id=linea.ubicacion_origen_id,
                    cantidad=linea.cantidad
                )

                nuevo_movimiento = Movement(
                    producto_id=linea.producto_id,
                    ubicacion_origen_id=linea.ubicacion_origen_id,
                    ubicacion_destino_id=None,
                    cantidad=linea.cantidad,
                    tipo_movimiento="salida",
                    origen_tipo="salida",
                    origen_id=salida.id,
                    usuario_id=salida.usuario_id,
                    observaciones=f"Movimiento generado automáticamente al confirmar la salida {salida.id}"
                )
                self.db.add(nuevo_movimiento)

            salida.estado = "confirmada"
            self.db.flush()

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=salida.usuario_id,
                modulo="shipments",
                accion="confirm",
                entidad="salida",
                entidad_id=salida.id,
                detalle=f"Salida confirmada con {len(salida.lineas)} líneas en almacén {salida.almacen_id}"
            )

            self.db.commit()
            self.db.refresh(salida)

            return salida

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al confirmar la salida: {str(e)}"
            )