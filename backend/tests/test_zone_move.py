def _payload_section(nombre):
    return {"nombre": nombre, "descripcion": "x", "direccion": "x", "activo": True}


def _crear_seccion_con_pasillo(client, auth_headers, nombre, numero_pasillo, fila_inicio, fila_fin):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": _payload_section(nombre),
            "pasillos": [
                {
                    "numero_pasillo": numero_pasillo,
                    "lado_d": True,
                    "lado_i": False,
                    "eje_y_max": 1,
                    "fila_inicio": fila_inicio,
                    "fila_fin": fila_fin,
                }
            ],
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    seccion_id = r.json()["id"]

    zonas = client.get("/zones/", headers=auth_headers).json()
    zona = next(z for z in zonas if z["seccion_id"] == seccion_id)
    return seccion_id, zona["id"]


def test_mover_zona_a_hueco_libre(client, auth_headers):
    _, zona_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Movil", 10, 20, 24)

    r = client.post(
        f"/section-layout/zones/{zona_id}/move",
        json={"numero_pasillo": 10, "lado": "D", "fila_inicio": 1},
        headers=auth_headers,
    )
    assert r.status_code == 200
    zona = r.json()
    assert zona["numero_pasillo"] == 10
    assert zona["lado"] == "D"

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_zona = [u for u in ubicaciones if u["zona_id"] == zona_id]
    filas = sorted(u["eje_x"] for u in ubicaciones_zona)
    assert filas == [1, 2, 3, 4, 5]


def test_mover_zona_conserva_stock(client, auth_headers):
    seccion_id, zona_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Con Stock", 11, 1, 3)

    r = client.post(
        "/categories/",
        json={"nombre": "Cat Move Test", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    categoria_id = r.json()["id"]

    r = client.post(
        "/products/",
        json={
            "nombre": "Producto Move Test",
            "descripcion": "x",
            "categoria_id": categoria_id,
            "unidad_medida": "unidad",
            "activo": True,
        },
        headers=auth_headers,
    )
    producto_id = r.json()["id"]

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicacion = next(u for u in ubicaciones if u["zona_id"] == zona_id)

    r = client.post(
        "/stock/",
        json={"producto_id": producto_id, "ubicacion_id": ubicacion["id"], "cantidad": 7},
        headers=auth_headers,
    )
    assert r.status_code == 201

    r = client.post(
        f"/section-layout/zones/{zona_id}/move",
        json={"numero_pasillo": 11, "lado": "D", "fila_inicio": 50},
        headers=auth_headers,
    )
    assert r.status_code == 200

    stock = client.get("/stock/", headers=auth_headers).json()
    linea = next(s for s in stock if s["ubicacion_id"] == ubicacion["id"])
    assert linea["cantidad"] == 7


def test_mover_zona_a_espera_y_de_vuelta(client, auth_headers):
    _, zona_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Espera", 12, 1, 3)

    r = client.post(
        f"/section-layout/zones/{zona_id}/move",
        json={"numero_pasillo": None},
        headers=auth_headers,
    )
    assert r.status_code == 200
    zona = r.json()
    assert zona["numero_pasillo"] is None
    assert zona["lado"] is None

    r = client.post(
        f"/section-layout/zones/{zona_id}/move",
        json={"numero_pasillo": 12, "lado": "D", "fila_inicio": 1},
        headers=auth_headers,
    )
    assert r.status_code == 200
    zona = r.json()
    assert zona["numero_pasillo"] == 12


def test_mover_a_espera_no_valida_solapamiento(client, auth_headers):
    _, zona_a_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Espera A", 13, 1, 5)
    _, zona_b_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Espera B", 14, 1, 5)

    r = client.post(
        f"/section-layout/zones/{zona_a_id}/move",
        json={"numero_pasillo": None},
        headers=auth_headers,
    )
    assert r.status_code == 200

    r = client.post(
        f"/section-layout/zones/{zona_b_id}/move",
        json={"numero_pasillo": None},
        headers=auth_headers,
    )
    assert r.status_code == 200


def test_mover_zona_con_solape_devuelve_400(client, auth_headers):
    _, zona_a_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Fija", 20, 1, 5)
    _, zona_b_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion A Mover", 21, 1, 5)

    r = client.post(
        f"/section-layout/zones/{zona_b_id}/move",
        json={"numero_pasillo": 20, "lado": "D", "fila_inicio": 3},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_swap_de_dos_secciones_via_zona_de_espera(client, auth_headers):
    _, zona_a_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Swap A", 30, 1, 5)
    _, zona_b_id = _crear_seccion_con_pasillo(client, auth_headers, "Seccion Swap B", 30, 6, 10)

    # Mover A a espera
    r = client.post(
        f"/section-layout/zones/{zona_a_id}/move",
        json={"numero_pasillo": None},
        headers=auth_headers,
    )
    assert r.status_code == 200

    # Mover B al sitio que dejo A
    r = client.post(
        f"/section-layout/zones/{zona_b_id}/move",
        json={"numero_pasillo": 30, "lado": "D", "fila_inicio": 1},
        headers=auth_headers,
    )
    assert r.status_code == 200

    # Mover A (desde espera) al sitio que dejo B
    r = client.post(
        f"/section-layout/zones/{zona_a_id}/move",
        json={"numero_pasillo": 30, "lado": "D", "fila_inicio": 6},
        headers=auth_headers,
    )
    assert r.status_code == 200

    zonas = client.get("/zones/", headers=auth_headers).json()
    zona_a = next(z for z in zonas if z["id"] == zona_a_id)
    zona_b = next(z for z in zonas if z["id"] == zona_b_id)

    assert zona_a["numero_pasillo"] == 30
    assert zona_b["numero_pasillo"] == 30

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    filas_a = sorted(u["eje_x"] for u in ubicaciones if u["zona_id"] == zona_a_id)
    filas_b = sorted(u["eje_x"] for u in ubicaciones if u["zona_id"] == zona_b_id)

    assert filas_a == [6, 7, 8, 9, 10]
    assert filas_b == [1, 2, 3, 4, 5]


def test_mover_zona_inexistente_devuelve_404(client, auth_headers):
    r = client.post(
        "/section-layout/zones/9999/move",
        json={"numero_pasillo": 1, "lado": "D", "fila_inicio": 1},
        headers=auth_headers,
    )
    assert r.status_code == 404
