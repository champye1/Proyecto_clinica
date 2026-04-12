# Documentación del Módulo de Calendario Interactivo

Este documento describe la arquitectura, flujo y componentes del nuevo sistema de gestión de horarios interactivo implementado en el módulo de Pabellón.

## 1. Visión General
El módulo permite a los gestores de pabellón visualizar la ocupación mensual, diaria y por pabellón, facilitando la asignación de cirugías ("Gestionar Hora") y evitando conflictos de horario.

### Características Principales:
- **Vista Mensual Completa**: Calendario visual con indicadores de ocupación (Semáforo: Verde, Amarillo, Rojo).
- **Detalles del Día**: Modal interactivo que muestra cirugías programadas y slots disponibles por pabellón.
- **Validación en Tiempo Real**: Prevención de doble reserva (solapamiento) tanto en la selección de slots como en la confirmación.
- **Actualización Dinámica**: Polling automático cada 10 segundos para reflejar cambios en la base de datos.
- **Diseño Responsive**: Adaptable a dispositivos móviles y de escritorio.

## 2. Estructura de Base de Datos

El módulo interactúa principalmente con las siguientes tablas:

### `surgeries` (Cirugías)
- **id**: UUID
- **fecha**: DATE (Fecha de la cirugía)
- **hora_inicio**: TIME
- **hora_fin**: TIME
- **operating_room_id**: FK -> `operating_rooms`
- **surgery_request_id**: FK -> `surgery_requests`
- **estado**: enum ('programada', 'realizada', 'cancelada')
- **doctor_id**: FK -> `doctors`
- **patient_id**: FK -> `patients`

### `operating_rooms` (Pabellones)
- **id**: UUID
- **nombre**: VARCHAR (Ej: "Pabellón 1", "Pabellón Central")
- **activo**: BOOLEAN

### `schedule_blocks` (Bloqueos)
- **fecha**: DATE
- **hora_inicio**: TIME
- **hora_fin**: TIME
- **operating_room_id**: FK

## 3. Componentes Frontend (React)

El archivo principal es `src/pages/pabellon/Calendario.jsx`.

### Componentes Internos:

1.  **`FullMonthView`**:
    *   Renderiza la grilla del mes.
    *   Calcula el porcentaje de ocupación diario (`getOcupacionGlobal`).
    *   Muestra indicadores visuales (barra de progreso, etiquetas "Full").

2.  **`DayDetailsModal`**:
    *   **Sección 1 (Ocupados)**: Lista cronológica de cirugías del día con detalles (Doctor, Paciente, Procedimiento).
    *   **Sección 2 (Disponibles)**: 
        *   Muestra lista de pabellones con su **capacidad (camillas)**.
        *   Genera slots de tiempo cada 30 minutos (08:00 - 20:00).
        *   **Cálculo de Duración Máxima**: Para cada slot libre, calcula y muestra el tiempo disponible hasta la siguiente cirugía o el fin del día (ej: "max 2h 30m"), ayudando al usuario a elegir un bloque adecuado.
        *   Filtra slots que coinciden con el inicio de una cirugía existente.

3.  **Modal de Confirmación**:
    *   Permite ajustar la `hora_fin`.
    *   **Validación Crítica**: `isOverlap`. Comprueba si el intervalo `[hora_inicio, hora_fin]` se solapa con alguna cirugía existente en el mismo pabellón y fecha.

## 4. Flujo de Programación (Diagrama Textual)

1.  **Inicio**: Usuario hace clic en "GESTIONAR HORA" en `Solicitudes.jsx`.
2.  **Calendario**: Se abre `Calendario.jsx` en vista mensual.
3.  **Selección de Día**: Usuario hace clic en un día del mes.
4.  **Detalles**: Se abre `DayDetailsModal`.
    *   Usuario revisa "Horarios Ocupados".
    *   Usuario selecciona un slot disponible en "Disponibilidad" (verde).
5.  **Confirmación**:
    *   Sistema pre-selecciona el slot y calcula `hora_fin` (+1 hora por defecto).
    *   Se abre Modal de Confirmación.
    *   Usuario ajusta `hora_fin` si es necesario.
6.  **Validación**:
    *   Si hay solapamiento -> Muestra alerta roja y deshabilita botón "Confirmar".
    *   Si no hay solapamiento -> Botón habilitado.
7.  **Guardado**:
    *   Al confirmar, se llama a `programarCirugia` (RPC `programar_cirugia_completa`).
    *   Se actualizan las tablas y se notifica.

## 5. Estrategia de Actualización en Tiempo Real

Se utiliza **React Query** con `refetchInterval` configurado a 10000ms (10 segundos) en las siguientes consultas:
- `calendario-anual-cirugias`: Para la vista mensual.
- `cirugias-dia-detalle`: Para el modal de detalles del día.
- `calendario-anual-bloqueos`: Para visualizar bloqueos administrativos.

Esto asegura que si otro usuario agenda una cirugía, el calendario se actualice automáticamente sin recargar la página, reduciendo el riesgo de conflictos.

## 6. Lógica de Prevención de Doble Reserva

### Nivel 1: Filtrado de Slots (Visual)
En `DayDetailsModal`, se ocultan o marcan como no disponibles los slots de inicio que caen dentro de una cirugía existente.

### Nivel 2: Validación Cliente (Pre-envío)
En el Modal de Confirmación, se ejecuta la validación `isOverlap`:
```javascript
return cirugias.some(c => {
   // ... filtros de fecha y pabellón ...
   return selectedSlot.time < c.hora_fin && horaFin > c.hora_inicio
})
```
Esta validación cubre casos donde el slot de inicio está libre, pero la duración extendida causa un conflicto con una cirugía posterior.

### Nivel 3: Validación Base de Datos (Transaccional)
La función RPC `programar_cirugia_completa` realiza una validación final a nivel de base de datos con bloqueo de filas para garantizar integridad ACID.
