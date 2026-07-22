from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneUpdate


class ZoneRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Zone).all()

    def get_by_id(self, zone_id: int):
        return self.db.query(Zone).filter(Zone.id == zone_id).first()

    def get_by_section_and_name(self, seccion_id: int, nombre: str):
        return (
            self.db.query(Zone)
            .filter(Zone.seccion_id == seccion_id, Zone.nombre == nombre)
            .first()
        )

    def create(self, zone_data: ZoneCreate):
        new_zone = Zone(**zone_data.model_dump())
        self.db.add(new_zone)
        self.db.commit()
        self.db.refresh(new_zone)
        return new_zone

    def update(self, zone: Zone, zone_data: ZoneUpdate):
        update_data = zone_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(zone, key, value)

        self.db.commit()
        self.db.refresh(zone)
        return zone

    def delete(self, zone: Zone):
        self.db.delete(zone)
        self.db.commit()