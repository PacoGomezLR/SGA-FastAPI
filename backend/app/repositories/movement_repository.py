from sqlalchemy.orm import Session, joinedload

from app.models.movement import Movement


class MovementRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return (
            self.db.query(Movement)
            .options(
                joinedload(Movement.producto),
                joinedload(Movement.ubicacion_origen),
                joinedload(Movement.ubicacion_destino),
                joinedload(Movement.usuario),
            )
            .order_by(Movement.fecha.desc())
            .all()
        )

    def get_by_id(self, movement_id: int):
        return (
            self.db.query(Movement)
            .options(
                joinedload(Movement.producto),
                joinedload(Movement.ubicacion_origen),
                joinedload(Movement.ubicacion_destino),
                joinedload(Movement.usuario),
            )
            .filter(Movement.id == movement_id)
            .first()
        )

    def get_by_product(self, producto_id: int):
        return (
            self.db.query(Movement)
            .options(
                joinedload(Movement.producto),
                joinedload(Movement.ubicacion_origen),
                joinedload(Movement.ubicacion_destino),
                joinedload(Movement.usuario),
            )
            .filter(Movement.producto_id == producto_id)
            .order_by(Movement.fecha.desc())
            .all()
        )

    def create(self, movement: Movement):
        self.db.add(movement)
        self.db.flush()
        self.db.refresh(movement)
        return movement