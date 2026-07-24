def _crear_seccion_con_layout(client, auth_headers, nombre, num_columnas, num_filas):
    r = client.post(
        "/section-layout/",
        json={
            "seccion": {"nombre": nombre, "descripcion": "x", "direccion": "x", "activo": True},
            "layout": {"num_columnas": num_columnas, "num_filas": num_filas},
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


def test_ampliar_columnas_ok(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize A", 3, 2)

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={"num_columnas": 6},
        headers=auth_headers,
    )
    assert r.status_code == 200

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_seccion = [u for u in ubicaciones if u["seccion_id"] == seccion_id]
    columnas = sorted({u["columna"] for u in ubicaciones_seccion})
    assert columnas == [1, 2, 3, 4, 5, 6]
    assert len(ubicaciones_seccion) == 6 * 2


def test_ampliar_filas_ok(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize B", 2, 3)

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={"num_filas": 5},
        headers=auth_headers,
    )
    assert r.status_code == 200

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_seccion = [u for u in ubicaciones if u["seccion_id"] == seccion_id]
    filas = sorted({u["fila"] for u in ubicaciones_seccion})
    assert filas == [1, 2, 3, 4, 5]
    assert len(ubicaciones_seccion) == 2 * 5


def test_reducir_columnas_sin_stock_ok(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize C", 5, 2)

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={"num_columnas": 2},
        headers=auth_headers,
    )
    assert r.status_code == 200

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_seccion = [u for u in ubicaciones if u["seccion_id"] == seccion_id]
    assert len(ubicaciones_seccion) == 2 * 2


def test_reducir_columnas_con_stock_devuelve_400(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize D", 3, 2)

    r = client.post(
        "/categories/",
        json={"nombre": "Cat Resize Section", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    categoria_id = r.json()["id"]

    r = client.post(
        "/products/",
        json={
            "nombre": "Producto Resize Section",
            "descripcion": "x",
            "categoria_id": categoria_id,
            "unidad_medida": "unidad",
            "activo": True,
        },
        headers=auth_headers,
    )
    producto_id = r.json()["id"]

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicacion_columna_3 = next(
        u for u in ubicaciones if u["seccion_id"] == seccion_id and u["columna"] == 3
    )

    r = client.post(
        "/stock/",
        json={"producto_id": producto_id, "ubicacion_id": ubicacion_columna_3["id"], "cantidad": 4},
        headers=auth_headers,
    )
    assert r.status_code == 201

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={"num_columnas": 2},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_reducir_filas_con_stock_devuelve_400(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize E", 2, 4)

    r = client.post(
        "/categories/",
        json={"nombre": "Cat Resize Filas", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    categoria_id = r.json()["id"]

    r = client.post(
        "/products/",
        json={
            "nombre": "Producto Resize Filas",
            "descripcion": "x",
            "categoria_id": categoria_id,
            "unidad_medida": "unidad",
            "activo": True,
        },
        headers=auth_headers,
    )
    producto_id = r.json()["id"]

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicacion_fila_4 = next(
        u for u in ubicaciones if u["seccion_id"] == seccion_id and u["fila"] == 4
    )

    r = client.post(
        "/stock/",
        json={"producto_id": producto_id, "ubicacion_id": ubicacion_fila_4["id"], "cantidad": 2},
        headers=auth_headers,
    )
    assert r.status_code == 201

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={"num_filas": 2},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_resize_seccion_inexistente_devuelve_404(client, auth_headers):
    r = client.patch(
        "/section-layout/9999/resize",
        json={"num_columnas": 5},
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_resize_sin_parametros_devuelve_400(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize Vacio", 2, 2)

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_resize_seccion_sin_layout_devuelve_400(client, auth_headers):
    r = client.post(
        "/sections/",
        json={"nombre": "Seccion Sin Layout Resize", "descripcion": "x", "direccion": "x", "activo": True},
        headers=auth_headers,
    )
    seccion_id = r.json()["id"]

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={"num_columnas": 3},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_ampliar_columnas_y_filas_a_la_vez(client, auth_headers):
    seccion_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize Ambos", 2, 2)

    r = client.patch(
        f"/section-layout/{seccion_id}/resize",
        json={"num_columnas": 4, "num_filas": 3},
        headers=auth_headers,
    )
    assert r.status_code == 200

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_seccion = [u for u in ubicaciones if u["seccion_id"] == seccion_id]
    assert len(ubicaciones_seccion) == 4 * 3


def test_dos_secciones_independientes_no_interfieren_al_redimensionar(client, auth_headers):
    """
    Al redimensionar una sección, ninguna otra sección se ve afectada: son
    estanterías independientes, no hay efecto cascada entre ellas.
    """
    seccion_a_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize Indep A", 3, 3)
    seccion_b_id = _crear_seccion_con_layout(client, auth_headers, "Seccion Resize Indep B", 3, 3)

    r = client.patch(
        f"/section-layout/{seccion_a_id}/resize",
        json={"num_columnas": 10},
        headers=auth_headers,
    )
    assert r.status_code == 200

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_b = [u for u in ubicaciones if u["seccion_id"] == seccion_b_id]
    assert len(ubicaciones_b) == 9
    assert sorted({u["columna"] for u in ubicaciones_b}) == [1, 2, 3]
