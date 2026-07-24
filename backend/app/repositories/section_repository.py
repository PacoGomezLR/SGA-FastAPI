from sqlalchemy.orm import Session

from app.models.section import Section
from app.schemas.section import SectionCreate, SectionUpdate


class SectionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Section).order_by(Section.id).all()

    def get_by_id(self, section_id: int):
        return self.db.query(Section).filter(Section.id == section_id).first()

    def get_by_name(self, nombre: str):
        return self.db.query(Section).filter(Section.nombre == nombre).first()

    def create(self, section_data: SectionCreate):
        new_section = Section(**section_data.model_dump())
        self.db.add(new_section)
        self.db.commit()
        self.db.refresh(new_section)
        return new_section

    def update(self, section: Section, section_data: SectionUpdate):
        update_data = section_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(section, key, value)

        self.db.commit()
        self.db.refresh(section)
        return section

    def delete(self, section: Section):
        self.db.delete(section)
        self.db.commit()
