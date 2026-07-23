def _payload_section(nombre="Seccion Central"):
    return {"nombre": nombre, "descripcion": "x", "direccion": "x", "activo": True}


def test_crear_seccion_con_layout_genera_zonas_y_ubicaciones(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section(),
            "pasillos": [
                {
                    "numero_pasillo": 1,
                    "lado_d": True,
                    "lado_i": True,
                    "eje_y_max": 2,
                    "fila_inicio": 1,
                    "fila_fin": 3,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    seccion_id = r.json()["id"]

    zonas = client.get("/zones/", headers=auth_headers).json()
    zonas_seccion = [z for z in zonas if z["numero_pasillo"] == 1]
    assert {z["lado"] for z in zonas_seccion} == {"D", "I"}

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    assert len([u for u in ubicaciones if u["eje_y"] is not None]) == 2 * 3 * 2


def test_crear_seccion_con_layout_sin_pasillos(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={"seccion": _payload_section(), "pasillos": []},
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert client.get("/zones/", headers=auth_headers).json() == []


def test_crear_seccion_con_nombre_duplicado_devuelve_400(client, auth_headers):
    client.post(
        "/section-layout/",
        json={"seccion": _payload_section(), "pasillos": []},
        headers=auth_headers,
    )
    r = client.post(
        "/section-layout/",
        json={"seccion": _payload_section(), "pasillos": []},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_generate_layout_sobre_seccion_inexistente_devuelve_404(client, auth_headers):
    r = client.post(
        "/section-layout/9999/generate",
        json={"pasillos": []},
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_generate_layout_agrega_pasillos_a_seccion_existente(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={"seccion": _payload_section(), "pasillos": []},
        headers=auth_headers,
    )
    seccion_id = r.json()["id"]

    r = client.post(
        f"/section-layout/{seccion_id}/generate",
        json={
            "pasillos": [
                {
                    "numero_pasillo": 5,
                    "lado_d": False,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 1,
                    "fila_fin": 1,
                }
            ]
        },
        headers=auth_headers,
    )
    assert r.status_code == 200

    zonas = client.get("/zones/", headers=auth_headers).json()
    zona = next(z for z in zonas if z["numero_pasillo"] == 5)
    assert zona["lado"] is None
    assert zona["nombre"] == "Pasillo 5"


def test_generate_layout_con_zona_duplicada_devuelve_400(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section(),
            "pasillos": [
                {
                    "numero_pasillo": 1,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 1,
                    "fila_fin": 1,
                }
            ],
        },
        headers=auth_headers,
    )
    seccion_id = r.json()["id"]

    r = client.post(
        f"/section-layout/{seccion_id}/generate",
        json={
            "pasillos": [
                {
                    "numero_pasillo": 1,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 1,
                    "fila_fin": 1,
                }
            ]
        },
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_pasillo_con_rejilla_demasiado_grande_devuelve_422(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section(),
            "pasillos": [
                {
                    "numero_pasillo": 1,
                    "lado_d": False,
                    "lado_i": False,
                    "eje_y_max": 201,
                    "fila_inicio": 1,
                    "fila_fin": 1,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r.status_code == 422


def test_fila_fin_menor_que_fila_inicio_devuelve_422(client, auth_headers):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section(),
            "pasillos": [
                {
                    "numero_pasillo": 1,
                    "lado_d": False,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 5,
                    "fila_fin": 2,
                }
            ],
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
        json={"seccion": _payload_section(), "pasillos": []},
        headers=headers,
    )
    assert r.status_code == 403


def test_dos_secciones_mismo_pasillo_y_lado_sin_solape_de_filas_ok(client, auth_headers):
    r1 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion A"),
            "pasillos": [
                {
                    "numero_pasillo": 3,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 1,
                    "fila_fin": 5,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r1.status_code == 201

    r2 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion B"),
            "pasillos": [
                {
                    "numero_pasillo": 3,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 6,
                    "fila_fin": 10,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r2.status_code == 201

    zonas = client.get("/zones/", headers=auth_headers).json()
    zonas_pasillo_3 = [z for z in zonas if z["numero_pasillo"] == 3 and z["lado"] == "D"]
    assert len(zonas_pasillo_3) == 2


def test_dos_secciones_mismo_pasillo_y_lado_con_solape_de_filas_devuelve_400(client, auth_headers):
    r1 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion A"),
            "pasillos": [
                {
                    "numero_pasillo": 4,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 1,
                    "fila_fin": 5,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r1.status_code == 201

    r2 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion B"),
            "pasillos": [
                {
                    "numero_pasillo": 4,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 3,
                    "fila_fin": 8,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r2.status_code == 400


def test_mismo_pasillo_distinto_lado_no_bloquea_por_solape(client, auth_headers):
    r1 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion A"),
            "pasillos": [
                {
                    "numero_pasillo": 7,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": 1,
                    "fila_fin": 5,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r1.status_code == 201

    r2 = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section("Seccion B"),
            "pasillos": [
                {
                    "numero_pasillo": 7,
                    "lado_d": False,
                    "lado_i": True,
                    "eje_y_max": 1,
                    "fila_inicio": 1,
                    "fila_fin": 5,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r2.status_code == 201
