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
    (1, 1, 1, 12, "CONSUMO", "Fabricación de expositor de tienda"),
    (1, 2, 2, 10, "CONSUMO", "Prototipo interno de nueva ventana"),
    (3, 10, 42, 10, "CONSUMO", "Refuerzo de estanterías del almacén"),
    (2, 8, 22, 15, "CONSUMO", "Reposición de cajones de oficina"),
    (1, 4, 4, 8, "CONSUMO", "Formación de nuevos operarios"),
    (4, 1, 61, 196, "CONSUMO", "Consumo interno de perfil de marco en Centro 1"),
    (4, 2, 62, 196, "CONSUMO", "Consumo interno de perfil de hoja en Centro 1"),
    (5, 1, 181, 196, "CONSUMO", "Consumo interno de perfil de marco en Centro 2"),
    (5, 2, 182, 197, "CONSUMO", "Consumo interno de perfil de hoja en Centro 2"),
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
            # La marca incluye ubicacion_id además de producto_id: varias
            # entradas de CONSUMO reutilizan el mismo producto (marco/hoja)
            # en ubicaciones distintas (Centro 1 y Centro 2), y sin la
            # ubicación en la marca la detección de "ya existe" confundiría
            # esas entradas entre sí.
            marca = f"{SEED_MARK_PREFIX}:{motivo}:{producto_id}:{ubicacion_id}"

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
