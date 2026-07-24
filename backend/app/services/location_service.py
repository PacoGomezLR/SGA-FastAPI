from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.section import Section
from app.repositories.location_repository import LocationRepository
from app.schemas.location import LocationCreate, LocationUpdate


class LocationService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = LocationRepository(db)

    def get_all_locations(self):
        return self.repository.get_all()

    def get_location_by_id(self, location_id: int):
        location = self.repository.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ubicación no encontrada"
            )
        return location

    def create_location(self, location_data: LocationCreate):
        seccion = self.db.query(Section).filter(Section.id == location_data.seccion_id).first()
        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La sección no existe"
            )

        existing = self.repository.get_by_section_and_code(
            location_data.seccion_id, location_data.codigo
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una ubicación con ese código en esa sección"
            )

        return self.repository.create(location_data)

    def update_location(self, location_id: int, location_data: LocationUpdate):
        location = self.repository.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ubicación no encontrada"
            )

        nueva_seccion_id = (
            location_data.seccion_id if location_data.seccion_id is not None else location.seccion_id
        )
        nuevo_codigo = (
            location_data.codigo if location_data.codigo is not None else location.codigo
        )

        seccion = self.db.query(Section).filter(Section.id == nueva_seccion_id).first()
        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La sección no existe"
            )

        existing = self.repository.get_by_section_and_code(nueva_seccion_id, nuevo_codigo)
        if existing and existing.id != location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otra ubicación con ese código en esa sección"
            )

        return self.repository.update(location, location_data)

    def delete_location(self, location_id: int):
        location = self.repository.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ubicación no encontrada"
            )

        self.repository.delete(location)
        return {"message": "Ubicación eliminada correctamente"}
