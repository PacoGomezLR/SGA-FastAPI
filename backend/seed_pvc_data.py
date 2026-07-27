"""
Script de seed idempotente para poblar el entorno con datos de demostración
de una fábrica de perfiles de PVC (sistema Kömmerling 76 AD) y sus refuerzos
metálicos.

Reutiliza los servicios reales de la aplicación (SectionLayoutService,
ReceptionService, ShipmentService) para que el layout, el stock y los
movimientos generados respeten las mismas reglas de negocio que la API.

Uso:
    python seed_pvc_data.py

Requiere las mismas variables de entorno que el resto del backend
(DATABASE_URL vía .env / .env.production, según el entorno) y que ya
exista el usuario 'admin' (ver create_test_users.py).
"""

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.section import Section
from app.models.location import Location
from app.models.user import User
from app.schemas.reception import ReceptionCreate, ReceptionLineCreate
from app.schemas.shipment import ShipmentCreate, ShipmentLineCreate
from app.schemas.section_layout import GridLayout
from app.services.reception_service import ReceptionService
from app.services.shipment_service import ShipmentService
from app.services.section_layout_service import SectionLayoutService

# (nombre, sku, categoria, unidad_medida, stock_minimo)
SECCIONES = [
    {
        "nombre": "Sección Perfiles PVC",
        "descripcion": "Perfiles de PVC Kömmerling serie 76 AD",
        "direccion": "Estantería 1",
        "productos": [
            ("Perfil de marco 76 AD", "PVC-MAR-76", "Perfiles PVC", "Barra", 20),
            ("Perfil de hoja 76 AD", "PVC-HOJ-76", "Perfiles PVC", "Barra", 20),
            ("Perfil de junquillo 76 AD", "PVC-JUN-76", "Perfiles PVC", "Barra", 15),
            ("Perfil de cruceta 76 AD", "PVC-CRU-76", "Perfiles PVC", "Barra", 10),
            ("Perfil de persiana (guía) 76 AD", "PVC-PER-76", "Perfiles PVC", "Barra", 10),
            ("Tapajuntas PVC", "PVC-TAP-76", "Perfiles PVC", "Paquete", 5),
        ],
    },
    {
        "nombre": "Sección Cajones de Persiana",
        "descripcion": "Material para cajones de persiana",
        "direccion": "Estantería 2",
        "productos": [
            ("Panel de cajón de persiana", "PVC-CAJ-PAN", "Cajones de persiana", "Barra", 15),
            ("Tapa de registro cajón persiana", "PVC-CAJ-REG", "Cajones de persiana", "Unidad", 20),
        ],
    },
    {
        "nombre": "Sección Refuerzos Metálicos",
        "descripcion": "Refuerzos de acero galvanizado para perfiles de PVC",
        "direccion": "Estantería 3",
        "productos": [
            ("Refuerzo de marco 1,5 mm", "REF-MAR-15", "Refuerzos metálicos", "Barra", 20),
            ("Refuerzo de hoja 1,5 mm", "REF-HOJ-15", "Refuerzos metálicos", "Barra", 20),
            ("Refuerzo de cruceta 2 mm", "REF-CRU-20", "Refuerzos metálicos", "Barra", 10),
            ("Refuerzo de panel cajón 1,2 mm", "REF-CAJ-12", "Refuerzos metálicos", "Barra", 10),
        ],
    },
]

LAYOUT_SECCION = GridLayout(num_columnas=5, num_filas=4)

RECEPTION_SEED_MARK = "Recepción de demostración (seed PVC)"
SHIPMENT_SEED_MARK = "Salida de demostración (seed PVC)"


def get_or_create_category(db: Session, nombre: str) -> Category:
    categoria = db.query(Category).filter(Category.nombre == nombre).first()
    if categoria:
        return categoria

    categoria = Category(nombre=nombre, activo=True)
    db.add(categoria)
    db.flush()
    print(f"Categoría creada: '{nombre}'")
    return categoria


def get_or_create_product(
    db: Session, nombre: str, sku: str, categoria_nombre: str, unidad_medida: str, stock_minimo: int
) -> Product:
    producto = db.query(Product).filter(Product.sku == sku).first()
    if producto:
        return producto

    categoria = get_or_create_category(db, categoria_nombre)

    producto = Product(
        nombre=nombre,
        sku=sku,
        categoria_id=categoria.id,
        unidad_medida=unidad_medida,
        stock_minimo=stock_minimo,
        activo=True,
    )
    db.add(producto)
    db.flush()
    print(f"Producto creado: '{nombre}' ({sku})")
    return producto


def get_or_create_section(db: Session, nombre: str, descripcion: str, direccion: str) -> Section:
    seccion = db.query(Section).filter(Section.nombre == nombre).first()
    if seccion:
        return seccion

    seccion = Section(nombre=nombre, descripcion=descripcion, direccion=direccion, activo=True)
    db.add(seccion)
    db.flush()
    print(f"Sección creada: '{nombre}'")
    return seccion


def ensure_layout(db: Session, seccion: Section) -> None:
    tiene_ubicaciones = db.query(Location).filter(Location.seccion_id == seccion.id).first()
    if tiene_ubicaciones:
        print(f"Sección '{seccion.nombre}' ya tiene layout. No se genera de nuevo.")
        return

    SectionLayoutService(db).generate_layout(seccion.id, LAYOUT_SECCION)
    print(f"Layout generado para sección '{seccion.nombre}'.")


def get_admin_user(db: Session) -> User:
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        raise RuntimeError("No existe el usuario 'admin'. Ejecuta create_test_users.py primero.")
    return admin


def seed_receptions(db: Session, seccion: Section, productos: list[Product], usuario_id: int) -> None:
    from app.models.reception import Reception

    ya_sembrado = (
        db.query(Reception)
        .filter(Reception.seccion_id == seccion.id, Reception.observaciones == RECEPTION_SEED_MARK)
        .first()
    )
    if ya_sembrado:
        print(f"Ya existen recepciones de seed en '{seccion.nombre}'. No se crean de nuevo.")
        return

    ubicaciones = (
        db.query(Location).filter(Location.seccion_id == seccion.id).order_by(Location.id).all()
    )

    if not ubicaciones:
        print(f"Sin ubicaciones en '{seccion.nombre}', se omite la carga de stock.")
        return

    service = ReceptionService(db)

    for index, producto in enumerate(productos):
        ubicacion = ubicaciones[index % len(ubicaciones)]

        reception_data = ReceptionCreate(
            seccion_id=seccion.id,
            observaciones=RECEPTION_SEED_MARK,
            lineas=[
                ReceptionLineCreate(
                    producto_id=producto.id,
                    cantidad=producto.stock_minimo * 3 or 30,
                    ubicacion_destino_id=ubicacion.id,
                )
            ],
        )

        recepcion = service.create_reception(reception_data, usuario_id)
        service.confirm_reception(recepcion.id)

    print(f"{len(productos)} recepciones creadas y confirmadas en '{seccion.nombre}'.")


def seed_shipments(db: Session, seccion: Section, productos: list[Product], usuario_id: int) -> None:
    from app.models.shipment import Shipment
    from app.models.stock import Stock

    ya_sembrado = (
        db.query(Shipment)
        .filter(Shipment.seccion_id == seccion.id, Shipment.observaciones == SHIPMENT_SEED_MARK)
        .first()
    )
    if ya_sembrado:
        print(f"Ya existen salidas de seed en '{seccion.nombre}'. No se crean de nuevo.")
        return

    service = ShipmentService(db)
    creadas = 0

    for producto in productos[: max(1, len(productos) // 2)]:
        stock_item = (
            db.query(Stock)
            .filter(Stock.producto_id == producto.id)
            .first()
        )

        if not stock_item or stock_item.cantidad < 2:
            continue

        cantidad_salida = max(1, stock_item.cantidad // 3)

        shipment_data = ShipmentCreate(
            seccion_id=seccion.id,
            observaciones=SHIPMENT_SEED_MARK,
            lineas=[
                ShipmentLineCreate(
                    producto_id=producto.id,
                    ubicacion_origen_id=stock_item.ubicacion_id,
                    cantidad=cantidad_salida,
                )
            ],
        )

        service.create_shipment(shipment_data, usuario_id)
        creadas += 1

    print(f"{creadas} salidas creadas y confirmadas en '{seccion.nombre}'.")


def main() -> None:
    db = SessionLocal()

    try:
        admin = get_admin_user(db)

        for config in SECCIONES:
            seccion = get_or_create_section(db, config["nombre"], config["descripcion"], config["direccion"])
            db.commit()
            db.refresh(seccion)

            ensure_layout(db, seccion)
            db.commit()
            db.refresh(seccion)

            productos = [
                get_or_create_product(db, nombre, sku, categoria, unidad_medida, stock_minimo)
                for nombre, sku, categoria, unidad_medida, stock_minimo in config["productos"]
            ]
            db.commit()

            seed_receptions(db, seccion, productos, admin.id)
            seed_shipments(db, seccion, productos, admin.id)

    finally:
        db.close()


if __name__ == "__main__":
    main()
