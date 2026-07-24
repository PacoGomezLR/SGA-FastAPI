from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.section import Section
from app.models.shipment_line import ShipmentLine
from app.models.stock import Stock
from app.schemas.section_layout import GridLayout, ResizeSectionRequest, ResizeSectionResult, SectionLayoutCreate


def _construir_ubicaciones(seccion_id: int, layout: GridLayout) -> list[Location]:
    return [
        Location(
            seccion_id=seccion_id,
            codigo=f"F{fila}-A{columna}",
            activa=True,
            columna=columna,
            fila=fila,
        )
        for columna in range(1, layout.num_columnas + 1)
        for fila in range(1, layout.num_filas + 1)
    ]


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

        if data.layout is not None:
            seccion.num_columnas = data.layout.num_columnas
            seccion.num_filas = data.layout.num_filas
            self.db.add_all(_construir_ubicaciones(seccion.id, data.layout))

        self.db.commit()
        self.db.refresh(seccion)
        return seccion

    def generate_layout(self, section_id: int, layout: GridLayout):
        seccion = self.db.query(Section).filter(Section.id == section_id).first()
        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada",
            )

        tiene_ubicaciones = (
            self.db.query(Location).filter(Location.seccion_id == section_id).first()
        )
        if tiene_ubicaciones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La sección ya tiene un layout generado",
            )

        seccion.num_columnas = layout.num_columnas
        seccion.num_filas = layout.num_filas
        self.db.add_all(_construir_ubicaciones(section_id, layout))

        self.db.commit()
        return {"message": "Layout generado correctamente"}

    def resize_section(self, section_id: int, data: ResizeSectionRequest) -> ResizeSectionResult:
        seccion = self.db.query(Section).filter(Section.id == section_id).first()
        if not seccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sección no encontrada",
            )

        if data.num_columnas is None and data.num_filas is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes indicar num_columnas y/o num_filas",
            )

        ubicaciones = (
            self.db.query(Location).filter(Location.seccion_id == section_id).all()
        )
        if not ubicaciones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La sección no tiene layout generado todavía",
            )

        columnas_actuales = sorted({u.columna for u in ubicaciones if u.columna is not None})
        filas_actuales = sorted({u.fila for u in ubicaciones if u.fila is not None})
        num_columnas_actual = len(columnas_actuales)
        num_filas_actual = len(filas_actuales)

        if data.num_columnas is not None:
            self._resize_eje(
                seccion=seccion,
                ubicaciones=ubicaciones,
                eje="columna",
                valor_actual=num_columnas_actual,
                valor_nuevo=data.num_columnas,
                otro_rango=filas_actuales,
            )

        if data.num_filas is not None:
            self.db.flush()
            ubicaciones = (
                self.db.query(Location).filter(Location.seccion_id == section_id).all()
            )
            columnas_actuales = sorted({u.columna for u in ubicaciones if u.columna is not None})
            self._resize_eje(
                seccion=seccion,
                ubicaciones=ubicaciones,
                eje="fila",
                valor_actual=num_filas_actual,
                valor_nuevo=data.num_filas,
                otro_rango=columnas_actuales,
            )

        self.db.commit()
        return ResizeSectionResult(mensaje="Sección redimensionada correctamente")

    def _resize_eje(self, seccion: Section, ubicaciones: list[Location], eje: str, valor_actual: int, valor_nuevo: int, otro_rango: list[int]):
        if valor_nuevo == valor_actual:
            return

        if valor_nuevo < valor_actual:
            ubicaciones_a_eliminar = [
                u for u in ubicaciones if getattr(u, eje) is not None and getattr(u, eje) > valor_nuevo
            ]
            self._verificar_sin_historico(ubicaciones_a_eliminar, seccion.nombre)

            for ubicacion in ubicaciones_a_eliminar:
                self.db.delete(ubicacion)
        else:
            for valor in range(valor_actual + 1, valor_nuevo + 1):
                for otro in otro_rango:
                    columna = valor if eje == "columna" else otro
                    fila = otro if eje == "columna" else valor
                    self.db.add(
                        Location(
                            seccion_id=seccion.id,
                            codigo=f"F{fila}-A{columna}",
                            activa=True,
                            columna=columna,
                            fila=fila,
                        )
                    )

        if eje == "columna":
            seccion.num_columnas = valor_nuevo
        else:
            seccion.num_filas = valor_nuevo

    def _verificar_sin_historico(self, ubicaciones: list[Location], seccion_nombre: str):
        ubicacion_ids = [u.id for u in ubicaciones]
        if not ubicacion_ids:
            return

        con_stock = (
            self.db.query(Stock)
            .filter(Stock.ubicacion_id.in_(ubicacion_ids), Stock.cantidad > 0)
            .first()
        )
        if con_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"No se puede reducir la sección '{seccion_nombre}': hay ubicaciones "
                    "con stock en el rango que se eliminaría. Vacía el stock primero."
                ),
            )

        con_historico = (
            self.db.query(ShipmentLine)
            .filter(ShipmentLine.ubicacion_origen_id.in_(ubicacion_ids))
            .first()
        )
        if con_historico:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"No se puede reducir la sección '{seccion_nombre}': hay ubicaciones "
                    "en el rango con historial de salidas registradas y no se pueden eliminar."
                ),
            )
