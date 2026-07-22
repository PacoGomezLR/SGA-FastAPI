from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.movement import Movement
from app.models.shipment import Shipment
from app.models.shipment_line import ShipmentLine
from app.repositories.location_repository import LocationRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.stock_repository import StockRepository
from app.repositories.section_repository import SectionRepository
from app.schemas.shipment import ShipmentCreate
from app.services.audit_service import AuditService


class ShipmentService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ShipmentRepository(db)
        self.product_repository = ProductRepository(db)
        self.location_repository = LocationRepository(db)
        self.stock_repository = StockRepository(db)
        self.section_repository = SectionRepository(db)

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

        seccion = self.section_repository.get_by_id(
            shipment_data.seccion_id
        )

        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sección con id {shipment_data.seccion_id} no encontrada"
            )

        lineas_modelo = []

        for linea in shipment_data.lineas:
            producto = self.product_repository.get_by_id(
                linea.producto_id
            )

            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto con id {linea.producto_id} no encontrado"
                )

            ubicacion = self.location_repository.get_by_id(
                linea.ubicacion_origen_id
            )

            if not ubicacion:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ubicación con id {linea.ubicacion_origen_id} no encontrada"
                )

            if linea.cantidad <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La cantidad debe ser mayor que 0"
                )

            if ubicacion.zona.seccion_id != shipment_data.seccion_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"La ubicación {linea.ubicacion_origen_id} no pertenece "
                        f"a la sección {shipment_data.seccion_id}"
                    )
                )

            lineas_modelo.append(
                ShipmentLine(
                    producto_id=linea.producto_id,
                    ubicacion_origen_id=linea.ubicacion_origen_id,
                    cantidad=linea.cantidad,
                    observaciones=linea.observaciones
                )
            )

        nueva_salida = Shipment(
            usuario_id=usuario_id,
            seccion_id=shipment_data.seccion_id,
            observaciones=shipment_data.observaciones,
            estado="borrador",
            lineas=lineas_modelo
        )

        try:
            salida_creada = self.repository.create(nueva_salida)

            # 🔥 CAMBIO CLAVE:
            # confirmar automáticamente al crear
            self.db.flush()

            salida_confirmada = self.confirm_shipment(
                salida_creada.id,
                usuario_id
            )

            return salida_confirmada

        except HTTPException:
            self.db.rollback()
            raise

        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al crear la salida"
            )

    def confirm_shipment(self, shipment_id: int, usuario_id: int):
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
                    usuario_id=usuario_id,
                    observaciones=f"Salida automática {salida.id}"
                )

                self.db.add(nuevo_movimiento)

            salida.estado = "confirmada"
            self.db.flush()

            audit_service = AuditService(self.db)

            audit_service.log_action(
                usuario_id=usuario_id,
                modulo="shipments",
                accion="confirm",
                entidad="salida",
                entidad_id=salida.id,
                detalle=f"Salida confirmada {salida.id}"
            )

            self.db.commit()
            self.db.refresh(salida)

            return salida

        except HTTPException:
            self.db.rollback()
            raise

        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al confirmar la salida"
            )
