"""
Crea las secciones "Sección Centro 1" y "Sección Centro 2" con el mismo
layout que ya existen en local (creadas manualmente vía interfaz), para
replicar ese estado en otro entorno (p. ej. Neon).

Uso:
    python create_centros.py
"""

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.section import Section
from app.schemas.section_layout import GridLayout
from app.services.section_layout_service import SectionLayoutService

SECCIONES = [
    {
        "nombre": "Sección Centro 1",
        "descripcion": "Zona de material para suministrar el centro de mecanizado 1",
        "direccion": "Zona PVC",
        "layout": GridLayout(num_columnas=4, num_filas=10),
    },
    {
        "nombre": "Sección Centro 2",
        "descripcion": "Zona de material para suministrar el centro de mecanizado 2",
        "direccion": "Zona PVC",
        "layout": GridLayout(num_columnas=4, num_filas=6),
    },
]


def main() -> None:
    db: Session = SessionLocal()

    try:
        for config in SECCIONES:
            existente = db.query(Section).filter(Section.nombre == config["nombre"]).first()
            if existente:
                print(f"Sección '{config['nombre']}' ya existe (id={existente.id}). No se crea de nuevo.")
                continue

            seccion = Section(
                nombre=config["nombre"],
                descripcion=config["descripcion"],
                direccion=config["direccion"],
                activo=True,
            )
            db.add(seccion)
            db.flush()

            SectionLayoutService(db).generate_layout(seccion.id, config["layout"])
            db.commit()

            print(f"Sección '{config['nombre']}' creada (id={seccion.id}) con layout generado.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
