"""
Fixtures compartidas para toda la suite de tests.

Motor SQLite en memoria + override de get_db + usuario/token de prueba.
Ningún test modifica código de producción — todo se gestiona mediante
app.dependency_overrides de FastAPI.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app as fastapi_app
from app.models.category import Category
from app.models.role import Role
from app.models.user import User
from app.security.utils.hash import hash_password
from app.security.utils.jwt_handler import create_access_token

# Importar todos los modelos para que Base.metadata los registre
import app.models  # noqa: F401

# ---------------------------------------------------------------------------
# Motor SQLite en memoria — se crea una vez por sesión de pytest
# ---------------------------------------------------------------------------

SQLITE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
)

# Activar foreign keys en SQLite (desactivadas por defecto)
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Fixtures de base de datos
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """
    Crea todas las tablas en SQLite antes de que empiece la sesión de tests
    y las elimina al finalizar. scope="session" significa que esto ocurre
    una sola vez para toda la ejecución de pytest.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """
    Sesión de base de datos aislada para cada test.
    Hace rollback automático al finalizar — los tests no se contaminan entre sí.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """
    TestClient de FastAPI con get_db sobreescrito para usar SQLite en memoria.
    Cada test recibe un cliente limpio con su propia sesión aislada.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Fixtures de datos
# ---------------------------------------------------------------------------

@pytest.fixture()
def rol_admin(db_session):
    """Rol 'administrador' insertado en la BD de test."""
    rol = Role(nombre="administrador", descripcion="Acceso total", activo=True)
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)
    return rol


@pytest.fixture()
def usuario_admin(db_session, rol_admin):
    """
    Usuario administrador con contraseña hasheada.
    Depende de rol_admin — garantiza que el rol existe antes de crear el usuario.
    """
    usuario = User(
        nombre="Admin Test",
        email="admin@test.com",
        username="admin_test",
        password_hash=hash_password("password_segura_123"),
        rol_id=rol_admin.id,
        activo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    return usuario


@pytest.fixture()
def token_admin(usuario_admin):
    """
    JWT válido generado con create_access_token real (no mock).
    Incluye 'sub' y 'rol' igual que el endpoint /auth/login de producción.
    """
    return create_access_token(data={
        "sub": usuario_admin.username,
        "rol": "administrador",
    })


@pytest.fixture()
def auth_headers(token_admin):
    """Cabeceras HTTP listas para usar en requests autenticadas."""
    return {"Authorization": f"Bearer {token_admin}"}


@pytest.fixture()
def categoria_test(db_session):
    """Categoría de prueba necesaria para crear productos."""
    categoria = Category(nombre="Categoría Test", activo=True)
    db_session.add(categoria)
    db_session.commit()
    db_session.refresh(categoria)
    return categoria
