"""
Tests del sistema de autenticación.

Cubre el flujo completo de login y el endpoint /auth/me:
- credenciales correctas generan token válido
- credenciales incorrectas devuelven 401
- el token puede usarse para acceder a recursos protegidos
"""


def test_login_correcto(client, usuario_admin):
    """Login con credenciales válidas debe devolver 200 y un access_token."""
    response = client.post(
        "/auth/login",
        data={"username": "admin_test", "password": "password_segura_123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str)
    assert len(data["access_token"]) > 0


def test_login_password_incorrecta(client, usuario_admin):
    """Login con contraseña incorrecta debe devolver 401."""
    response = client.post(
        "/auth/login",
        data={"username": "admin_test", "password": "password_incorrecta"},
    )
    assert response.status_code == 401


def test_login_usuario_inexistente(client):
    """Login con usuario que no existe en la BD debe devolver 401."""
    response = client.post(
        "/auth/login",
        data={"username": "usuario_fantasma", "password": "cualquier_cosa"},
    )
    assert response.status_code == 401


def test_auth_me_con_token_valido(client, usuario_admin, auth_headers):
    """GET /auth/me con token válido debe devolver el username del usuario autenticado."""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin_test"
    assert data["rol"] == "administrador"
    assert data["activo"] is True


def test_auth_me_sin_token(client):
    """GET /auth/me sin token debe devolver 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401
