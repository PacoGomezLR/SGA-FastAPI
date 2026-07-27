"""
Sincroniza la disposición visual (posición, rotación, espejo) de las
secciones en el entorno actual con los valores fijos abajo, capturados de
otro entorno (p. ej. local) para replicarlos en Neon.

Uso:
    python sync_section_positions.py
"""

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.section import Section

DISPOSICION = {
    "Sección Perfiles PVC": {"pos_x": 1140, "pos_y": 0, "rotacion": 3, "espejo": True},
    "Sección Cajones de Persiana": {"pos_x": 2140, "pos_y": 0, "rotacion": 0, "espejo": False},
    "Sección Refuerzos Metálicos": {"pos_x": 280, "pos_y": 0, "rotacion": 0, "espejo": False},
    "Sección Centro 1": {"pos_x": 660, "pos_y": 560, "rotacion": 3, "espejo": True},
    "Sección Centro 2": {"pos_x": 1840, "pos_y": 560, "rotacion": 1, "espejo": False},
}


def main() -> None:
    db: Session = SessionLocal()

    try:
        for nombre, valores in DISPOSICION.items():
            seccion = db.query(Section).filter(Section.nombre == nombre).first()
            if not seccion:
                print(f"Sección '{nombre}' no encontrada, se omite.")
                continue

            seccion.pos_x = valores["pos_x"]
            seccion.pos_y = valores["pos_y"]
            seccion.rotacion = valores["rotacion"]
            seccion.espejo = valores["espejo"]

            print(
                f"'{nombre}': pos=({valores['pos_x']}, {valores['pos_y']}) "
                f"rotacion={valores['rotacion']} espejo={valores['espejo']}"
            )

        db.commit()
        print("Disposición sincronizada.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
