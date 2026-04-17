# Resumen de API — SGA

Este documento resume los endpoints principales del backend.

La documentación completa está disponible en Swagger:
http://localhost:8000/docs

---

## Auth

- POST /auth/login → Login de usuario
- GET /auth/me → Usuario actual

---

## Categorías

- GET /categories → Listar
- POST /categories → Crear
- PUT /categories/{id} → Actualizar
- DELETE /categories/{id} → Eliminar

---

## Productos

- GET /products → Listar
- POST /products → Crear
- PUT /products/{id} → Actualizar
- DELETE /products/{id} → Eliminar

---

## Almacenes

- GET /warehouses → Listar
- POST /warehouses → Crear
- PUT /warehouses/{id} → Actualizar
- DELETE /warehouses/{id} → Eliminar

---

## Zonas

- GET /zones → Listar
- POST /zones → Crear
- PUT /zones/{id} → Actualizar
- DELETE /zones/{id} → Eliminar

---

## Ubicaciones

- GET /locations → Listar
- POST /locations → Crear
- PUT /locations/{id} → Actualizar
- DELETE /locations/{id} → Eliminar

---

## Stock

- GET /stock → Consultar stock
- GET /stock/product/{id} → Stock por producto
- GET /stock/location/{id} → Stock por ubicación

---

## Recepciones

- GET /receptions → Listar
- POST /receptions → Crear
- POST /receptions/{id}/confirm → Confirmar recepción

---

## Movimientos

- GET /movements → Listar
- POST /movements → Crear movimiento

---

## Salidas

- GET /shipments → Listar
- POST /shipments → Crear salida

---

## Inventarios

- GET /inventories → Listar
- POST /inventories → Crear inventario
- POST /inventories/{id}/apply → Aplicar ajuste

---

## Auditoría

- GET /audit → Consultar registros

---

## Sistema

- GET /health → Estado del sistema
- GET /test-db → Test de conexión a base de datos

---

## Notas

- Todos los endpoints (excepto login) requieren autenticación
- El backend valida todas las operaciones críticas
- Swagger es la fuente oficial para pruebas detalladas