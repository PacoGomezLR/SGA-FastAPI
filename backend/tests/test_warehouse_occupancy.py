def _crear_almacen_con_layout(client, auth_headers, nombre, eje_y_max, eje_x_max):
    r = client.post(
        "/warehouse-layout/",
        json={
            "warehouse": {
                "nombre": nombre,
                "descripcion": "x",
                "direccion": "x",
                "activo": True,
            },
            "pasillos": [
                {
                    "numero_pasillo": 1,
                    "lado_d": False,
                    "lado_i": False,
                    "eje_y_max": eje_y_max,
                    "eje_x_max": eje_x_max,
                }
            ],
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
    _crear_almacen_con_layout(client, auth_headers, "Almacen Vacio", 2, 2)

    r = client.get("/warehouses/occupancy", headers=auth_headers)
    assert r.status_code == 200

    datos = r.json()
    almacen = next(a for a in datos if a["almacen_nombre"] == "Almacen Vacio")
    assert almacen["ubicaciones_totales"] == 4
    assert almacen["ubicaciones_ocupadas"] == 0
    assert almacen["porcentaje_ocupacion"] == 0.0


def test_occupancy_calcula_porcentaje_correctamente(client, auth_headers):
    almacen_id = _crear_almacen_con_layout(client, auth_headers, "Almacen Parcial", 2, 2)
    producto_id = _crear_producto(client, auth_headers, "Producto Test")

    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicaciones_almacen = [
        u for u in ubicaciones if u["zona_id"] in
        [z["id"] for z in client.get("/zones/", headers=auth_headers).json()
         if z["almacen_id"] == almacen_id]
    ]
    assert len(ubicaciones_almacen) == 4

    # Ocupa 1 de las 4 ubicaciones
    r = client.post(
        "/stock/",
        json={
            "producto_id": producto_id,
            "ubicacion_id": ubicaciones_almacen[0]["id"],
            "cantidad": 5,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201

    r = client.get("/warehouses/occupancy", headers=auth_headers)
    datos = r.json()
    almacen = next(a for a in datos if a["almacen_nombre"] == "Almacen Parcial")

    assert almacen["ubicaciones_totales"] == 4
    assert almacen["ubicaciones_ocupadas"] == 1
    assert almacen["porcentaje_ocupacion"] == 25.0


def test_occupancy_ignora_stock_con_cantidad_cero(client, auth_headers):
    almacen_id = _crear_almacen_con_layout(client, auth_headers, "Almacen Cero", 1, 1)
    producto_id = _crear_producto(client, auth_headers, "Producto Cero")

    zonas = client.get("/zones/", headers=auth_headers).json()
    zona_id = next(z["id"] for z in zonas if z["almacen_id"] == almacen_id)
    ubicaciones = client.get("/locations/", headers=auth_headers).json()
    ubicacion = next(u for u in ubicaciones if u["zona_id"] == zona_id)

    client.post(
        "/stock/",
        json={
            "producto_id": producto_id,
            "ubicacion_id": ubicacion["id"],
            "cantidad": 0,
        },
        headers=auth_headers,
    )

    r = client.get("/warehouses/occupancy", headers=auth_headers)
    datos = r.json()
    almacen = next(a for a in datos if a["almacen_nombre"] == "Almacen Cero")

    assert almacen["ubicaciones_ocupadas"] == 0
    assert almacen["porcentaje_ocupacion"] == 0.0


def test_occupancy_sin_almacenes_devuelve_lista_vacia(client, auth_headers):
    r = client.get("/warehouses/occupancy", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []
