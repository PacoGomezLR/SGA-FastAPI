import os

from app.security.utils.hash import hash_password

password = os.environ.get("ADMIN_PASSWORD")
if not password:
    raise RuntimeError("La variable de entorno ADMIN_PASSWORD no está definida.")

hash_password(password)
print("Hash generado correctamente. Úsalo para insertar el usuario administrador en la base de datos.")