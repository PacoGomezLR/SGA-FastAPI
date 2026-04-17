# Instalación del proyecto SGA

Esta guía explica cómo levantar el proyecto en local paso a paso.

---

##  Requisitos previos

Asegúrate de tener instalado:

- Node.js (>= 18)
- Python (>= 3.10)
- PostgreSQL
- Git

---

##  Clonar el repositorio

    git clone <repo-url>
    cd proyecto-sga

---

##  Backend (FastAPI)

### 1. Ir al backend

    cd backend

---

### 2. Crear entorno virtual

    python -m venv venv

Activar:

    # Linux / Mac
    source venv/bin/activate

    # Windows
    venv\Scripts\activate

---

### 3. Instalar dependencias

    pip install -r requirements.txt

---

### 4. Configurar variables de entorno

Crear archivo `.env` dentro de `backend/`

Ejemplo:

    DATABASE_URL=postgresql://usuario:password@localhost:5432/sga
    SECRET_KEY=tu_clave_secreta
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    APP_ENV=development

---

### 5. Ejecutar migraciones (si aplica)

    alembic upgrade head

---

### 6. Arrancar backend

    uvicorn app.main:app --reload

Backend disponible en:
http://localhost:8000

Swagger:
http://localhost:8000/docs

---

##  Frontend (React + Vite)

Desde la raíz del proyecto:

    npm install
    npm run dev

Frontend disponible en:
http://localhost:5173

---

##  Comprobación básica

1. Abrir el frontend  
2. Intentar login  
3. Acceder a productos o stock  
4. Verificar que hay conexión con el backend  

---

##  Problemas comunes

- Error de conexión → revisar DATABASE_URL  
- CORS → revisar configuración en backend  
- Dependencias → reinstalar requirements  
- Puerto ocupado → cambiar puerto en uvicorn o vite  

---

##  Notas

- El backend es el núcleo del sistema  
- No modificar directamente la base de datos  
- Toda la lógica pasa por la API  