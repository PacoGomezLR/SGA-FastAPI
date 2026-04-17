from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.movement import Movement
from app.models.user import User
from app.repositories.location_repository import LocationRepository
from app.repositories.movement_repository import MovementRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.movement import MovementCreate
from app.services.audit_service import AuditService


class MovementService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = MovementRepository(db)
        self.product_repository = ProductRepository(db)
        self.location_repository = LocationRepository(db)
        self.stock_repository = StockRepository(db)
        self.audit_service = AuditService(db)

    def get_all_movements(self):
        return self.repository.get_all()

    def get_movement_by_id(self, movement_id: int):
        movement = self.repository.get_by_id(movement_id)
        if not movement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movimiento no encontrado"
            )
        return movement

    def get_movements_by_product(self, producto_id: int):
        return self.repository.get_by_product(producto_id)

    def create_movement(self, movement_data: MovementCreate, current_user: User):
        tipo_movimiento = self._normalize_tipo_movimiento(
            movement_data.tipo_movimiento
        )

        producto = self.product_repository.get_by_id(movement_data.producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

        if movement_data.ubicacion_origen_id is not None:
            ubicacion_origen = self.location_repository.get_by_id(
                movement_data.ubicacion_origen_id
            )
            if not ubicacion_origen:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ubicación de origen no encontrada"
                )

        if movement_data.ubicacion_destino_id is not None:
            ubicacion_destino = self.location_repository.get_by_id(
                movement_data.ubicacion_destino_id
            )
            if not ubicacion_destino:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ubicación de destino no encontrada"
                )

        self._validate_movement_rules(movement_data, tipo_movimiento)

        try:
            self._apply_stock_operation(movement_data, tipo_movimiento)

            movement = Movement(
                producto_id=movement_data.producto_id,
                ubicacion_origen_id=movement_data.ubicacion_origen_id,
                ubicacion_destino_id=movement_data.ubicacion_destino_id,
                cantidad=movement_data.cantidad,
                tipo_movimiento=tipo_movimiento,
                origen_tipo=movement_data.origen_tipo,
                origen_id=movement_data.origen_id,
                usuario_id=current_user.id,
                observaciones=movement_data.observaciones,
            )

            movement = self.repository.create(movement)

            self.audit_service.log_action(
                usuario_id=current_user.id,
                modulo="movements",
                accion="create",
                entidad="movimiento",
                entidad_id=movement.id,
                detalle=(
                    f"Movimiento registrado. "
                    f"Tipo: {tipo_movimiento}. "
                    f"Producto: {movement_data.producto_id}. "
                    f"Origen: {movement_data.ubicacion_origen_id}. "
                    f"Destino: {movement_data.ubicacion_destino_id}. "
                    f"Cantidad: {movement_data.cantidad}."
                ),
            )

            self.db.commit()
            return movement

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise

    def _normalize_tipo_movimiento(self, tipo_movimiento: str) -> str:
        tipo = tipo_movimiento.strip().lower()

        tipos_validos = {"traslado", "entrada", "salida", "ajuste"}
        if tipo not in tipos_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de movimiento no válido"
            )

        return tipo

    def _validate_movement_rules(
        self,
        movement_data: MovementCreate,
        tipo_movimiento: str
    ):
        if movement_data.cantidad <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad debe ser mayor que 0"
            )

        if tipo_movimiento == "traslado":
            if movement_data.ubicacion_origen_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El traslado requiere ubicación de origen"
                )

            if movement_data.ubicacion_destino_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El traslado requiere ubicación de destino"
                )

            if movement_data.ubicacion_origen_id == movement_data.ubicacion_destino_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La ubicación de origen y destino no pueden ser la misma"
                )

        elif tipo_movimiento == "entrada":
            if movement_data.ubicacion_destino_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La entrada requiere ubicación de destino"
                )

        elif tipo_movimiento == "salida":
            if movement_data.ubicacion_origen_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La salida requiere ubicación de origen"
                )

        elif tipo_movimiento == "ajuste":
            if (
                movement_data.ubicacion_origen_id is None
                and movement_data.ubicacion_destino_id is None
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El ajuste requiere al menos una ubicación"
                )

            if (
                movement_data.ubicacion_origen_id is not None
                and movement_data.ubicacion_destino_id is not None
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El ajuste debe indicar solo una ubicación: origen para ajuste negativo o destino para ajuste positivo"
                )

    def _apply_stock_operation(
        self,
        movement_data: MovementCreate,
        tipo_movimiento: str
    ):
        if tipo_movimiento == "traslado":
            self.stock_repository.remove_stock(
                producto_id=movement_data.producto_id,
                ubicacion_id=movement_data.ubicacion_origen_id,
                cantidad=movement_data.cantidad
            )
            self.stock_repository.add_stock(
                producto_id=movement_data.producto_id,
                ubicacion_id=movement_data.ubicacion_destino_id,
                cantidad=movement_data.cantidad
            )

        elif tipo_movimiento == "entrada":
            self.stock_repository.add_stock(
                producto_id=movement_data.producto_id,
                ubicacion_id=movement_data.ubicacion_destino_id,
                cantidad=movement_data.cantidad
            )

        elif tipo_movimiento == "salida":
            self.stock_repository.remove_stock(
                producto_id=movement_data.producto_id,
                ubicacion_id=movement_data.ubicacion_origen_id,
                cantidad=movement_data.cantidad
            )

        elif tipo_movimiento == "ajuste":
            if movement_data.ubicacion_origen_id is not None:
                self.stock_repository.remove_stock(
                    producto_id=movement_data.producto_id,
                    ubicacion_id=movement_data.ubicacion_origen_id,
                    cantidad=movement_data.cantidad
                )
            else:
                self.stock_repository.add_stock(
                    producto_id=movement_data.producto_id,
                    ubicacion_id=movement_data.ubicacion_destino_id,
                    cantidad=movement_data.cantidad
                )