def _crear_seccion(client, auth_headers, nombre):
    r = client.post(
        "/sections/",
        json={"nombre": nombre, "descripcion": "x", "direccion": "x", "activo": True},
        headers=auth_headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


def test_seccion_nueva_no_tiene_posicion(client, auth_headers):
    seccion_id = _crear_seccion(client, auth_headers, "Seccion Sin Posicion")

    r = client.get(f"/sections/{seccion_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["pos_x"] is None
    assert r.json()["pos_y"] is None


def test_actualizar_posicion_ok(client, auth_headers):
    seccion_id = _crear_seccion(client, auth_headers, "Seccion Con Posicion")

    r = client.patch(
        f"/sections/{seccion_id}/position",
        json={"pos_x": 120, "pos_y": 340},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["pos_x"] == 120
    assert r.json()["pos_y"] == 340

    r = client.get(f"/sections/{seccion_id}", headers=auth_headers)
    assert r.json()["pos_x"] == 120
    assert r.json()["pos_y"] == 340


def test_actualizar_posicion_a_null_vuelve_al_layout_automatico(client, auth_headers):
    seccion_id = _crear_seccion(client, auth_headers, "Seccion Reset Posicion")

    client.patch(
        f"/sections/{seccion_id}/position",
        json={"pos_x": 50, "pos_y": 50},
        headers=auth_headers,
    )

    r = client.patch(
        f"/sections/{seccion_id}/position",
        json={"pos_x": None, "pos_y": None},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["pos_x"] is None
    assert r.json()["pos_y"] is None


def test_actualizar_posicion_seccion_inexistente_devuelve_404(client, auth_headers):
    r = client.patch(
        "/sections/9999/position",
        json={"pos_x": 10, "pos_y": 10},
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_actualizar_posicion_requiere_rol_administrador_o_supervisor(client, db_session, rol_admin, auth_headers):
    from app.models.role import Role
    from app.models.user import User
    from app.security.utils.hash import hash_password
    from app.security.utils.jwt_handler import create_access_token

    seccion_id = _crear_seccion(client, auth_headers, "Seccion Posicion Rol")

    rol_operario = Role(nombre="operario", descripcion="Operario", activo=True)
    db_session.add(rol_operario)
    db_session.commit()
    db_session.refresh(rol_operario)

    usuario = User(
        nombre="Operario Test Pos",
        email="operario_pos@test.com",
        username="operario_pos_test",
        password_hash=hash_password("password_segura_123"),
        rol_id=rol_operario.id,
        activo=True,
    )
    db_session.add(usuario)
    db_session.commit()

    token_operario = create_access_token(data={"sub": usuario.username, "rol": "operario"})
    headers_operario = {"Authorization": f"Bearer {token_operario}"}

    r = client.patch(
        f"/sections/{seccion_id}/position",
        json={"pos_x": 10, "pos_y": 10},
        headers=headers_operario,
    )
    assert r.status_code == 403
