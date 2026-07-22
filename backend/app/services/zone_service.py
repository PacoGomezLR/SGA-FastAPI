from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.section import Section
from app.repositories.zone_repository import ZoneRepository
from app.schemas.zone import ZoneCreate, ZoneUpdate


class ZoneService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ZoneRepository(db)

    def get_all_zones(self):
        return self.repository.get_all()

    def get_zone_by_id(self, zone_id: int):
        zone = self.repository.get_by_id(zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Zona no encontrada"
            )
        return zone

    def create_zone(self, zone_data: ZoneCreate):
        seccion = self.db.query(Section).filter(Section.id == zone_data.seccion_id).first()
        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La sección no existe"
            )

        existing = self.repository.get_by_section_and_name(
            zone_data.seccion_id, zone_data.nombre
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una zona con ese nombre en esa sección"
            )

        return self.repository.create(zone_data)

    def update_zone(self, zone_id: int, zone_data: ZoneUpdate):
        zone = self.repository.get_by_id(zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Zona no encontrada"
            )

        nueva_seccion_id = (
            zone_data.seccion_id if zone_data.seccion_id is not None else zone.seccion_id
        )
        nuevo_nombre = (
            zone_data.nombre if zone_data.nombre is not None else zone.nombre
        )

        seccion = self.db.query(Section).filter(Section.id == nueva_seccion_id).first()
        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La sección no existe"
            )

        existing = self.repository.get_by_section_and_name(
            nueva_seccion_id, nuevo_nombre
        )
        if existing and existing.id != zone_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otra zona con ese nombre en esa sección"
            )

        return self.repository.update(zone, zone_data)

    def delete_zone(self, zone_id: int):
        zone = self.repository.get_by_id(zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Zona no encontrada"
            )

        self.repository.delete(zone)
        return {"message": "Zona eliminada correctamente"}
