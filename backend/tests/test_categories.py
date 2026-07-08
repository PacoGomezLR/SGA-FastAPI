def test_get_categoria_inexistente_devuelve_404(client, auth_headers):
    r = client.get("/categories/9999", headers=auth_headers)
    assert r.status_code == 404


def test_crear_categoria_valida(client, auth_headers):
    r = client.post(
        "/categories/",
        json={"nombre": "Electronica", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    assert r.status_code == 201


def test_crear_categoria_duplicada_devuelve_400(client, auth_headers):
    client.post(
        "/categories/",
        json={"nombre": "Electronica", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    r = client.post(
        "/categories/",
        json={"nombre": "Electronica", "descripcion": "y", "activo": True},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_put_categoria_inexistente_devuelve_404(client, auth_headers):
    r = client.put("/categories/9999", json={"nombre": "Nueva"}, headers=auth_headers)
    assert r.status_code == 404


def test_put_nombre_duplicado_devuelve_400(client, auth_headers):
    client.post(
        "/categories/",
        json={"nombre": "Electronica", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    r2 = client.post(
        "/categories/",
        json={"nombre": "Ropa", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    cat2_id = r2.json()["id"]

    r = client.put(
        f"/categories/{cat2_id}", json={"nombre": "Electronica"}, headers=auth_headers
    )
    assert r.status_code == 400


def test_delete_categoria_inexistente_devuelve_404(client, auth_headers):
    r = client.delete("/categories/9999", headers=auth_headers)
    assert r.status_code == 404


def test_delete_categoria_existente_devuelve_204(client, auth_headers):
    r = client.post(
        "/categories/",
        json={"nombre": "Electronica", "descripcion": "x", "activo": True},
        headers=auth_headers,
    )
    cat_id = r.json()["id"]

    r = client.delete(f"/categories/{cat_id}", headers=auth_headers)
    assert r.status_code == 204
