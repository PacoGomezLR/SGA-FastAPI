def _crear_seccion_con_layout(client, auth_headers, nombre, num_columnas, num_filas):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": {
                "nombre": nombre,
                "descripcion": "x",
                "direccion": "x",
                "activo": True,
            },
            "layout": {"num_columnas": num_columnas, "num_filas": num_filas},
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


def _crear_producto(client, auth_headers, nombre):
    r = client.post(
        "/categories/",
        json={"nombre": f"Cat {nombre}", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    categoria_id = r.json()["id"]

    r = client.post(
        "/products/",
        json={
            "nombre": nombre,
            "descripcion": "x",
            "categoria_id": categoria_id,
            "unidad_medida": "unidad",
            "activo": True,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


def test_occupancy_sin_stock_devuelve_cero_por_ciento(client, auth_headers):
    _crear_seccion_con_layout(client, auth_headers, "Seccion Vacia", 2, 2)

    r = client.get("/sections/occupancy", headers=auth_headers)
    assert r.status_code == 200

    datos = r.json()
    seccion = next(a for a in datos if a["seccion_nombre"] == "Seccion Vacia")
    assert seccion["ubicaciones_totales"] == 4
    assert seccion["ubicaciones_ocupadas"] == 0
    assert seccion["porcentaje_ocupacion"] == 0.0


def test_occupancy_calcula_porcentaje_correctamente(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Parcial", 2, 2)
    producto_id = _crear_producto(client, auth_headers, "Producto Test")

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_seccion = [u for u in ubicaciones if u["seccion_id"] == seccion_id]
    assert len(ubicaciones_seccion) == 4

    # Ocupa 1 de las 4 ubicaciones
    r = client.post(
        "/stock/",
        json={
            "producto_id": producto_id,
            "ubicacion_id": ubicaciones_seccion[0]["id"],
            "cantidad": 5,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201

    r = client.get("/sections/occupancy", headers=auth_headers)
    datos = r.json()
    seccion = next(a for a in datos if a["seccion_nombre"] == "Seccion Parcial")

    assert seccion["ubicaciones_totales"] == 4
    assert seccion["ubicaciones_ocupadas"] == 1
    assert seccion["porcentaje_ocupacion"] == 25.0


def test_occupancy_ignora_stock_con_cantidad_cero(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Cero", 1, 1)
    producto_id = _crear_producto(client, auth_headers, "Producto Cero")

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicacion = next(u for u in ubicaciones if u["seccion_id"] == seccion_id)

    client.post(
        "/stock/",
        json={
            "producto_id": producto_id,
            "ubicacion_id": ubicacion["id"],
            "cantidad": 0,
        },
        headers=auth_headers,
    )

    r = client.get("/sections/occupancy", headers=auth_headers)
    datos = r.json()
    seccion = next(a for a in datos if a["seccion_nombre"] == "Seccion Cero")

    assert seccion["ubicaciones_ocupadas"] == 0
    assert seccion["porcentaje_ocupacion"] == 0.0


def test_occupancy_sin_secciones_devuelve_lista_vacia(client, auth_headers):
    r = client.get("/sections/occupancy", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []
