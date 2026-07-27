"""
Vacía los datos de "almacén" (productos, secciones, ubicaciones, stock,
recepciones, salidas, inventarios, movimientos, auditoría) para poder cargar
un catálogo de demostración distinto desde cero.

Preserva intencionadamente `roles` y `usuarios`: son infraestructura de
acceso, no datos de prueba del almacén, y otros scripts (create_test_users.py,
seed_*.py) dependen de que el usuario 'admin' siga existiendo.

Pide confirmación explícita mostrando el host/base de datos real al que se
va a conectar (leído de DATABASE_URL), para evitar vaciar por error una base
de datos equivocada (p. ej. Neon en vez de local).

Uso:
    python reset_db.py
"""

from urllib.parse import urlsplit

from sqlalchemy import text

from app.core.config import settings
from app.db.session import SessionLocal

# Orden de borrado: primero las tablas "hoja" que dependen de otras via FK,
# hacia arriba hasta las tablas base. auditoria y movimientos no tienen
# FK ON DELETE CASCADE hacia ellas, así que van primero.
TABLAS_EN_ORDEN = [
    "auditoria",
    "lineas_inventario",
    "inventarios",
    "lineas_salida",
    "salidas",
    "lineas_recepcion",
    "recepciones",
    "movimientos",
    "stock",
    "ubicaciones",
    "secciones",
    "productos",
    "categorias",
]


def describir_destino(database_url: str) -> str:
    partes = urlsplit(database_url)
    host = partes.hostname or "desconocido"
    puerto = partes.port or "?"
    bd = (partes.path or "").lstrip("/")
    return f"host={host} puerto={puerto} base_de_datos={bd}"


def main() -> None:
    destino = describir_destino(settings.database_url)
    print("Vas a VACIAR las siguientes tablas (roles y usuarios NO se tocan):")
    print(f"  {', '.join(TABLAS_EN_ORDEN)}")
    print(f"Entorno: APP_ENV={settings.app_env}")
    print(f"Destino: {destino}")
    print()

    respuesta = input("Escribe 'BORRAR' (en mayúsculas) para confirmar: ")
    if respuesta != "BORRAR":
        print("Cancelado. No se ha borrado nada.")
        return

    db = SessionLocal()
    try:
        for tabla in TABLAS_EN_ORDEN:
            db.execute(text(f"TRUNCATE TABLE {tabla} RESTART IDENTITY CASCADE"))
            print(f"Tabla '{tabla}' vaciada.")
        db.commit()
        print("\nListo. Base de datos de almacén vacía (roles/usuarios preservados).")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
