from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.stock import Stock
from app.models.warehouse import Warehouse
from app.models.zone import Zone
from app.repositories.warehouse_repository import WarehouseRepository
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate


class WarehouseService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = WarehouseRepository(db)

    def get_all_warehouses(self):
        return self.repository.get_all()

    def get_warehouse_by_id(self, warehouse_id: int):
        warehouse = self.repository.get_by_id(warehouse_id)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Almacén no encontrado"
            )
        return warehouse

    def create_warehouse(self, warehouse_data: WarehouseCreate):
        existing = self.repository.get_by_name(warehouse_data.nombre)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un almacén con ese nombre"
            )
        return self.repository.create(warehouse_data)

    def update_warehouse(self, warehouse_id: int, warehouse_data: WarehouseUpdate):
        warehouse = self.repository.get_by_id(warehouse_id)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Almacén no encontrado"
            )

        if warehouse_data.nombre:
            existing = self.repository.get_by_name(warehouse_data.nombre)
            if existing and existing.id != warehouse_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe otro almacén con ese nombre"
                )

        return self.repository.update(warehouse, warehouse_data)

    def delete_warehouse(self, warehouse_id: int):
        warehouse = self.repository.get_by_id(warehouse_id)
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Almacén no encontrado"
            )

        self.repository.delete(warehouse)
        return {"message": "Almacén eliminado correctamente"}

    def get_occupancy(self):
        ubicacion_ocupada = (
            select(Stock.ubicacion_id)
            .where(Stock.cantidad > 0)
            .distinct()
            .subquery()
        )

        query = (
            select(
                Warehouse.id.label("almacen_id"),
                Warehouse.nombre.label("almacen_nombre"),
                func.count(Location.id).label("ubicaciones_totales"),
                func.count(
                    case((ubicacion_ocupada.c.ubicacion_id.isnot(None), 1))
                ).label("ubicaciones_ocupadas"),
            )
            .select_from(Warehouse)
            .join(Zone, Zone.almacen_id == Warehouse.id)
            .join(Location, Location.zona_id == Zone.id)
            .join(
                ubicacion_ocupada,
                ubicacion_ocupada.c.ubicacion_id == Location.id,
                isouter=True,
            )
            .where(Location.activa.is_(True))
            .group_by(Warehouse.id, Warehouse.nombre)
            .order_by(Warehouse.nombre)
        )

        filas = self.db.execute(query).all()

        return [
            {
                "almacen_id": fila.almacen_id,
                "almacen_nombre": fila.almacen_nombre,
                "ubicaciones_totales": fila.ubicaciones_totales,
                "ubicaciones_ocupadas": fila.ubicaciones_ocupadas,
                "porcentaje_ocupacion": (
                    round(fila.ubicaciones_ocupadas / fila.ubicaciones_totales * 100, 2)
                    if fila.ubicaciones_totales
                    else 0.0
                ),
            }
            for fila in filas
        ]