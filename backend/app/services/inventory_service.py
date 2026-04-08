from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.inventory_line import InventoryLine
from app.models.location import Location
from app.models.movement import Movement
from app.models.product import Product
from app.models.user import User
from app.models.warehouse import Warehouse
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.inventory import InventoryCreate, InventoryLineCreate, InventoryUpdate
from app.services.audit_service import AuditService
from app.services.stock_service import StockService


class InventoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = InventoryRepository(db)
        self.stock_repository = StockRepository(db)
        self.stock_service = StockService(db)

    # =========================
    # CONSULTAS
    # =========================

    def get_all_inventories(self):
        return self.repository.get_all()

    def get_inventory_by_id(self, inventory_id: int):
        inventario = self.repository.get_by_id(inventory_id)
        if not inventario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventario no encontrado"
            )
        return inventario

    # =========================
    # CREACIÓN DE INVENTARIO
    # =========================

    def create_inventory(self, inventory_data: InventoryCreate, usuario_id: int):
        self._validate_user(usuario_id)
        self._validate_warehouse(inventory_data.almacen_id)

        try:
            inventario = Inventory(
                usuario_id=usuario_id,
                almacen_id=inventory_data.almacen_id,
                observaciones=inventory_data.observaciones,
                estado="borrador"
            )
            self.repository.create(inventario)

            for line_data in inventory_data.lineas:
                self._create_inventory_line(inventario.id, line_data)

            self.db.commit()
            inventario_creado = self.repository.get_by_id(inventario.id)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=usuario_id,
                modulo="inventories",
                accion="create",
                entidad="inventario",
                entidad_id=inventario_creado.id,
                detalle=f"Inventario creado en almacén {inventario_creado.almacen_id} con estado {inventario_creado.estado}"
            )

            return inventario_creado

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el inventario"
            )

    # =========================
    # ACTUALIZAR INVENTARIO
    # =========================

    def update_inventory(self, inventory_id: int, inventory_data: InventoryUpdate):
        inventario = self.get_inventory_by_id(inventory_id)

        if inventario.estado == "ajustado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede modificar un inventario ajustado"
            )

        if inventario.estado == "anulado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede modificar un inventario anulado"
            )

        try:
            if inventory_data.observaciones is not None:
                inventario.observaciones = inventory_data.observaciones

            if inventory_data.estado is not None:
                estados_validos = ["borrador", "contado", "ajustado", "anulado"]
                if inventory_data.estado not in estados_validos:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Estado de inventario no válido"
                    )

                inventario.estado = inventory_data.estado

            self.repository.update(inventario)
            self.db.commit()
            return self.repository.get_by_id(inventory_id)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar el inventario"
            )

    # =========================
    # LÍNEAS DE INVENTARIO
    # =========================

    def add_line_to_inventory(self, inventory_id: int, line_data: InventoryLineCreate):
        inventario = self.get_inventory_by_id(inventory_id)

        if inventario.estado != "borrador":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden añadir líneas a un inventario en borrador"
            )

        try:
            linea = self._create_inventory_line(inventory_id, line_data)
            self.db.commit()
            return linea

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al añadir línea al inventario"
            )

    def mark_inventory_as_counted(self, inventory_id: int):
        inventario = self.get_inventory_by_id(inventory_id)

        if inventario.estado == "anulado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede contar un inventario anulado"
            )

        if inventario.estado == "ajustado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El inventario ya está ajustado"
            )

        if not inventario.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede marcar como contado un inventario sin líneas"
            )

        try:
            inventario.estado = "contado"
            self.repository.update(inventario)
            self.db.commit()

            inventario_actualizado = self.repository.get_by_id(inventory_id)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=inventario_actualizado.usuario_id,
                modulo="inventories",
                accion="count",
                entidad="inventario",
                entidad_id=inventario_actualizado.id,
                detalle="Inventario marcado como contado"
            )

            return inventario_actualizado

        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al marcar el inventario como contado"
            )

    # =========================
    # AJUSTE DE INVENTARIO
    # =========================

    def apply_inventory_adjustment(self, inventory_id: int):
        inventario = self.get_inventory_by_id(inventory_id)

        # REGLA ENDURECIDA: solo se ajusta desde contado
        if inventario.estado != "contado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede ajustar un inventario en estado 'contado'"
            )

        if not inventario.lineas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede ajustar un inventario sin líneas"
            )

        try:
            hay_lineas_pendientes = False

            for linea in inventario.lineas:
                if linea.ajuste_aplicado:
                    continue

                hay_lineas_pendientes = True

                diferencia_calculada = linea.cantidad_real - linea.cantidad_sistema
                linea.diferencia = diferencia_calculada

                if diferencia_calculada > 0:
                    self.stock_service.sumar_stock(
                        linea.producto_id,
                        linea.ubicacion_id,
                        diferencia_calculada
                    )

                elif diferencia_calculada < 0:
                    cantidad_a_restar = abs(diferencia_calculada)

                    self.stock_service.validar_stock_suficiente(
                        linea.producto_id,
                        linea.ubicacion_id,
                        cantidad_a_restar
                    )

                    self.stock_service.restar_stock(
                        linea.producto_id,
                        linea.ubicacion_id,
                        cantidad_a_restar
                    )

                # Crear movement solo si realmente hay diferencia
                if diferencia_calculada != 0:
                    self._create_adjustment_movement(inventario, linea, diferencia_calculada)

                linea.ajuste_aplicado = True
                self.repository.update_line(linea)

            if not hay_lineas_pendientes:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Todas las líneas de este inventario ya fueron ajustadas"
                )

            inventario.estado = "ajustado"
            self.repository.update(inventario)

            self.db.commit()
            inventario_ajustado = self.repository.get_by_id(inventory_id)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=inventario_ajustado.usuario_id,
                modulo="inventories",
                accion="adjust",
                entidad="inventario",
                entidad_id=inventario_ajustado.id,
                detalle="Inventario ajustado completamente"
            )

            return inventario_ajustado

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al aplicar el ajuste del inventario"
            )

    def apply_line_adjustment(self, inventory_id: int, line_id: int):
        inventario = self.get_inventory_by_id(inventory_id)

        if inventario.estado == "anulado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede ajustar un inventario anulado"
            )

        if inventario.estado == "ajustado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El inventario ya ha sido ajustado"
            )

        linea = self.repository.get_line_by_id(line_id)

        if not linea or linea.inventario_id != inventory_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Línea de inventario no encontrada"
            )

        if linea.ajuste_aplicado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta línea ya fue ajustada"
            )

        try:
            diferencia_calculada = linea.cantidad_real - linea.cantidad_sistema
            linea.diferencia = diferencia_calculada

            if diferencia_calculada > 0:
                self.stock_service.sumar_stock(
                    linea.producto_id,
                    linea.ubicacion_id,
                    diferencia_calculada
                )

            elif diferencia_calculada < 0:
                cantidad_a_restar = abs(diferencia_calculada)

                self.stock_service.validar_stock_suficiente(
                    linea.producto_id,
                    linea.ubicacion_id,
                    cantidad_a_restar
                )

                self.stock_service.restar_stock(
                    linea.producto_id,
                    linea.ubicacion_id,
                    cantidad_a_restar
                )

            if diferencia_calculada != 0:
                self._create_adjustment_movement(inventario, linea, diferencia_calculada)

            linea.ajuste_aplicado = True
            self.repository.update_line(linea)

            lineas = self.repository.get_lines_by_inventory(inventory_id)
            if all(l.ajuste_aplicado for l in lineas):
                inventario.estado = "ajustado"
            else:
                inventario.estado = "contado"

            self.repository.update(inventario)

            self.db.commit()
            inventario_actualizado = self.repository.get_by_id(inventory_id)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=inventario_actualizado.usuario_id,
                modulo="inventories",
                accion="adjust_line",
                entidad="linea_inventario",
                entidad_id=linea.id,
                detalle=(
                    f"Ajuste aplicado a línea {linea.id} "
                    f"del producto {linea.producto_id} "
                    f"en ubicación {linea.ubicacion_id} "
                    f"con diferencia {linea.diferencia}"
                ),
            )

            return inventario_actualizado

        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al aplicar el ajuste de la línea"
            )

    # =========================
    # ANULAR INVENTARIO
    # =========================

    def cancel_inventory(self, inventory_id: int):
        inventario = self.get_inventory_by_id(inventory_id)

        if inventario.estado == "ajustado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede anular un inventario ya ajustado"
            )

        if inventario.estado == "anulado":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El inventario ya está anulado"
            )

        try:
            inventario.estado = "anulado"
            self.repository.update(inventario)
            self.db.commit()

            inventario_anulado = self.repository.get_by_id(inventory_id)

            audit_service = AuditService(self.db)
            audit_service.log_action(
                usuario_id=inventario_anulado.usuario_id,
                modulo="inventories",
                accion="cancel",
                entidad="inventario",
                entidad_id=inventario_anulado.id,
                detalle="Inventario anulado"
            )

            return inventario_anulado

        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al anular el inventario"
            )

    # =========================
    # MÉTODOS PRIVADOS
    # =========================

    def _create_inventory_line(self, inventory_id: int, line_data: InventoryLineCreate):
        inventario = self.get_inventory_by_id(inventory_id)

        self._validate_product(line_data.producto_id)
        self._validate_location(line_data.ubicacion_id)

        if line_data.cantidad_real < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad real no puede ser negativa"
            )

        for linea_existente in inventario.lineas:
            if (
                linea_existente.producto_id == line_data.producto_id
                and linea_existente.ubicacion_id == line_data.ubicacion_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ese producto en esa ubicación ya existe en este inventario"
                )

        stock_existente = self.stock_repository.get_by_product_and_location(
            line_data.producto_id,
            line_data.ubicacion_id
        )

        cantidad_sistema = stock_existente.cantidad if stock_existente else 0
        diferencia = line_data.cantidad_real - cantidad_sistema

        linea = InventoryLine(
            inventario_id=inventory_id,
            producto_id=line_data.producto_id,
            ubicacion_id=line_data.ubicacion_id,
            cantidad_sistema=cantidad_sistema,
            cantidad_real=line_data.cantidad_real,
            diferencia=diferencia,
            ajuste_aplicado=False,
            observaciones=line_data.observaciones
        )

        self.repository.add_line(linea)
        return linea

    def _create_adjustment_movement(self, inventario: Inventory, linea: InventoryLine, diferencia: int):
        cantidad_movimiento = abs(diferencia)

        if cantidad_movimiento == 0:
            return

        if diferencia > 0:
            ubicacion_origen_id = None
            ubicacion_destino_id = linea.ubicacion_id
            detalle = (
                f"Ajuste positivo generado por inventario {inventario.id}. "
                f"Se suman {cantidad_movimiento} unidades al producto {linea.producto_id} "
                f"en la ubicación {linea.ubicacion_id}"
            )
        else:
            ubicacion_origen_id = linea.ubicacion_id
            ubicacion_destino_id = None
            detalle = (
                f"Ajuste negativo generado por inventario {inventario.id}. "
                f"Se restan {cantidad_movimiento} unidades al producto {linea.producto_id} "
                f"en la ubicación {linea.ubicacion_id}"
            )

        movimiento = Movement(
            producto_id=linea.producto_id,
            ubicacion_origen_id=ubicacion_origen_id,
            ubicacion_destino_id=ubicacion_destino_id,
            cantidad=cantidad_movimiento,
            tipo_movimiento="ajuste",
            origen_tipo="inventario",
            origen_id=inventario.id,
            usuario_id=inventario.usuario_id,
            observaciones=detalle
        )

        self.db.add(movimiento)
        self.db.flush()

    def _validate_user(self, usuario_id: int):
        usuario = self.db.query(User).filter(User.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

    def _validate_warehouse(self, almacen_id: int):
        almacen = self.db.query(Warehouse).filter(Warehouse.id == almacen_id).first()
        if not almacen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Almacén no encontrado"
            )

    def _validate_product(self, producto_id: int):
        producto = self.db.query(Product).filter(Product.id == producto_id).first()
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

    def _validate_location(self, ubicacion_id: int):
        ubicacion = self.db.query(Location).filter(Location.id == ubicacion_id).first()
        if not ubicacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ubicación no encontrada"
            )