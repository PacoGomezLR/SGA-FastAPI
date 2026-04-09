from sqlalchemy.orm import Session, joinedload

from app.models.inventory import Inventory
from app.models.inventory_line import InventoryLine


class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    # =========================
    # INVENTARIO (CABECERA)
    # =========================

    def get_all(self):
        return (
            self.db.query(Inventory)
            .options(joinedload(Inventory.lineas))
            .order_by(Inventory.id.desc())
            .all()
        )

    def get_by_id(self, inventory_id: int):
        return (
            self.db.query(Inventory)
            .options(joinedload(Inventory.lineas))
            .filter(Inventory.id == inventory_id)
            .first()
        )

    def create(self, inventory: Inventory):
        self.db.add(inventory)
        self.db.flush()
        return inventory

    def update(self, inventory: Inventory):
        self.db.flush()
        self.db.refresh(inventory)
        return inventory

    def delete(self, inventory: Inventory):
        self.db.delete(inventory)
        self.db.flush()

    # =========================
    # LÍNEAS DE INVENTARIO
    # =========================

    def add_line(self, line: InventoryLine):
        self.db.add(line)
        self.db.flush()
        return line

    def get_line_by_id(self, line_id: int):
        return (
            self.db.query(InventoryLine)
            .filter(InventoryLine.id == line_id)
            .first()
        )

    def get_lines_by_inventory(self, inventory_id: int):
        return (
            self.db.query(InventoryLine)
            .filter(InventoryLine.inventario_id == inventory_id)
            .all()
        )

    def update_line(self, line: InventoryLine):
        self.db.flush()
        self.db.refresh(line)
        return line