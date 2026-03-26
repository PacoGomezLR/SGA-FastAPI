from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.warehouse_repository import WarehouseRepository
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate


class WarehouseService:
    def __init__(self, db: Session):
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