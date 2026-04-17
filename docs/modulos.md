# Módulos del sistema SGA

Este documento describe los módulos funcionales del sistema y su estado actual.

---

## Categorías

Permite organizar los productos en grupos.

Funcionalidades:
- Crear categorías
- Editar categorías
- Listar categorías

Estado:
- Backend: implementado
- Frontend: implementado

---

## Productos

Gestión de productos del almacén.

Funcionalidades:
- Crear productos
- Editar productos
- Listar productos
- Asociar categoría

Estado:
- Backend: implementado
- Frontend: implementado

---

## Almacenes

Representa almacenes físicos.

Funcionalidades:
- Crear almacenes
- Editar almacenes
- Listar almacenes

Estado:
- Backend: implementado
- Frontend: implementado

---

## Zonas

División interna de un almacén.

Funcionalidades:
- Crear zonas
- Asociar a almacén
- Listar zonas

Estado:
- Backend: implementado
- Frontend: implementado

---

## Ubicaciones

Ubicación exacta dentro del almacén.

Funcionalidades:
- Crear ubicaciones
- Asociar a zona
- Listar ubicaciones

Estado:
- Backend: implementado
- Frontend: implementado

---

## Stock

Control de existencias por producto y ubicación.

Funcionalidades:
- Consultar stock
- Validar disponibilidad
- Actualización controlada (desde otros módulos)

Estado:
- Backend: implementado
- Frontend: implementado

---

## Recepciones

Entrada de mercancía al almacén.

Funcionalidades:
- Crear recepción
- Añadir líneas de productos
- Confirmar recepción
- Aumentar stock

Estado:
- Backend: implementado
- Frontend: implementado

---

## Movimientos internos

Movimiento de stock entre ubicaciones.

Funcionalidades:
- Crear movimiento
- Validar stock en origen
- Actualizar stock origen/destino

Estado:
- Backend: implementado
- Frontend: implementado

---

## Salidas (expediciones)

Salida de mercancía del almacén.

Funcionalidades:
- Crear salida
- Validar stock
- Reducir stock

Estado:
- Backend: implementado
- Frontend: implementado

---

## Inventarios

Conteo físico y ajuste de stock.

Funcionalidades:
- Crear inventario
- Registrar cantidades reales
- Calcular diferencias
- Aplicar ajustes

Estado:
- Backend: implementado
- Frontend: implementado

---

## Auditoría

Registro de operaciones del sistema.

Funcionalidades:
- Registrar acciones críticas
- Consultar historial

Estado:
- Backend: implementado
- Frontend: parcial

---

## Dashboard

Vista general del sistema.

Funcionalidades:
- Resumen de actividad
- Información básica del almacén

Estado:
- Backend: implementado
- Frontend: implementado

---

## Seguridad

Sistema de autenticación y autorización.

Funcionalidades:
- Login
- Tokens JWT
- Control por roles

Roles:
- ADMIN
- SUPERVISOR
- OPERARIO

Estado:
- Backend: implementado
- Frontend: implementado

---

## Conclusión

El sistema cubre los módulos principales de un SGA:

- Gestión de datos maestros
- Control de stock
- Operativa completa de almacén
- Seguridad base

Algunos módulos pueden mejorarse a nivel de interfaz o validaciones, pero la base funcional está completa.