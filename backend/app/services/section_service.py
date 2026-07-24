from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.stock import Stock
from app.models.section import Section
from app.repositories.section_repository import SectionRepository
from app.schemas.section import (
    SectionCreate,
    SectionUpdate,
    SectionPositionUpdate,
    SectionMirrorUpdate,
    SectionRotationUpdate,
)


class SectionService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = SectionRepository(db)

    def get_all_sections(self):
        return self.repository.get_all()

    def get_section_by_id(self, section_id: int):
        section = self.repository.get_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada"
            )
        return section

    def create_section(self, section_data: SectionCreate):
        existing = self.repository.get_by_name(section_data.nombre)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una sección con ese nombre"
            )
        return self.repository.create(section_data)

    def update_section(self, section_id: int, section_data: SectionUpdate):
        section = self.repository.get_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada"
            )

        if section_data.nombre:
            existing = self.repository.get_by_name(section_data.nombre)
            if existing and existing.id != section_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe otra sección con ese nombre"
                )

        return self.repository.update(section, section_data)

    def update_position(self, section_id: int, data: SectionPositionUpdate):
        section = self.repository.get_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada"
            )

        section.pos_x = data.pos_x
        section.pos_y = data.pos_y
        self.db.commit()
        self.db.refresh(section)
        return section

    def update_mirror(self, section_id: int, data: SectionMirrorUpdate):
        section = self.repository.get_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada"
            )

        section.espejo = data.espejo
        self.db.commit()
        self.db.refresh(section)
        return section

    def update_rotation(self, section_id: int, data: SectionRotationUpdate):
        section = self.repository.get_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada"
            )

        section.rotacion = (section.rotacion + data.direccion) % 4
        self.db.commit()
        self.db.refresh(section)
        return section

    def delete_section(self, section_id: int):
        section = self.repository.get_by_id(section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada"
            )

        self.repository.delete(section)
        return {"message": "Sección eliminada correctamente"}

    def get_occupancy(self):
        ubicacion_ocupada = (
            select(Stock.ubicacion_id)
            .where(Stock.cantidad > 0)
            .distinct()
            .subquery()
        )

        query = (
            select(
                Section.id.label("seccion_id"),
                Section.nombre.label("seccion_nombre"),
                func.count(Location.id).label("ubicaciones_totales"),
                func.count(
                    case((ubicacion_ocupada.c.ubicacion_id.isnot(None), 1))
                ).label("ubicaciones_ocupadas"),
            )
            .select_from(Section)
            .join(Location, Location.seccion_id == Section.id)
            .join(
                ubicacion_ocupada,
                ubicacion_ocupada.c.ubicacion_id == Location.id,
                isouter=True,
            )
            .where(Location.activa.is_(True))
            .group_by(Section.id, Section.nombre)
            .order_by(Section.nombre)
        )

        filas = self.db.execute(query).all()

        return [
            {
                "seccion_id": fila.seccion_id,
                "seccion_nombre": fila.seccion_nombre,
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
