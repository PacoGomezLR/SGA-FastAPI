from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.section import Section
from app.models.zone import Zone
from app.schemas.section_layout import PasilloLayout, SectionLayoutCreate


def _zona_nombre(numero_pasillo: int, lado: str | None) -> str:
    if lado:
        return f"Pasillo {numero_pasillo}-{lado}"
    return f"Pasillo {numero_pasillo}"


def _construir_zonas_y_ubicaciones(seccion_id: int, pasillos: list[PasilloLayout]):
    """Construye (sin persistir) las instancias de Zone/Location para los pasillos dados."""
    zonas: list[Zone] = []

    for pasillo in pasillos:
        lados: list[str | None] = []
        if pasillo.lado_d:
            lados.append("D")
        if pasillo.lado_i:
            lados.append("I")
        if not lados:
            lados.append(None)

        for lado in lados:
            zona = Zone(
                seccion_id=seccion_id,
                nombre=_zona_nombre(pasillo.numero_pasillo, lado),
                activo=True,
                numero_pasillo=pasillo.numero_pasillo,
                lado=lado,
            )

            ubicaciones = [
                Location(
                    codigo=f"A{y}-F{x}",
                    activa=True,
                    eje_y=y,
                    eje_x=x,
                )
                for y in range(1, pasillo.eje_y_max + 1)
                for x in range(1, pasillo.eje_x_max + 1)
            ]
            zona.ubicaciones = ubicaciones

            zonas.append(zona)

    return zonas


class SectionLayoutService:
    def __init__(self, db: Session):
        self.db = db

    def create_section_with_layout(self, data: SectionLayoutCreate):
        existing = (
            self.db.query(Section)
            .filter(Section.nombre == data.seccion.nombre)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una sección con ese nombre",
            )

        seccion = Section(**data.seccion.model_dump())
        self.db.add(seccion)
        self.db.flush()

        self._agregar_pasillos(seccion.id, data.pasillos)

        self.db.commit()
        self.db.refresh(seccion)
        return seccion

    def generate_layout(self, section_id: int, pasillos: list[PasilloLayout]):
        seccion = self.db.query(Section).filter(Section.id == section_id).first()
        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada",
            )

        self._agregar_pasillos(section_id, pasillos)

        self.db.commit()
        return {"message": "Pasillos generados correctamente"}

    def _agregar_pasillos(self, seccion_id: int, pasillos: list[PasilloLayout]):
        if not pasillos:
            return

        nuevas_zonas = _construir_zonas_y_ubicaciones(seccion_id, pasillos)

        nombres_nuevos = [zona.nombre for zona in nuevas_zonas]
        existentes = (
            self.db.query(Zone.nombre)
            .filter(Zone.seccion_id == seccion_id, Zone.nombre.in_(nombres_nuevos))
            .all()
        )
        if existentes:
            nombres_repetidos = ", ".join(nombre for (nombre,) in existentes)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existen zonas con ese nombre en esta sección: {nombres_repetidos}",
            )

        self.db.add_all(nuevas_zonas)
        self.db.flush()
