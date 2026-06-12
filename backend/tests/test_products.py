"""
Tests del módulo de productos.

Cubre autenticación por rol, listado y creación de productos.
Incluye casos felices y casos de error con datos inválidos.
"""


def test_get_products_sin_token_devuelve_401(client):
    """GET /products/ sin autenticación debe ser rechazado con 401."""
    response = client.get("/products/")
    assert response.status_code == 401


def test_get_products_con_token_devuelve_200(client, auth_headers, db_session):
    """GET /products/ con token válido debe devolver 200 y una lista."""
    response = client.get("/products/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_crear_producto_valido(client, auth_headers, categoria_test):
    """
    POST /products/ con datos correctos debe devolver 201 y el producto creado.
    Verifica que el SKU se autogenera cuando no se proporciona.
    """
    payload = {
        "nombre": "Tornillo M8",
        "categoria_id": categoria_test.id,
        "unidad_medida": "ud",
        "stock_minimo": 10,
    }
    response = client.post("/products/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Tornillo M8"
    assert data["unidad_medida"] == "ud"
    assert data["stock_minimo"] == 10
    assert data["categoria_id"] == categoria_test.id
    # SKU autogenerado — debe seguir el patrón PROD-XXXX
    assert data["sku"].startswith("PROD-")
    assert "id" in data


def test_crear_producto_sku_personalizado(client, auth_headers, categoria_test):
    """POST /products/ con SKU explícito debe usar ese SKU."""
    payload = {
        "nombre": "Tuerca M8",
        "sku": "TRC-001",
        "categoria_id": categoria_test.id,
        "unidad_medida": "ud",
    }
    response = client.post("/products/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["sku"] == "TRC-001"


def test_crear_producto_categoria_inexistente_devuelve_404(client, auth_headers):
    """POST /products/ con categoria_id que no existe debe devolver 404."""
    payload = {
        "nombre": "Producto Huérfano",
        "categoria_id": 99999,
        "unidad_medida": "kg",
    }
    response = client.post("/products/", json=payload, headers=auth_headers)
    assert response.status_code == 404


def test_crear_producto_sku_duplicado_devuelve_400(client, auth_headers, categoria_test):
    """POST /products/ con SKU ya existente debe devolver 400."""
    payload = {
        "nombre": "Producto Original",
        "sku": "SKU-DUPLICADO",
        "categoria_id": categoria_test.id,
        "unidad_medida": "ud",
    }
    # Primera creación — debe ir bien
    response = client.post("/products/", json=payload, headers=auth_headers)
    assert response.status_code == 201

    # Segunda creación con el mismo SKU — debe fallar
    payload["nombre"] = "Producto Copia"
    response = client.post("/products/", json=payload, headers=auth_headers)
    assert response.status_code == 400
