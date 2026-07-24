def _payload_section(nombre="Seccion Central"):
    return {"nombre": nombre, "descripcion": "x", "direccion": "x", "activo": True}


def test_crear_seccion_con_layout_genera_ubicaciones(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section(),
            "layout": {"num_columnas": 3, "num_filas": 2},
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    seccion_id = r.json()["id"]
    assert r.json()["num_columnas"] == 3
    assert r.json()["num_filas"] == 2

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_seccion = [u for u in ubicaciones if u["seccion_id"] == seccion_id]
    assert len(ubicaciones_seccion) == 6


def test_crear_seccion_con_nombre_duplicado_devuelve_400(client, auth_headers):
    client.post(
        "/section-layout/",
        json={"seccion": _payload_section(), "layout": {"num_columnas": 1, "num_filas": 1}},
        headers=auth_headers,
    )
    r = client.post(
        "/section-layout/",
        json={"seccion": _payload_section(), "layout": {"num_columnas": 1, "num_filas": 1}},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_generate_layout_sobre_seccion_inexistente_devuelve_404(client, auth_headers):
    r = client.post(
        "/section-layout/9999/generate",
        json={"layout": {"num_columnas": 1, "num_filas": 1}},
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_generate_layout_sobre_seccion_existente_sin_layout_previo(client, auth_headers):
    r = client.post(
        "/sections/",
        json=_payload_section("Seccion Sin Layout"),
        headers=auth_headers,
    )
    assert r.status_code == 201
    seccion_id = r.json()["id"]

    r = client.post(
        f"/section-layout/{seccion_id}/generate",
        json={"layout": {"num_columnas": 4, "num_filas": 3}},
        headers=auth_headers,
    )
    assert r.status_code == 200

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_seccion = [u for u in ubicaciones if u["seccion_id"] == seccion_id]
    assert len(ubicaciones_seccion) == 12


def test_generate_layout_sobre_seccion_con_layout_ya_generado_devuelve_400(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion Ya Con Layout"),
            "layout": {"num_columnas": 2, "num_filas": 2},
        },
        headers=auth_headers,
    )
    seccion_id = r.json()["id"]

    r = client.post(
        f"/section-layout/{seccion_id}/generate",
        json={"layout": {"num_columnas": 5, "num_filas": 5}},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_rejilla_demasiado_grande_devuelve_422(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section(),
            "layout": {"num_columnas": 201, "num_filas": 1},
        },
        headers=auth_headers,
    )
    assert r.status_code == 422


def test_crear_layout_requiere_rol_administrador_o_supervisor(client, db_session, rol_admin):
    from app.models.role import Role
    from app.models.user import User
    from app.security.utils.hash import hash_password
    from app.security.utils.jwt_handler import create_access_token

    rol_operario = Role(nombre="operario", descripcion="Operario", activo=True)
    db_session.add(rol_operario)
    db_session.commit()
    db_session.refresh(rol_operario)

    usuario = User(
        nombre="Operario Test",
        email="operario@test.com",
        username="operario_test",
        password_hash=hash_password("password_segura_123"),
        rol_id=rol_operario.id,
        activo=True,
    )
    db_session.add(usuario)
    db_session.commit()

    token = create_access_token(data={"sub": usuario.username, "rol": "operario"})
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post(
        "/section-layout/",
        json={"seccion": _payload_section(), "layout": {"num_columnas": 1, "num_filas": 1}},
        headers=headers,
    )
    assert r.status_code == 403


def test_dos_secciones_pueden_tener_layouts_iguales_sin_solape(client, auth_headers):
    """
    Cada sección es una estantería independiente: dos secciones distintas
    pueden tener exactamente la misma rejilla (mismas columnas/filas) sin
    ningún conflicto, porque no comparten espacio físico.
    """
    r1 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion Independiente A"),
            "layout": {"num_columnas": 5, "num_filas": 5},
        },
        headers=auth_headers,
    )
    assert r1.status_code == 201

    r2 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion Independiente B"),
            "layout": {"num_columnas": 5, "num_filas": 5},
        },
        headers=auth_headers,
    )
    assert r2.status_code == 201

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    seccion_a_id = r1.json()["id"]
    seccion_b_id = r2.json()["id"]

    assert len([u for u in ubicaciones if u["seccion_id"] == seccion_a_id]) == 25
    assert len([u for u in ubicaciones if u["seccion_id"] == seccion_b_id]) == 25
