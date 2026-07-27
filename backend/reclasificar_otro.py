"""
Reclasifica las salidas antiguas del seed genérico ("Salida de demostración
(seed PVC)", sin motivo real) a Rotura, Consumo interno o Muestra comercial,
para que el motivo "Otro" deje de concentrar la mayoría de las salidas en el
gráfico "Salidas por motivo" del Dashboard.

Reescribe el campo `observaciones` de cada Shipment afectado con el mismo
formato que genera el formulario de Salidas.jsx ("MOTIVO | texto libre"),
sin tocar cantidades, stock ni movimientos ya generados.

Uso:
    python reclasificar_otro.py
"""

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.shipment import Shipment

SEED_GENERICO_MARK = "Salida de demostración (seed PVC)"

# (shipment_id, nuevo_motivo, texto_libre)
RECLASIFICACION = {
    1: ("ROTURA", "Perfil de marco dañado en transporte interno"),
    2: ("ROTURA", "Perfil de hoja con defecto de fabricación"),
    5: ("CONSUMO", "Refuerzo usado en reparación de estanterías"),
    6: ("CONSUMO", "Refuerzo usado en prueba de montaje"),
    3: ("MUESTRA", "Muestra de junquillo para cliente"),
    4: ("MUESTRA", "Muestra de panel de cajón para cliente"),
}


def main() -> None:
    db: Session = SessionLocal()

    try:
        for shipment_id, (motivo, texto) in RECLASIFICACION.items():
            salida = db.query(Shipment).filter(Shipment.id == shipment_id).first()

            if not salida:
                print(f"Salida id={shipment_id} no encontrada, se omite.")
                continue

            if salida.observaciones != SEED_GENERICO_MARK:
                print(
                    f"Salida id={shipment_id} ya no tiene el texto de seed genérico "
                    f"(observaciones actuales: {salida.observaciones!r}). Se omite para no pisar cambios."
                )
                continue

            salida.observaciones = f"{motivo} | {texto}"
            print(f"Salida id={shipment_id} reclasificada a '{motivo}'.")

        db.commit()
        print("Reclasificación completada.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
