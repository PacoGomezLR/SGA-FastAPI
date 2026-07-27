"""
Añade salidas de ejemplo confirmadas con los motivos "Rotura", "Consumo
interno" y "Muestra comercial", para que el gráfico "Salidas por motivo"
del Dashboard tenga datos variados en vez de solo "Otro".

Reutiliza ShipmentService (mismo patrón que los demás scripts de seed) para
que se respete stock disponible y se generen los Movement correspondientes.

El formato de observaciones replica exactamente el que genera el formulario
de Salidas.jsx: "MOTIVO" o "MOTIVO | texto libre".

Uso:
    python seed_shipment_reasons.py
"""

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.shipment import Shipment
from app.models.user import User
from app.schemas.shipment import ShipmentCreate, ShipmentLineCreate
from app.services.shipment_service import ShipmentService

SEED_MARK_PREFIX = "seed_shipment_reasons"

# (seccion_id, producto_id, ubicacion_origen_id, cantidad, motivo, texto_libre)
SALIDAS = [
    (1, 3, 3, 5, "ROTURA", "Perfil dañado durante el corte"),
    (3, 9, 41, 4, "CONSUMO", "Uso interno en mantenimiento de estanterías"),
    (2, 7, 21, 2, "MUESTRA", "Muestra para cliente potencial"),
]


def get_admin_user(db: Session) -> User:
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        raise RuntimeError("No existe el usuario 'admin'.")
    return admin


def main() -> None:
    db = SessionLocal()

    try:
        admin = get_admin_user(db)
        service = ShipmentService(db)

        for seccion_id, producto_id, ubicacion_id, cantidad, motivo, texto in SALIDAS:
            marca = f"{SEED_MARK_PREFIX}:{motivo}:{producto_id}"

            ya_existe = (
                db.query(Shipment)
                .filter(Shipment.observaciones.like(f"{motivo}%{marca}%"))
                .first()
            )
            if ya_existe:
                print(f"Ya existe una salida de seed para '{motivo}' (producto {producto_id}). Se omite.")
                continue

            observaciones = f"{motivo} | {texto} [{marca}]"

            shipment_data = ShipmentCreate(
                seccion_id=seccion_id,
                observaciones=observaciones,
                lineas=[
                    ShipmentLineCreate(
                        producto_id=producto_id,
                        ubicacion_origen_id=ubicacion_id,
                        cantidad=cantidad,
                    )
                ],
            )

            # create_shipment ya confirma automáticamente al crear (ver
            # comentario "CAMBIO CLAVE" en ShipmentService), a diferencia de
            # ReceptionService. No hace falta un segundo paso.
            service.create_shipment(shipment_data, admin.id)

            print(f"Salida creada y confirmada: motivo={motivo}, producto_id={producto_id}, cantidad={cantidad}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
