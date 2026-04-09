from sqlalchemy.orm import Session

from app.models.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate


class WarehouseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Warehouse).all()

    def get_by_id(self, warehouse_id: int):
        return self.db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()

    def get_by_name(self, nombre: str):
        return self.db.query(Warehouse).filter(Warehouse.nombre == nombre).first()

    def create(self, warehouse_data: WarehouseCreate):
        new_warehouse = Warehouse(**warehouse_data.model_dump())
        self.db.add(new_warehouse)
        self.db.commit()
        self.db.refresh(new_warehouse)
        return new_warehouse

    def update(self, warehouse: Warehouse, warehouse_data: WarehouseUpdate):
        update_data = warehouse_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(warehouse, key, value)

        self.db.commit()
        self.db.refresh(warehouse)
        return warehouse

    def delete(self, warehouse: Warehouse):
        self.db.delete(warehouse)
        self.db.commit()