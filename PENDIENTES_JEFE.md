# Pendientes indicados por el jefe (Tío Dunke)

## 1. Tema de reagendar (no “reserva”)

**Aclaración:** En el mensaje se dijo “reserva”; el jefe se refería a **reagendar** (cambiar fecha/hora de una cirugía ya programada), no a reserva.

**Estado:** Backend listo; puede faltar UI explícita para reagendar.

En el sistema:
- **Base de datos:** Ya existe soporte para reagendamiento:
  - Tabla `surgery_schedule_history` (historial de reagendamientos).
  - Trigger que al actualizar `fecha` / `hora_inicio` / `hora_fin` de una cirugía en estado "programada" registra el cambio y marca `estado_hora = 'reagendado'`.
  - Validaciones: solo se puede reagendar si `estado = 'programada'`, no a fecha pasada, con tiempo de limpieza y sin solapamientos.
- **UI:** No hay un flujo claro “Reagendar cirugía” (p. ej. desde Calendario o Solicitudes de pabellón: editar fecha/hora de una cirugía ya programada y guardar).

**Acción (si aplica):** Añadir en la app (p. ej. en Calendario o vista de cirugías de pabellón) la opción de **Reagendar** (editar fecha/hora de una cirugía programada) que haga UPDATE a la cirugía; el trigger y el historial ya funcionan.

---

## 2. Grupos de insumos (Grupo Fonasa)

**Estado:** Implementado en esta iteración.

El jefe indicó:
- En códigos tipo Fonasa (ej. **1801155** para una hernia), los **dos primeros dígitos (18)** son el **grupo Fonasa** de la cirugía.
- Los insumos deben tener un **grupo que acote el rango** que puede elegir el médico: por ejemplo, una malla para hernias no debe aparecer en una cirugía de cerebro.

**Implementado:**
- Campo **Grupos Fonasa** en insumos: cada insumo puede asociarse a uno o más grupos Fonasa (ej. 18 = hernias/cirugía general). Así las mallas se configuran con grupo 18 y no salen en cirugías de neuro (80).
- En **Crear solicitud** y **Editar solicitud** (médico), al elegir el código de operación solo se muestran insumos cuyo grupo Fonasa incluye el grupo de esa cirugía.
- En **Gestión de Insumos** (pabellón) se puede ver/editar el grupo Fonasa de cada insumo y filtrar por grupo.

**Uso:** En códigos de operación se definió un `grupoFonasa` por especialidad (18 general, 80 neuro, etc.). Si en el futuro usan códigos Fonasa completos (7 dígitos), el grupo se puede seguir tomando de los 2 primeros dígitos.

---

## 3. Grupos = Proveedor (quien proveyó el item)

**Estado:** Implementado.

El jefe aclaró que al referirse al "grupo" de los insumos se refiere a **quien proveyó el item** (el proveedor).

**Implementado:**
- Campo **Proveedor** en insumos (base de datos: columna `proveedor`).
- En **Gestión de Insumos** (pabellón): campo "Proveedor (opcional)" al crear/editar insumo y columna **Proveedor** en la tabla.
- Migración: `database/migrations/add_proveedor_insumos.sql`.

---

## 4. Visibilidad de los grupos en insumos

**Estado:** Cubierto.

En la pantalla de **Gestión de Insumos** (pabellón) se muestra: **Grupo de Prestación**, **Proveedor** (quien proveyó el item) y **Grupos Fonasa** (para filtrar por tipo de cirugía).
