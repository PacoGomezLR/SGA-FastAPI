import os

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.security.utils.hash import hash_password


def get_role_by_name(db: Session, role_name: str) -> Role | None:
    return db.query(Role).filter(Role.nombre == role_name).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def create_user_if_not_exists(
    db: Session,
    nombre: str,
    email: str,
    username: str,
    password: str,
    role_name: str,
) -> None:
    existing_user = get_user_by_username(db, username)
    if existing_user:
        print(f"Usuario '{username}' ya existe. No se crea de nuevo.")
        return

    role = get_role_by_name(db, role_name)
    if role is None:
        print(f"ERROR: no existe el rol '{role_name}' en la tabla roles.")
        return

    new_user = User(
        nombre=nombre,
        email=email,
        username=username,
        password_hash=hash_password(password),
        rol_id=role.id,
        activo=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print(
        f"Usuario creado: username='{new_user.username}', "
        f"rol='{role.nombre}', id={new_user.id}"
    )


def main() -> None:
    db = SessionLocal()

    try:
        create_user_if_not_exists(
            db=db,
            nombre="Administrador",
            email=os.environ.get("TEST_ADMIN_EMAIL", "admin@test.com"),
            username=os.environ.get("TEST_ADMIN_USERNAME", "admin"),
            password=os.environ["TEST_ADMIN_PASSWORD"],
            role_name="administrador",
        )

        create_user_if_not_exists(
            db=db,
            nombre="Supervisor",
            email=os.environ.get("TEST_SUPERVISOR_EMAIL", "supervisor@test.com"),
            username=os.environ.get("TEST_SUPERVISOR_USERNAME", "supervisor"),
            password=os.environ["TEST_SUPERVISOR_PASSWORD"],
            role_name="supervisor",
        )

        create_user_if_not_exists(
            db=db,
            nombre="Operario",
            email=os.environ.get("TEST_OPERARIO_EMAIL", "operario@test.com"),
            username=os.environ.get("TEST_OPERARIO_USERNAME", "operario"),
            password=os.environ["TEST_OPERARIO_PASSWORD"],
            role_name="operario",
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()