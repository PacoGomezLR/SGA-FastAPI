from sqlalchemy.orm import Session, joinedload

from app.models.reception import Reception
from app.models.reception_line import ReceptionLine
from app.schemas.reception import ReceptionCreate


class ReceptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return (
            self.db.query(Reception)
            .options(
                joinedload(Reception.lineas)
            )
            .all()
        )

    def get_by_id(self, reception_id: int):
        return (
            self.db.query(Reception)
            .options(
                joinedload(Reception.lineas)
            )
            .filter(Reception.id == reception_id)
            .first()
        )

    def create(self, reception_data: ReceptionCreate, usuario_id: int):
        nueva_recepcion = Reception(
            almacen_id=reception_data.almacen_id,
            usuario_id=usuario_id,
            observaciones=reception_data.observaciones,
            estado="borrador"
        )

        self.db.add(nueva_recepcion)
        self.db.flush()

        for linea in reception_data.lineas:
            nueva_linea = ReceptionLine(
                recepcion_id=nueva_recepcion.id,
                producto_id=linea.producto_id,
                cantidad=linea.cantidad,
                ubicacion_destino_id=linea.ubicacion_destino_id,
                observaciones=linea.observaciones
            )
            self.db.add(nueva_linea)

        self.db.commit()
        self.db.refresh(nueva_recepcion)
        return nueva_recepcion

    def update_status(self, reception_id: int, nuevo_estado: str):
        recepcion = self.get_by_id(reception_id)
        if recepcion:
            recepcion.estado = nuevo_estado
            self.db.commit()
            self.db.refresh(recepcion)
        return recepcion

    def delete(self, reception_id: int):
        recepcion = self.get_by_id(reception_id)
        if recepcion:
            self.db.delete(recepcion)
            self.db.commit()
        return recepcion