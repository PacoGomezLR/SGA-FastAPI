from sqlalchemy.orm import Session

from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate


class LocationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Location).all()

    def get_by_id(self, location_id: int):
        return self.db.query(Location).filter(Location.id == location_id).first()

    def get_by_zone_and_code(self, zona_id: int, codigo: str):
        return (
            self.db.query(Location)
            .filter(Location.zona_id == zona_id, Location.codigo == codigo)
            .first()
        )

    def create(self, location_data: LocationCreate):
        new_location = Location(**location_data.model_dump())
        self.db.add(new_location)
        self.db.commit()
        self.db.refresh(new_location)
        return new_location

    def update(self, location: Location, location_data: LocationUpdate):
        update_data = location_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(location, key, value)

        self.db.commit()
        self.db.refresh(location)
        return location

    def delete(self, location: Location):
        self.db.delete(location)
        self.db.commit()