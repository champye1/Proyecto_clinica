# Documentación Base de Datos – Implementación Paso a Paso

Esta guía describe cómo replicar la base de datos del **Sistema Clínico Quirúrgico** en otra página o proyecto. Sigue los pasos en orden.

---

## Resumen del sistema

- **Motor:** PostgreSQL (Supabase).
- **Auth:** Supabase Auth; tabla `users` con `role` (`doctor` | `pabellon`).
- **Flujo:** Doctores crean pacientes y solicitudes quirúrgicas; Pabellón acepta/rechaza, programa cirugías, bloquea horarios y gestiona insumos.

---

## PASO 1 – Requisitos previos

1. Crear un proyecto en [Supabase](https://supabase.com).
2. Tener acceso al **SQL Editor** del proyecto.
3. Opcional: extensión `uuid-ossp` y `pg_trgm` (Supabase suele traerlas).

---

## PASO 2 – Extensiones

Ejecutar en el SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

- `uuid-ossp`: generación de UUIDs.
- `pg_trgm`: búsquedas de texto (ej. insumos por nombre).

---

## PASO 3 – Tipos ENUM

Crear los tipos reutilizados en varias tablas:

```sql
CREATE TYPE doctor_status AS ENUM ('activo', 'vacaciones');
CREATE TYPE request_status AS ENUM ('pendiente', 'aceptada', 'rechazada', 'cancelada');
CREATE TYPE surgery_status AS ENUM ('programada', 'en_proceso', 'completada', 'cancelada');
CREATE TYPE medical_specialty AS ENUM (
    'cirugia_general', 'cirugia_cardiovascular', 'cirugia_plastica',
    'cirugia_ortopedica', 'neurocirugia', 'cirugia_oncologica',
    'urologia', 'ginecologia', 'otorrinolaringologia', 'oftalmologia', 'otra'
);
```

*(En migraciones posteriores se añade `hour_state`; ver Paso 10.)*

---

## PASO 4 – Tabla `users`

Vincula Supabase Auth con el rol de la aplicación.

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('pabellon', 'doctor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_users_role ON public.users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON public.users(email) WHERE deleted_at IS NULL;
```

- Cada usuario de Auth que use la app debe tener una fila aquí con `role` = `'doctor'` o `'pabellon'`.

---

## PASO 5 – Tabla `doctors`

Médicos vinculados a un usuario.

```sql
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    rut TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    especialidad medical_specialty NOT NULL,
    estado doctor_status NOT NULL DEFAULT 'activo',
    acceso_web_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT rut_format CHECK (rut ~ '^[0-9]{7,8}-[0-9kK]{1}$')
);
CREATE INDEX idx_doctors_user_id ON public.doctors(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_doctors_rut ON public.doctors(rut) WHERE deleted_at IS NULL;
CREATE INDEX idx_doctors_estado ON public.doctors(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_doctors_especialidad ON public.doctors(especialidad) WHERE deleted_at IS NULL;
```

---

## PASO 6 – Tabla `operating_rooms`

Pabellones quirúrgicos.

```sql
CREATE TABLE public.operating_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL UNIQUE,
    camillas_disponibles INTEGER NOT NULL DEFAULT 1 CHECK (camillas_disponibles > 0),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_operating_rooms_activo ON public.operating_rooms(activo) WHERE deleted_at IS NULL;
```

---

## PASO 7 – Tabla `patients`

Pacientes; pertenecen a un doctor.

```sql
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    rut TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(doctor_id, rut)
);
CREATE INDEX idx_patients_doctor_id ON public.patients(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_rut ON public.patients(rut) WHERE deleted_at IS NULL;
```

---

## PASO 8 – Tabla `supplies`

Insumos médicos (catálogo).

```sql
CREATE TABLE public.supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    grupo_prestacion TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_supplies_codigo ON public.supplies(codigo) WHERE deleted_at IS NULL;
CREATE INDEX idx_supplies_nombre_trgm ON public.supplies USING gin(nombre gin_trgm_ops);
CREATE INDEX idx_supplies_activo ON public.supplies(activo) WHERE deleted_at IS NULL;
```

---

## PASO 9 – Tabla `surgery_requests`

Solicitudes quirúrgicas (doctor → pabellón). Incluye columnas base; las de horarios preferidos y “dejar fecha a pabellón” se agregan en migraciones (Pasos 15–17).

```sql
CREATE TABLE public.surgery_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    codigo_operacion TEXT NOT NULL,
    hora_recomendada TIME NULL,
    observaciones TEXT,
    estado request_status NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_surgery_requests_doctor_id ON public.surgery_requests(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgery_requests_estado ON public.surgery_requests(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgery_requests_created_at ON public.surgery_requests(created_at DESC) WHERE deleted_at IS NULL;
```

---

## PASO 10 – Tablas de relación y cirugías

**10.1 – Insumos por solicitud**

```sql
CREATE TABLE public.surgery_request_supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_request_id UUID NOT NULL REFERENCES public.surgery_requests(id) ON DELETE CASCADE,
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(surgery_request_id, supply_id)
);
CREATE INDEX idx_srs_surgery_request_id ON public.surgery_request_supplies(surgery_request_id);
CREATE INDEX idx_srs_supply_id ON public.surgery_request_supplies(supply_id);
```

**10.2 – Cirugías programadas**

```sql
CREATE TABLE public.surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_request_id UUID NOT NULL UNIQUE REFERENCES public.surgery_requests(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    operating_room_id UUID NOT NULL REFERENCES public.operating_rooms(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado surgery_status NOT NULL DEFAULT 'programada',
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT hora_valida CHECK (hora_fin > hora_inicio)
);
CREATE INDEX idx_surgeries_doctor_id ON public.surgeries(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_operating_room_id ON public.surgeries(operating_room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_fecha ON public.surgeries(fecha) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_fecha_hora ON public.surgeries(fecha, hora_inicio) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_estado ON public.surgeries(estado) WHERE deleted_at IS NULL;
```

**10.3 – Insumos por cirugía**

```sql
CREATE TABLE public.surgery_supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(surgery_id, supply_id)
);
CREATE INDEX idx_ss_surgery_id ON public.surgery_supplies(surgery_id);
CREATE INDEX idx_ss_supply_id ON public.surgery_supplies(supply_id);
```

*(Nota: en una migración posterior se elimina el constraint `no_solapamiento` de `surgeries` y se añaden columnas de reagendamiento; la validación de solapamiento se hace por trigger.)*

---

## PASO 11 – Tabla `schedule_blocks`

Bloqueos de horario por pabellón (y opcionalmente por doctor).

```sql
CREATE TABLE public.schedule_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    operating_room_id UUID NOT NULL REFERENCES public.operating_rooms(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo TEXT,
    vigencia_hasta DATE NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT hora_valida_block CHECK (hora_fin > hora_inicio),
    CONSTRAINT vigencia_valida CHECK (vigencia_hasta IS NULL OR vigencia_hasta >= fecha)
);
CREATE INDEX idx_schedule_blocks_doctor_id ON public.schedule_blocks(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedule_blocks_operating_room_id ON public.schedule_blocks(operating_room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedule_blocks_fecha ON public.schedule_blocks(fecha) WHERE deleted_at IS NULL;
```

---

## PASO 12 – Tablas `reminders` y `notifications`

**12.1 – Recordatorios**

```sql
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('aviso', 'operacion_aceptada', 'recordatorio_general')),
    relacionado_con UUID NULL,
    visto BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_visto ON public.reminders(visto) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_created_at ON public.reminders(created_at DESC) WHERE deleted_at IS NULL;
```

**12.2 – Notificaciones**

```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN (
        'solicitud_aceptada', 'solicitud_rechazada', 'operacion_programada',
        'bloqueo_creado', 'recordatorio', 'solicitud_reagendamiento'
    )),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    relacionado_con UUID NULL,
    vista BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_vista ON public.notifications(vista) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC) WHERE deleted_at IS NULL;
```

*(Si creas la tabla antes de la migración de reagendamiento, el CHECK de `tipo` puede no incluir `'solicitud_reagendamiento'`; añádelo en esa migración.)*

---

## PASO 13 – Tabla `audit_logs`

Registro de auditoría (inserciones desde triggers).

```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,
    tabla_afectada TEXT NOT NULL,
    registro_id UUID NULL,
    datos_anteriores JSONB NULL,
    datos_nuevos JSONB NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_tabla_afectada ON public.audit_logs(tabla_afectada);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
```

---

## PASO 14 – Función `update_updated_at` y triggers

Actualizar `updated_at` en todas las tablas que lo tengan:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Crear triggers `BEFORE UPDATE` en: `users`, `doctors`, `operating_rooms`, `patients`, `supplies`, `surgery_requests`, `surgeries`, `schedule_blocks`, `reminders`, usando `EXECUTE FUNCTION update_updated_at_column();` (o `EXECUTE PROCEDURE` según tu versión de PostgreSQL).

---

## PASO 15 – Migración: horarios preferidos en solicitudes

Añadir primer y segundo horario preferido y pabellón preferido:

```sql
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS fecha_preferida DATE NULL,
  ADD COLUMN IF NOT EXISTS hora_fin_recomendada TIME NULL,
  ADD COLUMN IF NOT EXISTS operating_room_id_preferido UUID NULL REFERENCES public.operating_rooms(id) ON DELETE SET NULL;

ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS fecha_preferida_2 DATE NULL,
  ADD COLUMN IF NOT EXISTS hora_recomendada_2 TIME NULL,
  ADD COLUMN IF NOT EXISTS hora_fin_recomendada_2 TIME NULL,
  ADD COLUMN IF NOT EXISTS operating_room_id_preferido_2 UUID NULL REFERENCES public.operating_rooms(id) ON DELETE SET NULL;
```

---

## PASO 16 – Migración: “dejar fecha a pabellón” y horarios extra

```sql
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS dejar_fecha_a_pabellon BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS horarios_preferidos_extra JSONB NULL;
```

---

## PASO 17 – Migración: tiempo de limpieza en pabellones

```sql
ALTER TABLE public.operating_rooms
  ADD COLUMN IF NOT EXISTS tiempo_limpieza_minutos INTEGER NOT NULL DEFAULT 30 CHECK (tiempo_limpieza_minutos >= 0);
```

---

## PASO 18 – Migración: estados por hora y reagendamiento

- Crear tipo: `CREATE TYPE hour_state AS ENUM ('vacio', 'agendado', 'reagendado', 'bloqueado');`
- En `surgeries`: añadir `estado_hora`, `fecha_anterior`, `hora_inicio_anterior`, `hora_fin_anterior`, `fecha_ultimo_agendamiento`.
- En `schedule_blocks`: añadir `dias_auto_liberacion`, `fecha_auto_liberacion` y trigger que calcule `fecha_auto_liberacion`.
- Crear tabla `surgery_schedule_history` para historial de reagendamientos.
- Triggers/funciones: `actualizar_fecha_ultimo_agendamiento`, `validar_solapamiento_cirugia` (actualizada con `estado_hora` y tiempo de limpieza), `liberar_bloqueos_expirados`.

*(Detalle completo en `database/migrations/add_hour_states_system.sql` y `fix_critical_issues.sql`.)*

---

## PASO 19 – Migración: inventario de insumos

- En `supplies`: añadir `stock_actual`, `stock_minimo`, `unidad_medida`.
- Crear tabla `supply_movements` (entrada/salida/ajuste).
- Función/trigger `update_supply_stock` al insertar en `supply_movements`.
- Opcional: trigger para crear movimientos de salida al programar cirugía (según `add_inventory_control.sql`).

---

## PASO 20 – Migración: grupos Fonasa y packs por operación

- En `supplies`: `ADD COLUMN grupos_fonasa TEXT NULL`.
- Crear tabla `operation_supply_packs` (codigo_operacion, supply_id, cantidad) con RLS y triggers `updated_at`. Ver `add_grupos_fonasa_insumos.sql` y `add_operation_supply_packs.sql`.

---

## PASO 21 – Migración: notificación de reagendamiento

- En `notifications`: asegurar que el CHECK de `tipo` incluya `'solicitud_reagendamiento'`.
- En `surgery_requests`: `ADD COLUMN reagendamiento_notificado_at TIMESTAMPTZ NULL`.
- Crear función RPC `notificar_reagendamiento_a_pabellon(p_surgery_request_id UUID)` (SECURITY DEFINER, notifica a usuarios con role `'pabellon'`). Ver `add_notification_tipo_reagendamiento.sql`.

---

## PASO 22 – Función RPC `get_estado_slots_pabellon`

Para que el doctor (y la app) vea por fecha qué slots están libres, ocupados, bloqueados o solicitados:

- Parámetro: `p_fecha DATE`.
- Retorna tabla: `operating_room_id`, `nombre_pabellon`, `hora_inicio`, `hora_fin`, `estado` (texto: `'libre'`, `'ocupado'`, `'bloqueado'`, `'solicitado'`).
- Lógica: para cada pabellón activo y cada hora (ej. 08:00–19:00), comprobar si hay cirugía, bloqueo o solicitud pendiente/aceptada con ese pabellón y horario.
- Crear con `LANGUAGE plpgsql STABLE SECURITY DEFINER` y `GRANT EXECUTE ... TO authenticated, anon`.

*(Código completo en `database/migrations/aplicar_para_reservar_hora.sql` y `add_vista_estado_slots_doctor.sql`.)*

---

## PASO 23 – Función RPC `programar_cirugia_completa`

Operación atómica para programar una cirugía desde una solicitud:

- Parámetros: `p_surgery_request_id`, `p_operating_room_id`, `p_fecha`, `p_hora_inicio`, `p_hora_fin`, `p_observaciones` (opcional).
- Validar: solicitud existe, estado `pendiente`, pabellón activo, hora_fin > hora_inicio, fecha >= hoy.
- Insertar en `surgeries` (los triggers validan solapamiento y tiempo de limpieza).
- Copiar filas de `surgery_request_supplies` a `surgery_supplies`.
- Actualizar `surgery_requests.estado` a `'aceptada'`.
- Retornar JSON con `success`, `surgery_id`, `surgery_request_id`, `message`.
- Crear con `SECURITY DEFINER` y `GRANT EXECUTE ... TO authenticated`.

*(Código en `database/migrations/fix_critical_issues.sql`.)*

---

## PASO 24 – Triggers de negocio

- **validar_doctor_activo:** BEFORE INSERT en `surgery_requests` → el doctor debe estar activo.
- **notificar_solicitud_aceptada:** AFTER UPDATE en `surgery_requests` → al pasar a `aceptada`, insertar notificación al doctor.
- **notificar_cirugia_programada:** AFTER INSERT en `surgeries` → notificación + recordatorio al doctor.
- **validar_solapamiento_cirugia:** BEFORE INSERT/UPDATE en `surgeries` → no solapamiento y respeto de tiempo de limpieza (según migraciones).
- **registrar_auditoria:** AFTER INSERT/UPDATE/DELETE en tablas críticas (`surgeries`, `surgery_requests`, `doctors`) → insertar en `audit_logs`.

*(Definiciones en `database/schema.sql` y migraciones.)*

---

## PASO 25 – Row Level Security (RLS)

1. Habilitar RLS en todas las tablas públicas listadas.
2. Crear funciones auxiliares: `is_pabellon()`, `is_doctor()`, `current_doctor_id()` (SECURITY DEFINER, leen `auth.uid()` y `users`/`doctors`).
3. Definir políticas por tabla:
   - **users:** Pabellón ve/todos; cada usuario ve/actualiza su propia fila.
   - **doctors:** Pabellón ALL; doctor SELECT/UPDATE solo su registro.
   - **operating_rooms:** Pabellón ALL; doctor SELECT activos.
   - **patients:** Pabellón SELECT; doctor SELECT/INSERT/UPDATE solo los suyos (`doctor_id = current_doctor_id()`).
   - **supplies:** Pabellón ALL; doctor SELECT activos.
   - **surgery_requests:** Pabellón SELECT/UPDATE; doctor SELECT/INSERT solo propios; doctor UPDATE solo pendientes propios.
   - **surgery_request_supplies:** En función de `surgery_requests` y `current_doctor_id()`.
   - **surgeries:** Pabellón ALL; doctor SELECT propias.
   - **surgery_supplies:** Pabellón ALL; doctor SELECT vía sus cirugías.
   - **schedule_blocks:** Pabellón ALL; doctor solo SELECT.
   - **reminders / notifications:** Cada usuario solo sus filas; sistema (triggers) puede INSERT.
   - **audit_logs:** Pabellón SELECT; sistema INSERT.

*(Detalle completo en `database/rls_policies.sql`.)*

---

## PASO 26 – Vistas opcionales

- `v_cirugias_hoy`: cirugías del día con nombres de doctor, paciente, pabellón y código.
- `v_ocupacion_hora`: por fecha y hora, conteo de cirugías y pabellones ocupados.
- `v_solicitudes_pendientes`: solicitudes pendientes con datos de doctor y paciente.
- `v_estados_horas`: estados por pabellón/fecha/hora (vacio/agendado/reagendado/bloqueado) si aplicaste la migración de estados por hora.

---

## PASO 27 – Datos iniciales y usuario pabellón

1. **Pabellones:** Insertar al menos un `operating_rooms` (nombre, activo, etc.).
2. **Usuario pabellón:** Crear usuario en Supabase Auth, luego insertar en `public.users` con `id` = UUID de Auth, `email` y `role = 'pabellon'`.
3. **Doctores:** Crear vía Edge Function `create-doctor` (crea usuario en Auth + fila en `users` + fila en `doctors`) o flujo equivalente.

---

## PASO 28 – Uso desde la otra página (frontend)

- **Cliente:** `@supabase/supabase-js` con `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
- **Auth:** `supabase.auth.signInWithPassword()` / `getUser()`; la app debe asegurar que exista la fila en `users` con el rol correcto.
- **Tablas:** Todas las lecturas/escrituras vía `supabase.from('nombre_tabla').select()/.insert()/.update()/.delete()`, respetando RLS.
- **RPCs:**
  - `supabase.rpc('get_estado_slots_pabellon', { p_fecha: 'YYYY-MM-DD' })`
  - `supabase.rpc('programar_cirugia_completa', { p_surgery_request_id, p_operating_room_id, p_fecha, p_hora_inicio, p_hora_fin, p_observaciones })`
  - `supabase.rpc('notificar_reagendamiento_a_pabellon', { p_surgery_request_id })`

---

## Orden recomendado de ejecución (resumen)

| Paso | Contenido |
|------|-----------|
| 1–2  | Proyecto Supabase + extensiones |
| 3    | ENUMs |
| 4–13 | Tablas base (users → audit_logs) |
| 14   | Triggers `updated_at` |
| 15–16| Columnas extra en `surgery_requests` (horarios, dejar a pabellón) |
| 17   | Tiempo limpieza en `operating_rooms` |
| 18   | Estados por hora, `schedule_blocks`, `surgery_schedule_history`, triggers de solapamiento/reagendamiento |
| 19   | Inventario (supplies + supply_movements) |
| 20   | Grupos Fonasa + operation_supply_packs |
| 21   | Notificación reagendamiento + RPC |
| 22   | RPC get_estado_slots_pabellon |
| 23   | RPC programar_cirugia_completa |
| 24   | Triggers de negocio (notificaciones, validaciones, auditoría) |
| 25   | RLS en todas las tablas |
| 26   | Vistas (opcional) |
| 27   | Datos iniciales y usuario pabellón |
| 28   | Integración en la otra página |

---

## Archivos de referencia en este repositorio

- `database/schema.sql` – Esquema base y triggers/vistas.
- `database/rls_policies.sql` – Políticas RLS.
- `database/migrations/` – Migraciones en orden (aplicar_para_reservar_hora, add_dejar_fecha_y_horarios_extra, add_operating_room_preferido_y_solicitado, add_cleaning_time, add_hour_states_system, add_inventory_control, add_grupos_fonasa_insumos, add_operation_supply_packs, add_segundo_horario_preferido, add_notification_tipo_reagendamiento, fix_critical_issues, add_vista_estado_slots_doctor).
- `database/setup/` – Setup de pabellones y usuario pabellón.
- `database/function_create_doctor_user.sql` – Referencia; creación real de usuario doctor vía Edge Function `create-doctor`.

Con esta guía puedes reproducir la base de datos del sistema clínico en otro proyecto Supabase y reutilizarla desde otra página o frontend.
