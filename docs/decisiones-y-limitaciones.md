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

### 1. Duplicidad de backend

Existe duplicación entre:

- app/
- backend/app/

Problema:
- puede generar confusión
- riesgo de modificar código incorrecto

---

### 2. Falta de tests automatizados

Actualmente no hay:

- tests unitarios
- tests de integración

Impacto:
- menor confianza en cambios futuros

---

### 3. Validaciones mejorables

Algunas validaciones pueden ampliarse:

- control más estricto de errores
- validaciones cruzadas
- control de estados más robusto

---

### 4. Frontend mejorable

Aunque funcional:

- puede mejorar UX
- falta consistencia en algunos módulos
- navegación mejorable

---

### 5. Sin optimización avanzada

No se han implementado:

- caché
- paginación avanzada
- optimización de queries

---

## Mejoras futuras

### Prioridad alta

- Eliminar duplicidad de backend
- Añadir validaciones más estrictas
- Mejorar control de errores

---

### Prioridad media

- Implementar tests
- Mejorar dashboard
- Añadir exportaciones (CSV)

---

### Evolución funcional

- Gestión de incidencias
- Devoluciones
- Alertas de stock bajo
- Permisos más finos por módulo

---

## Conclusión

El sistema tiene una base sólida:

- núcleo de stock correcto
- arquitectura clara
- módulos principales implementados

Las mejoras futuras no requieren rehacer el sistema,
sino evolucionarlo sobre la base existente.