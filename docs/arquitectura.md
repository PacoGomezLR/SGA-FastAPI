# Arquitectura del sistema SGA

Este documento describe cómo está estructurado el sistema y cómo se organizan sus componentes.

---

## Visión general

El sistema SGA está dividido en tres partes principales:

- Frontend (React)
- Backend (FastAPI)
- Base de datos (PostgreSQL)

El frontend consume la API del backend, y el backend gestiona toda la lógica y acceso a la base de datos.

---

## Flujo general

Frontend → API (FastAPI) → Servicios → Base de datos

---

## Backend

El backend sigue una arquitectura por capas para separar responsabilidades.

### Estructura principal

backend/app/

- main.py
- core/
- db/
- models/
- schemas/
- routes/
- services/
- repositories/
- security/
- audit/
- utils/

---

### Capas del backend

**Routes**
- Definen endpoints (API)
- Reciben requests y devuelven respuestas

**Schemas**
- Validación de datos (Pydantic)
- Entrada y salida de la API

**Services**
- Lógica de negocio
- Reglas del sistema

**Repositories**
- Acceso a base de datos
- Queries y persistencia

**Models**
- Representación de tablas (SQLAlchemy)

**Security**
- Autenticación
- Tokens JWT
- Control de acceso

**Audit**
- Registro de operaciones del sistema

---

## Núcleo de stock

El sistema se basa en una regla clave:

El stock se controla por producto + ubicación

Esto permite:
- saber exactamente dónde está cada producto
- mover mercancía entre ubicaciones
- evitar incoherencias

Reglas importantes:

- No puede existir stock negativo
- Solo se modifica mediante servicios
- No se edita directamente en base de datos

---

## Frontend

El frontend está construido con React + Vite.

### Estructura

src/

- api/
- components/
- layouts/
- pages/
- routes/
- context/

---

### Responsabilidad del frontend

- Mostrar datos
- Consumir la API
- Gestionar navegación
- No contiene lógica crítica de negocio

---

## Base de datos

La base de datos utiliza PostgreSQL.

Características:

- Tablas en español
- Relaciones bien definidas
- Integridad referencial
- Uso de migraciones con Alembic

---

## Seguridad

El sistema implementa:

- Autenticación con JWT
- Hash de contraseñas
- Roles de usuario:
  - ADMIN
  - SUPERVISOR
  - OPERARIO

El backend controla el acceso a cada endpoint.

---

## Situación actual

- Existe duplicidad entre app/ y backend/app/
- La versión válida es la de backend/
- Se recomienda limpiar la duplicidad en el futuro

---

## Conclusión

El sistema está diseñado para:

- ser modular
- mantener separación de responsabilidades
- evitar errores en el stock
- permitir evolución futura sin romper la base