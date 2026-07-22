from sqlalchemy.orm import Session, joinedload

from app.models.reception import Reception
from app.models.reception_line import ReceptionLine
from app.schemas.reception import ReceptionCreate, ReceptionUpdate


class ReceptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return (
            self.db.query(Reception)
            .options(joinedload(Reception.lineas))
            .all()
        )

    def get_by_id(self, reception_id: int):
        return (
            self.db.query(Reception)
            .options(joinedload(Reception.lineas))
            .filter(Reception.id == reception_id)
            .first()
        )

    def create(self, reception_data: ReceptionCreate, usuario_id: int):
        nueva_recepcion = Reception(
            seccion_id=reception_data.seccion_id,
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

        self.db.flush()
        return nueva_recepcion

    def update(self, recepcion: Reception, reception_data: ReceptionUpdate):
        recepcion.seccion_id = reception_data.seccion_id
        recepcion.observaciones = reception_data.observaciones

        for linea in recepcion.lineas:
            self.db.delete(linea)

        self.db.flush()

        for linea in reception_data.lineas:
            nueva_linea = ReceptionLine(
                recepcion_id=recepcion.id,
                producto_id=linea.producto_id,
                cantidad=linea.cantidad,
                ubicacion_destino_id=linea.ubicacion_destino_id,
                observaciones=linea.observaciones
            )
            self.db.add(nueva_linea)

        self.db.flush()
        return recepcion

    def update_status(self, recepcion: Reception, nuevo_estado: str):
        recepcion.estado = nuevo_estado
        self.db.flush()
        return recepcion

    def delete(self, recepcion: Reception):
        self.db.delete(recepcion)
        self.db.flush()