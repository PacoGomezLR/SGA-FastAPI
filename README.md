# SGA — Sistema de Gestión de Almacén

Sistema web para la gestión integral de un almacén: control de stock, ubicaciones, movimientos, salidas, recepciones e inventarios.

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

## Arrancar el proyecto

### Backend (FastAPI)

```bash
cd backend
source venv/Scripts/activate
uvicorn app.main:app --reload
```

API disponible en `http://127.0.0.1:8000`

### Frontend (React + Vite)

```bash
cd ~/Desktop/proyecto-sga
npm run dev
```

App disponible en `http://localhost:5173`

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