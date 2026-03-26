from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.movement import Movement
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
        self.stock_repository = StockRepository(db)
        self.product_repository = ProductRepository(db)
        self.location_repository = LocationRepository(db)

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

    def create_movement(self, movement_data: MovementCreate, usuario_id: int):
        producto = self.product_repository.get_by_id(movement_data.producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id {movement_data.producto_id} no encontrado"
            )

        ubicacion_origen = self.location_repository.get_by_id(movement_data.ubicacion_origen_id)
        if not ubicacion_origen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ubicación de origen con id {movement_data.ubicacion_origen_id} no encontrada"
            )

        if movement_data.ubicacion_destino_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El movimiento interno requiere ubicación de destino"
            )

        ubicacion_destino = self.location_repository.get_by_id(movement_data.ubicacion_destino_id)
        if not ubicacion_destino:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ubicación de destino con id {movement_data.ubicacion_destino_id} no encontrada"
            )

        if movement_data.ubicacion_origen_id == movement_data.ubicacion_destino_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La ubicación de origen y destino no pueden ser la misma"
            )

        if movement_data.cantidad <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad debe ser mayor que 0"
            )

        stock_origen = self.stock_repository.get_by_product_and_location(
            movement_data.producto_id,
            movement_data.ubicacion_origen_id
        )

        if not stock_origen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe stock del producto en la ubicación de origen"
            )

        if stock_origen.cantidad < movement_data.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock insuficiente en la ubicación de origen"
            )

        stock_destino = self.stock_repository.get_by_product_and_location(
            movement_data.producto_id,
            movement_data.ubicacion_destino_id
        )

        try:
            stock_origen.cantidad -= movement_data.cantidad

            if stock_destino:
                stock_destino.cantidad += movement_data.cantidad
            else:
                self.stock_repository.create_from_movement(
                    producto_id=movement_data.producto_id,
                    ubicacion_id=movement_data.ubicacion_destino_id,
                    cantidad=movement_data.cantidad
                )

            movement = Movement(
                producto_id=movement_data.producto_id,
                ubicacion_origen_id=movement_data.ubicacion_origen_id,
                ubicacion_destino_id=movement_data.ubicacion_destino_id,
                cantidad=movement_data.cantidad,
                tipo_movimiento="traslado",
                usuario_id=usuario_id,
                observaciones=movement_data.observaciones
            )

            self.db.add(movement)
            self.db.commit()
            self.db.refresh(movement)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=usuario_id,
                modulo="movements",
                accion="create",
                entidad="movimiento",
                entidad_id=movement.id,
                detalle=(
                    f"Movimiento interno del producto {movement.producto_id} "
                    f"desde ubicación {movement.ubicacion_origen_id} "
                    f"hacia ubicación {movement.ubicacion_destino_id} "
                    f"por cantidad {movement.cantidad}"
                ),
            )

            return movement

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al registrar el movimiento interno: {str(e)}"
            )