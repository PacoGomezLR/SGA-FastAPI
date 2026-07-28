# Decisiones técnicas, limitaciones y mejoras futuras — SGA

Este documento recoge decisiones importantes del proyecto, limitaciones actuales y posibles mejoras.

---

## Decisiones técnicas

### 1. Control de stock

El stock se gestiona por:

producto + ubicación

Motivos:
- permite trazabilidad real
- evita ambigüedades
- facilita movimientos internos
- base sólida para inventarios

---

### 2. Lógica centralizada en backend

Toda la lógica crítica está en el backend.

El frontend:
- no modifica directamente datos críticos
- solo consume la API

Motivo:
- evitar inconsistencias
- asegurar validaciones

---

### 3. Arquitectura por capas

Separación clara en:

- routes
- services
- repositories
- models
- schemas

Motivo:
- escalabilidad
- mantenibilidad
- claridad del código

---

### 4. Uso de PostgreSQL

Motivos:
- base de datos robusta
- soporte para relaciones complejas
- adecuada para sistemas transaccionales

---

### 5. Autenticación con JWT

Motivos:
- sistema stateless
- fácil integración frontend-backend
- estándar en APIs modernas

---

### 6. Hosting gratuito en producción (Render + Vercel + Neon)

El backend está desplegado en el plan gratuito de Render, el frontend en Vercel y la base de datos en Neon.

Consecuencia asumida:
- Render "duerme" el backend tras ~15 minutos sin tráfico
- la primera petición tras ese período tarda entre 20 y 50 segundos en responder mientras el servicio se reactiva (cold start)
- una vez despierto, responde con normalidad hasta la siguiente ventana de inactividad

Motivo:
- proyecto de portfolio sin necesidad de disponibilidad constante
- prioriza coste cero sobre tiempo de respuesta en la primera carga

Alternativas evaluadas y descartadas por ahora:
- ping periódico externo (cron) para mantener el servicio despierto — evita el cold start pero es un parche, no una solución real
- plan de pago de Render (~$7/mes) — elimina el problema pero no es necesario para el objetivo actual del proyecto

---

## Limitaciones actuales

### 1. Seguridad y escalabilidad de cara a producción comercial

Estas son decisiones válidas para un proyecto de portfolio, pero que un
despliegue comercial real debería reconsiderar:

**Token JWT en `localStorage`** (`src/context/AuthContext.jsx`,
`src/api/api.js`). El token de acceso se guarda en `localStorage` y se envía
manualmente en la cabecera `Authorization`. Es vulnerable a robo vía XSS
(cualquier script que se ejecute en la página puede leerlo). La alternativa
correcta para producción es una cookie `HttpOnly` + `Secure` +
`SameSite=Strict`, que el JavaScript de la página no puede leer ni exfiltrar.

**Sin refresh tokens.** El token expira a los 60 minutos
(`access_token_expire_minutes` en `app/core/config.py`) y no hay forma de
renovarlo sin volver a hacer login — no existe ningún endpoint ni lógica de
refresh token en el backend. Aceptable para una demo; en producción se
esperaría un refresh token de vida más larga (en cookie `HttpOnly`) que
renueve el access token de forma transparente para el usuario.

**Sin rate limiting.** Ningún endpoint (incluido `/auth/login`) limita el
número de peticiones por IP/usuario. Esto deja la API expuesta a fuerza
bruta sobre credenciales y a abuso general de la API sin coste para quien
la ataca.

**Sin paginación.** Los listados (`/products/`, `/stock/`, `/movements/`,
etc.) devuelven siempre el conjunto completo de filas. Funciona con el
volumen de datos actual, pero no escala: con miles de movimientos o
productos, cada petición a esos endpoints crecería sin límite en tamaño de
respuesta y tiempo de consulta.

---

### 2. Validaciones mejorables

Algunas validaciones pueden ampliarse:

- control más estricto de errores
- validaciones cruzadas
- control de estados más robusto

---

### 3. Frontend mejorable

Aunque funcional:

- puede mejorar UX
- falta consistencia en algunos módulos
- navegación mejorable

---

### 4. Sin optimización avanzada

No se han implementado:

- caché
- optimización de queries

(la paginación se detalla en el punto 1, junto al resto de limitaciones de
cara a producción comercial)

---

## Mejoras futuras

### Prioridad alta

- Migrar el JWT de `localStorage` a cookie `HttpOnly` + `Secure` + `SameSite=Strict`
- Implementar refresh tokens
- Añadir rate limiting (mínimo en `/auth/login`)
- Añadir paginación a los listados (`/products/`, `/stock/`, `/movements/`, etc.)
- Añadir validaciones más estrictas
- Mejorar control de errores

---

### Prioridad media

- Mejorar dashboard
- Ampliar exportaciones a otros módulos (movimientos, ocupación de secciones)

---

### Evolución funcional

- Gestión de incidencias
- Devoluciones
- Permisos más finos por módulo

---

## Conclusión

El sistema tiene una base sólida:

- núcleo de stock correcto
- arquitectura clara
- módulos principales implementados
- cobertura de tests automatizados (backend)

Las mejoras futuras no requieren rehacer el sistema,
sino evolucionarlo sobre la base existente.