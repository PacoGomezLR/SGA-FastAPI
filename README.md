# SGA — Sistema de Gestión de Almacén


Sistema web para la gestión integral de un almacén: control de stock, ubicaciones, movimientos, salidas, recepciones e inventarios.

---

## Capturas de pantalla

### Dashboard

![Dashboard](docs/images/dashboard.png)

### Gestión de productos

![Productos](docs/images/productos.png)

### Recepción de mercancía

![Recepciones](docs/images/recepciones.png)

### Movimientos internos

![Movimientos](docs/images/movimientos.png)

### Auditoría

![Auditoría](docs/images/auditoria.png)

### Documentación API (Swagger)

![Swagger API](docs/images/swagger-api.png)

### Autenticación API

![Swagger Auth](docs/images/swagger-auth.png)
---

## Tecnologías

### Frontend
- React
- Vite
- JavaScript

### Backend
- FastAPI
- Python

### Base de datos
- PostgreSQL

### Comunicación
- API REST (JSON)

---

## Funcionalidades principales

El sistema permite:

- Gestión de productos y categorías
- Gestión de almacenes, zonas y ubicaciones
- Control de stock por producto y ubicación
- Registro de recepciones
- Movimientos internos entre ubicaciones
- Registro de salidas (expediciones)
- Inventarios y ajustes de stock
- Auditoría básica de operaciones
- Sistema de autenticación con roles

---

## Flujo del sistema

Recepción → Ubicación → Stock → Movimiento → Salida → Inventario

Este flujo representa el ciclo completo de la mercancía dentro del almacén :contentReference[oaicite:0]{index=0}

---

## Principios del sistema

- El stock se controla por **producto + ubicación**
- El stock **nunca puede ser negativo**
- Toda operación queda registrada
- La lógica del negocio vive en el backend
- El frontend solo consume la API
- Las operaciones críticas son transaccionales

Estos principios vienen definidos en el diseño del núcleo de stock :contentReference[oaicite:1]{index=1}

---

## Estructura del proyecto

```bash
proyecto-sga/

├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── security/
│   │   ├── audit/
│   │   └── utils/
│   ├── alembic/
│   ├── requirements.txt
│   └── .env
│
├── src/
│   ├── api/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   └── context/
│
└── docs/   (pendiente de completar en paso 19)
