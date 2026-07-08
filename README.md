# SGA — Sistema de Gestión de Almacén

Aplicación web full-stack para la gestión integral de un almacén: control de stock por ubicación, recepciones, movimientos internos, salidas e inventarios con ajuste automático.

---

## El problema que resuelve

Un almacén sin sistema pierde trazabilidad: no sabe qué hay, dónde está ni quién lo movió. SGA centraliza toda la operativa en una API REST con lógica de negocio en el backend, garantizando que el stock nunca sea negativo y que toda operación quede auditada.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + React Router |
| Backend | FastAPI (Python 3.13) |
| Base de datos | PostgreSQL 15+ |
| ORM | SQLAlchemy 2.0 (Mapped / DeclarativeBase) |
| Migraciones | Alembic |
| Autenticación | JWT con python-jose + bcrypt |
| Validación | Pydantic v2 + pydantic-settings |
| Comunicación | REST API (JSON) |

---

## Funcionalidades principales

- **Autenticación por roles** — administrador, supervisor, operario con acceso diferenciado por endpoint
- **Catálogo** — productos con SKU, categoría, unidad de medida y stock mínimo
- **Almacenes, zonas y ubicaciones** — jerarquía de tres niveles con control de capacidad
- **Control de stock** — por producto + ubicación, con alerta de bajo stock
- **Recepciones** — flujo borrador → confirmar, genera movimientos de entrada automáticamente
- **Movimientos internos** — traslados entre ubicaciones con trazabilidad completa
- **Salidas** — expediciones con descuento de stock en ubicación de origen
- **Inventarios** — conteo físico con ajuste automático de diferencias
- **Auditoría** — log de todas las operaciones con usuario, módulo y detalle

---

## Arquitectura

El backend aplica una arquitectura en capas estricta. Ninguna capa salta a la siguiente:

```
Request → Route → Schema (validación) → Service (lógica) → Repository (datos) → Model (BD)
```

```
backend/app/
├── routes/        # Endpoints HTTP, control de acceso por rol
├── schemas/       # Pydantic: validación de entrada y salida
├── services/      # Lógica de negocio
├── repositories/  # Acceso a base de datos (SQLAlchemy)
├── models/        # Modelos ORM
├── security/      # JWT, bcrypt, dependencias de autenticación
├── core/          # Configuración (pydantic-settings + .env)
└── db/            # Engine y sesión SQLAlchemy

src/
├── pages/         # Una página por módulo (15 páginas)
├── context/       # AuthContext, ConfirmContext
├── api/           # apiFetch — cliente HTTP con Bearer token
├── components/    # CrudPage reutilizable, ConfirmModal
└── routes/        # PrivateRoute con redirección a login
```

**Principios de diseño:**
- Stock controlado siempre por `producto_id + ubicacion_id`
- Stock nunca negativo — constraint `CHECK` en base de datos
- Toda operación crítica es transaccional
- La lógica de negocio vive exclusivamente en el backend
- El frontend solo consume la API

---

## Capturas de pantalla

### Dashboard — KPIs y alertas de stock

![Dashboard](docs/images/dashboard.png)

### Gestión de productos

![Productos](docs/images/productos.png)

### Recepción de mercancía

![Recepciones](docs/images/recepciones.png)

### Movimientos internos

![Movimientos](docs/images/movimientos.png)

### Auditoría de operaciones

![Auditoría](docs/images/auditoria.png)

### Documentación API — Swagger UI

![Swagger API](docs/images/swagger-api.png)

### Autenticación en la API

![Swagger Auth](docs/images/swagger-auth.png)

---

## Instalación

### Requisitos previos

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ en ejecución
- Base de datos creada: `CREATE DATABASE sga_db;`

### Backend

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores reales

# Ejecutar migraciones
python -m alembic upgrade head

# Arrancar el servidor
uvicorn app.main:app --reload
```

API disponible en `http://127.0.0.1:8000`
Documentación interactiva en `http://127.0.0.1:8000/docs`

### Tests

```bash
# Desde backend/, con el entorno virtual activo y SECRET_KEY definida
cd backend
python -m pytest tests/ -v
```

### Frontend

```bash
# Desde la raíz del proyecto
npm install
npm run dev
```

App disponible en `http://localhost:5173`

---

## Variables de entorno

Crear `backend/.env` a partir de `backend/.env.example`:

```env
# Base de datos
DATABASE_URL=postgresql+psycopg://usuario:contraseña@localhost:5432/sga_db

# Entorno
APP_ENV=development

# JWT — generar con: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=cambia_esto_por_una_clave_segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## Endpoints principales

| Método | Ruta | Descripción | Rol mínimo |
|--------|------|-------------|-----------|
| POST | `/auth/login` | Login, devuelve JWT | Público |
| GET | `/auth/me` | Usuario autenticado | Operario |
| GET/POST | `/products/` | Listado y creación de productos | Operario / Supervisor |
| GET/POST | `/warehouses/` | Almacenes | Operario / Administrador |
| GET | `/stock/` | Stock por ubicación | Operario |
| POST | `/receptions/` | Crear recepción | Supervisor |
| POST | `/receptions/{id}/confirm` | Confirmar recepción | Supervisor |
| GET/POST | `/movements/` | Movimientos internos | Operario / Supervisor |
| POST | `/shipments/` | Registrar salida | Supervisor |
| POST | `/inventories/{id}/apply` | Aplicar ajuste de inventario | Administrador |
| GET | `/audit/` | Log de auditoría | Administrador |

Documentación completa disponible en `/docs` (Swagger UI) con el servidor en marcha.

---

## Estado actual

- [x] Autenticación JWT con roles
- [x] CRUD completo de catálogo (productos, categorías, almacenes, zonas, ubicaciones)
- [x] Control de stock con alerta de bajo stock
- [x] Flujo completo de recepciones
- [x] Movimientos internos entre ubicaciones
- [x] Salidas con descuento de stock
- [x] Inventarios con ajuste automático
- [x] Auditoría de operaciones
- [x] Dashboard con KPIs en tiempo real
- [x] 3 migraciones Alembic progresivas
- [x] 30 tests automatizados con pytest (auth, categorías, productos, movimientos, health)
- [x] Despliegue en producción (Vercel + Render + Neon)
- [ ] Dockerización

---

## Próximas mejoras

1. **Docker** — `docker-compose.yml` con backend + PostgreSQL
2. **Refresh token** — renovación automática de sesión en el frontend
3. **Paginación** — en listados de movimientos, auditoría y stock
4. **Ampliar cobertura de tests** — recepciones, inventarios y stock

---

## Nota

Proyecto desarrollado como portfolio junior para demostrar arquitectura backend en capas, diseño de API REST, autenticación JWT con control de acceso por roles, modelado relacional con PostgreSQL y frontend React con estado global.

No está orientado a producción. El objetivo es mostrar criterio técnico en la toma de decisiones de arquitectura y separación de responsabilidades.
