from sqlalchemy.orm import Session, joinedload

from app.models.shipment import Shipment


class ShipmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return (
            self.db.query(Shipment)
            .options(joinedload(Shipment.lineas))
            .all()
        )

    def get_by_id(self, shipment_id: int):
        return (
            self.db.query(Shipment)
            .options(joinedload(Shipment.lineas))
            .filter(Shipment.id == shipment_id)
            .first()
        )

    def create(self, shipment: Shipment):
        self.db.add(shipment)
        self.db.flush()
        return shipment

    def update(self, shipment: Shipment):
        self.db.flush()
        return shipment

    def delete(self, shipment: Shipment):
        self.db.delete(shipment)
        self.db.flush()