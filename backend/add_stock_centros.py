"""
Añade stock de Perfil de hoja y Perfil de marco 76 AD en las secciones
Centro 1 y Centro 2, sin tocar el stock existente en Sección Perfiles PVC.

Reutiliza ReceptionService (mismo patrón que seed_pvc_data.py) para que la
carga respete las reglas de negocio reales y quede reflejada en
Recepciones/Movimientos.

Uso:
    python add_stock_centros.py
"""

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.location import Location
from app.models.product import Product
from app.models.section import Section
from app.models.stock import Stock
from app.models.user import User
from app.schemas.reception import ReceptionCreate, ReceptionLineCreate
from app.services.reception_service import ReceptionService

SKUS_A_AÑADIR = ["PVC-MAR-76", "PVC-HOJ-76"]
SECCIONES_DESTINO = ["Sección Centro 1", "Sección Centro 2"]
CANTIDAD_OBJETIVO_POR_PRODUCTO = 300
RECEPTION_MARK = "Recepción de ampliación de stock (add_stock_centros v2)"


def get_admin_user(db: Session) -> User:
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        raise RuntimeError("No existe el usuario 'admin'.")
    return admin


def stock_actual(db: Session, producto_id: int, seccion_id: int) -> int:
    total = (
        db.query(Stock)
        .join(Location, Stock.ubicacion_id == Location.id)
        .filter(Stock.producto_id == producto_id, Location.seccion_id == seccion_id)
        .with_entities(Stock.cantidad)
        .all()
    )
    return sum(cantidad for (cantidad,) in total)


def main() -> None:
    db = SessionLocal()

    try:
        admin = get_admin_user(db)
        productos = db.query(Product).filter(Product.sku.in_(SKUS_A_AÑADIR)).all()

        if len(productos) != len(SKUS_A_AÑADIR):
            encontrados = {p.sku for p in productos}
            faltantes = set(SKUS_A_AÑADIR) - encontrados
            raise RuntimeError(f"No se encontraron los SKUs: {faltantes}")

        service = ReceptionService(db)

        for nombre_seccion in SECCIONES_DESTINO:
            seccion = db.query(Section).filter(Section.nombre == nombre_seccion).first()
            if not seccion:
                print(f"Sección '{nombre_seccion}' no encontrada, se omite.")
                continue

            ubicaciones = (
                db.query(Location)
                .filter(Location.seccion_id == seccion.id)
                .order_by(Location.id)
                .all()
            )
            if not ubicaciones:
                print(f"Sin ubicaciones en '{nombre_seccion}', se omite.")
                continue

            lineas = []
            for index, producto in enumerate(productos):
                actual = stock_actual(db, producto.id, seccion.id)
                faltante = CANTIDAD_OBJETIVO_POR_PRODUCTO - actual

                if faltante <= 0:
                    print(
                        f"'{producto.nombre}' en '{nombre_seccion}' ya tiene {actual} "
                        f"unidades (>= objetivo {CANTIDAD_OBJETIVO_POR_PRODUCTO}). No se añade más."
                    )
                    continue

                lineas.append(
                    ReceptionLineCreate(
                        producto_id=producto.id,
                        cantidad=faltante,
                        ubicacion_destino_id=ubicaciones[index % len(ubicaciones)].id,
                    )
                )

            if not lineas:
                print(f"'{nombre_seccion}' ya está al objetivo para todos los productos.")
                continue

            reception_data = ReceptionCreate(
                seccion_id=seccion.id,
                observaciones=RECEPTION_MARK,
                lineas=lineas,
            )

            recepcion = service.create_reception(reception_data, admin.id)
            service.confirm_reception(recepcion.id)

            print(f"Recepción creada y confirmada en '{nombre_seccion}' con {len(lineas)} líneas.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
