"""
Tests de humo — verifican que la API arranca y responde correctamente.
No requieren autenticación ni base de datos.
"""


def test_root_responde_200(client):
    """GET / debe devolver 200 siempre, sin autenticación."""
    response = client.get("/")
    assert response.status_code == 200


def test_root_estructura_respuesta(client):
    """GET / debe devolver JSON con clave 'message'."""
    response = client.get("/")
    data = response.json()
    assert "message" in data
    assert isinstance(data["message"], str)
    assert len(data["message"]) > 0
