"""
Tests unitarios de MovementService._validate_movement_rules().

Se testea la lógica de negocio directamente, sin HTTP ni base de datos.
Esto demuestra que la lógica de validación está correctamente encapsulada
en el servicio y es testeable de forma independiente.
"""

import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock

from app.schemas.movement import MovementCreate
from app.services.movement_service import MovementService


def make_service():
    """Crea un MovementService con una sesión de BD simulada (no se usa en estos tests)."""
    mock_db = MagicMock()
    return MovementService(db=mock_db)


def make_movement_data(**kwargs):
    """
    Construye un MovementCreate con valores base válidos.
    Los kwargs sobreescriben los valores por defecto para cada caso de prueba.
    """
    defaults = {
        "producto_id": 1,
        "ubicacion_origen_id": None,
        "ubicacion_destino_id": None,
        "cantidad": 5,
        "tipo_movimiento": "traslado",
        "origen_tipo": "manual",
        "origen_id": 1,
    }
    defaults.update(kwargs)
    return MovementCreate(**defaults)


# ---------------------------------------------------------------------------
# Traslados
# ---------------------------------------------------------------------------

def test_traslado_sin_origen_lanza_400():
    """Un traslado sin ubicación de origen debe fallar con 400."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="traslado",
        ubicacion_origen_id=None,
        ubicacion_destino_id=2,
    )
    with pytest.raises(HTTPException) as exc_info:
        service._validate_movement_rules(data, "traslado")
    assert exc_info.value.status_code == 400


def test_traslado_sin_destino_lanza_400():
    """Un traslado sin ubicación de destino debe fallar con 400."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="traslado",
        ubicacion_origen_id=1,
        ubicacion_destino_id=None,
    )
    with pytest.raises(HTTPException) as exc_info:
        service._validate_movement_rules(data, "traslado")
    assert exc_info.value.status_code == 400


def test_traslado_origen_igual_destino_lanza_400():
    """Un traslado con origen == destino debe fallar con 400."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="traslado",
        ubicacion_origen_id=5,
        ubicacion_destino_id=5,
    )
    with pytest.raises(HTTPException) as exc_info:
        service._validate_movement_rules(data, "traslado")
    assert exc_info.value.status_code == 400


def test_traslado_valido_no_lanza_excepcion():
    """Un traslado con origen y destino distintos no debe lanzar excepción."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="traslado",
        ubicacion_origen_id=1,
        ubicacion_destino_id=2,
    )
    # No debe lanzar ninguna excepción
    service._validate_movement_rules(data, "traslado")


# ---------------------------------------------------------------------------
# Entradas
# ---------------------------------------------------------------------------

def test_entrada_sin_destino_lanza_400():
    """Una entrada sin ubicación de destino debe fallar con 400."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="entrada",
        ubicacion_origen_id=None,
        ubicacion_destino_id=None,
    )
    with pytest.raises(HTTPException) as exc_info:
        service._validate_movement_rules(data, "entrada")
    assert exc_info.value.status_code == 400


def test_entrada_valida_no_lanza_excepcion():
    """Una entrada con destino no debe lanzar excepción."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="entrada",
        ubicacion_origen_id=None,
        ubicacion_destino_id=3,
    )
    service._validate_movement_rules(data, "entrada")


# ---------------------------------------------------------------------------
# Salidas
# ---------------------------------------------------------------------------

def test_salida_sin_origen_lanza_400():
    """Una salida sin ubicación de origen debe fallar con 400."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="salida",
        ubicacion_origen_id=None,
        ubicacion_destino_id=None,
    )
    with pytest.raises(HTTPException) as exc_info:
        service._validate_movement_rules(data, "salida")
    assert exc_info.value.status_code == 400


def test_salida_valida_no_lanza_excepcion():
    """Una salida con origen no debe lanzar excepción."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="salida",
        ubicacion_origen_id=2,
        ubicacion_destino_id=None,
    )
    service._validate_movement_rules(data, "salida")


# ---------------------------------------------------------------------------
# Ajustes
# ---------------------------------------------------------------------------

def test_ajuste_sin_ninguna_ubicacion_lanza_400():
    """Un ajuste sin ninguna ubicación debe fallar con 400."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="ajuste",
        ubicacion_origen_id=None,
        ubicacion_destino_id=None,
    )
    with pytest.raises(HTTPException) as exc_info:
        service._validate_movement_rules(data, "ajuste")
    assert exc_info.value.status_code == 400


def test_ajuste_con_dos_ubicaciones_lanza_400():
    """Un ajuste con origen Y destino simultáneos debe fallar con 400."""
    service = make_service()
    data = make_movement_data(
        tipo_movimiento="ajuste",
        ubicacion_origen_id=1,
        ubicacion_destino_id=2,
    )
    with pytest.raises(HTTPException) as exc_info:
        service._validate_movement_rules(data, "ajuste")
    assert exc_info.value.status_code == 400
