# Resumen de reglas (RLS) en la base de datos

Este documento lista todas las tablas con **Row Level Security (RLS)** habilitado y las **políticas** que aplican por rol (Pabellón, Doctor, usuario autenticado).

---

## Funciones auxiliares usadas por las políticas

| Función | Descripción |
|--------|-------------|
| `is_pabellon()` | Verifica si el usuario actual tiene rol `pabellon` en `public.users`. |
| `is_doctor()` | Verifica si el usuario actual tiene rol `doctor` en `public.users`. |
| `current_doctor_id()` | Devuelve el `id` del doctor en `public.doctors` asociado al usuario actual. |
| `require_auth()` | Verifica que exista un usuario autenticado (`auth.uid() IS NOT NULL`). |

---

## Tablas con RLS habilitado

- `public.users`
- `public.doctors`
- `public.operating_rooms`
- `public.patients`
- `public.supplies`
- `public.surgery_requests`
- `public.surgery_request_supplies`
- `public.surgeries`
- `public.surgery_supplies`
- `public.schedule_blocks`
- `public.reminders`
- `public.notifications`
- `public.audit_logs`
- `public.operation_supply_packs` (migración `add_operation_supply_packs`)

---

## Políticas por tabla

### 1. `public.users`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón puede ver todos los usuarios | SELECT | Pabellón | `is_pabellon()` |
| Pabellón puede crear usuarios | INSERT | Pabellón | `is_pabellon()` |
| Pabellón puede actualizar usuarios | UPDATE | Pabellón | `is_pabellon()` |
| Usuarios pueden ver su propio registro | SELECT | Cualquier autenticado | `auth.uid() = id` |
| Usuarios pueden actualizar su propio registro | UPDATE | Cualquier autenticado | `auth.uid() = id` |

---

### 2. `public.doctors`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón acceso total a doctores | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver su propio registro | SELECT | Doctor | `user_id = auth.uid()` y no eliminado |
| Doctor puede actualizar su propio registro | UPDATE | Doctor | `user_id = auth.uid()`; no puede cambiar `estado` ni `acceso_web_enabled` |

---

### 3. `public.operating_rooms`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón acceso total a pabellones | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver pabellones activos | SELECT | Doctor | `activo = true` y no eliminado |

---

### 4. `public.patients`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón puede ver todos los pacientes | SELECT | Pabellón | `is_pabellon()` |
| Pabellón puede gestionar pacientes | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver sus propios pacientes | SELECT | Doctor | `doctor_id = current_doctor_id()` |
| Doctor puede crear sus propios pacientes | INSERT | Doctor | `doctor_id = current_doctor_id()` |
| Doctor puede actualizar sus propios pacientes | UPDATE | Doctor | `doctor_id = current_doctor_id()` |

---

### 5. `public.supplies`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón acceso total a insumos | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver insumos activos | SELECT | Doctor | `activo = true` y no eliminado |

---

### 6. `public.surgery_requests`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón puede ver todas las solicitudes | SELECT | Pabellón | `is_pabellon()` |
| Pabellón puede gestionar solicitudes | UPDATE | Pabellón | `is_pabellon()` |
| Doctor puede ver sus propias solicitudes | SELECT | Doctor | `doctor_id = current_doctor_id()` |
| Doctor puede crear solicitudes propias | INSERT | Doctor | `doctor_id = current_doctor_id()` y doctor activo |
| Doctor puede actualizar sus solicitudes pendientes | UPDATE | Doctor | `doctor_id = current_doctor_id()` y `estado = 'pendiente'` |

---

### 7. `public.surgery_request_supplies`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón acceso total a insumos de solicitudes | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver insumos de sus solicitudes | SELECT | Doctor | Solicitud pertenece al doctor |
| Doctor puede gestionar insumos de solicitudes pendientes | ALL | Doctor | Solicitud del doctor y `estado = 'pendiente'` |

---

### 8. `public.surgeries`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón acceso total a cirugías | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver sus propias cirugías | SELECT | Doctor | `doctor_id = current_doctor_id()` |
| Doctor puede cancelar sus propias cirugías programadas | UPDATE | Doctor | `doctor_id = current_doctor_id()`, `estado = 'programada'`; solo puede cambiar a `'cancelada'` *(opcional, en CAMBIOS_PARA_FUNCIONALIDADES_PENDIENTES.sql)* |

---

### 9. `public.surgery_supplies`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón acceso total a insumos de cirugías | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver insumos de sus cirugías | SELECT | Doctor | Cirugía pertenece al doctor |

---

### 10. `public.schedule_blocks`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón acceso total a bloqueos | ALL | Pabellón | `is_pabellon()` |
| Doctor puede ver bloqueos | SELECT | Doctor | Registro no eliminado |

---

### 11. `public.reminders`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Usuarios pueden ver sus propios recordatorios | SELECT | Cualquier autenticado | `user_id = auth.uid()` |
| Usuarios pueden crear sus propios recordatorios | INSERT | Cualquier autenticado | `user_id = auth.uid()` |
| Usuarios pueden actualizar sus propios recordatorios | UPDATE | Cualquier autenticado | `user_id = auth.uid()` |
| Pabellón puede crear recordatorios | INSERT | Pabellón | `is_pabellon()` |

---

### 12. `public.notifications`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Usuarios pueden ver sus propias notificaciones | SELECT | Cualquier autenticado | `user_id = auth.uid()` |
| Usuarios pueden actualizar sus notificaciones | UPDATE | Cualquier autenticado | `user_id = auth.uid()` |
| Sistema puede crear notificaciones | INSERT | Cualquiera (triggers) | `true` |

---

### 13. `public.audit_logs`

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Pabellón puede ver logs de auditoría | SELECT | Pabellón | `is_pabellon()` |
| Sistema puede crear logs de auditoría | INSERT | Cualquiera (triggers) | `true` |

---

### 14. `public.operation_supply_packs`

*(Definido en migración `add_operation_supply_packs.sql`)*

| Política | Operación | Quién | Condición |
|----------|------------|--------|-----------|
| Doctores pueden ver packs por operación | SELECT | Doctor | `is_doctor()` |
| Pabellón puede ver packs por operación | SELECT | Pabellón | `is_pabellon()` |
| Pabellón puede insertar packs | INSERT | Pabellón | `is_pabellon()` |
| Pabellón puede actualizar packs | UPDATE | Pabellón | `is_pabellon()` |
| Pabellón puede eliminar packs | DELETE | Pabellón | `is_pabellon()` |

---

## Resumen por rol

- **Pabellón:** acceso total (SELECT/INSERT/UPDATE/DELETE) a doctores, pabellones, pacientes, insumos, solicitudes, cirugías, bloqueos, operation_supply_packs; lectura de users y audit_logs; puede crear usuarios y recordatorios.
- **Doctor:** solo sus propios datos (doctores, pacientes, solicitudes, cirugías e insumos asociados); lectura de pabellones activos, insumos activos, bloqueos y operation_supply_packs; puede crear pacientes y solicitudes; puede actualizar solicitudes pendientes y (si se aplica la migración) cancelar cirugías programadas.
- **Usuario autenticado:** ver/actualizar su propio registro en `users`; ver/crear/actualizar sus recordatorios y notificaciones.
- **Anon (sin login):** no puede leer `users` por RLS; el login por nombre de usuario usa la función `get_doctor_email_by_username` (SECURITY DEFINER) para resolver username → email.

---

## Archivos donde están definidas las reglas

| Archivo | Contenido |
|---------|-----------|
| `database/rls_policies.sql` | RLS y políticas principales (users, doctors, operating_rooms, patients, supplies, surgery_requests, surgery_request_supplies, surgeries, surgery_supplies, schedule_blocks, reminders, notifications, audit_logs). |
| `database/migrations/add_operation_supply_packs.sql` | RLS y políticas de `operation_supply_packs`. |
| `database/CAMBIOS_PARA_FUNCIONALIDADES_PENDIENTES.sql` | Política opcional para que el doctor pueda cancelar sus cirugías programadas. |
