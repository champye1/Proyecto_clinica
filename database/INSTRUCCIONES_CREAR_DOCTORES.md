# Instrucciones para Crear Doctores, Pacientes, Cirugías y Bloqueos

Este documento explica cómo crear usuarios doctores, agendar cirugías y crear bloques de horarios en el sistema.

## 📋 Requisitos Previos

1. Tener acceso al Dashboard de Supabase
2. Tener los pabellones creados (ejecutar `crear_pabellones_basicos.sql` si no existen)
3. Tener al menos un usuario pabellón creado

## 🚀 Pasos para Ejecutar

### Paso 1: Crear Usuarios en Supabase Auth

Primero debes crear los usuarios de autenticación. Tienes dos opciones:

#### Opción A: Desde el Dashboard de Supabase (Recomendado)

1. Ve al Dashboard de Supabase
2. Navega a **Authentication** > **Users**
3. Haz clic en **Add User** o **Invite User**
4. Crea los siguientes usuarios:

   **Usuario 1:**
   - Email: `doctor1@clinica.com`
   - Password: `Doctor123!` (o una contraseña segura)
   - Auto Confirm User: ✅ (marcar esta opción)

   **Usuario 2:**
   - Email: `doctor2@clinica.com`
   - Password: `Doctor123!` (o una contraseña segura)
   - Auto Confirm User: ✅

   **Usuario 3:**
   - Email: `doctor3@clinica.com`
   - Password: `Doctor123!` (o una contraseña segura)
   - Auto Confirm User: ✅

#### Opción B: Usando SQL (Solo para desarrollo)

Si estás en desarrollo y tienes acceso directo a la base de datos, puedes usar la función de administración:

```sql
-- NOTA: Esto requiere permisos de administrador
-- En producción, usa siempre el Dashboard o la API Admin

-- Crear usuarios usando la función de administración
-- (Solo funciona si tienes permisos de service_role)
```

**⚠️ IMPORTANTE:** En producción, siempre usa el Dashboard o la API Admin de Supabase para crear usuarios.

### Paso 2: Verificar que los Usuarios se Crearon

Ejecuta esta consulta en el SQL Editor de Supabase para verificar:

```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email IN (
    'doctor1@clinica.com',
    'doctor2@clinica.com',
    'doctor3@clinica.com'
)
ORDER BY email;
```

Debes ver 3 usuarios con sus IDs (UUIDs).

### Paso 3: Ejecutar el Script SQL

1. Ve al **SQL Editor** de Supabase
2. Abre el archivo `crear_doctores_y_datos_completos.sql`
3. Copia y pega todo el contenido
4. Haz clic en **Run** o presiona `Ctrl+Enter`

El script creará automáticamente:
- ✅ 3 doctores (Dr. Carlos Mendoza, Dra. María González, Dr. Juan Pérez)
- ✅ 8 pacientes (distribuidos entre los doctores)
- ✅ 4 solicitudes quirúrgicas aceptadas
- ✅ 6 cirugías programadas (distribuidas en diferentes fechas)
- ✅ 4 bloques de horarios (convenios y mantenimientos)

### Paso 4: Verificar los Datos Creados

El script incluye consultas de verificación al final. Ejecuta cada una para confirmar:

#### Ver Doctores:
```sql
SELECT 
    d.id,
    d.nombre || ' ' || d.apellido as nombre_completo,
    d.email,
    d.especialidad,
    d.estado
FROM public.doctors d
WHERE d.email IN ('doctor1@clinica.com', 'doctor2@clinica.com', 'doctor3@clinica.com')
AND d.deleted_at IS NULL
ORDER BY d.nombre;
```

#### Ver Pacientes:
```sql
SELECT 
    p.nombre || ' ' || p.apellido as nombre_completo,
    p.rut,
    d.nombre || ' ' || d.apellido as doctor
FROM public.patients p
JOIN public.doctors d ON p.doctor_id = d.id
WHERE d.email IN ('doctor1@clinica.com', 'doctor2@clinica.com', 'doctor3@clinica.com')
AND p.deleted_at IS NULL
ORDER BY d.nombre, p.nombre;
```

#### Ver Cirugías Programadas:
```sql
SELECT 
    s.fecha,
    s.hora_inicio,
    s.hora_fin,
    d.nombre || ' ' || d.apellido as doctor,
    p.nombre || ' ' || p.apellido as paciente,
    pab.nombre as pabellon,
    s.estado
FROM public.surgeries s
JOIN public.doctors d ON s.doctor_id = d.id
JOIN public.patients p ON s.patient_id = p.id
JOIN public.operating_rooms pab ON s.operating_room_id = pab.id
WHERE s.deleted_at IS NULL
ORDER BY s.fecha, s.hora_inicio;
```

#### Ver Bloqueos de Horario:
```sql
SELECT 
    sb.fecha,
    sb.hora_inicio,
    sb.hora_fin,
    COALESCE(d.nombre || ' ' || d.apellido, 'Sin doctor asignado') as doctor,
    pab.nombre as pabellon,
    sb.motivo
FROM public.schedule_blocks sb
JOIN public.operating_rooms pab ON sb.operating_room_id = pab.id
LEFT JOIN public.doctors d ON sb.doctor_id = d.id
WHERE sb.deleted_at IS NULL
ORDER BY sb.fecha, sb.hora_inicio;
```

## 📊 Resumen de Datos Creados

### Doctores:
1. **Dr. Carlos Mendoza** - Cirugía General
   - Email: `doctor1@clinica.com`
   - RUT: `12345678-9`
   - Estado: Activo

2. **Dra. María González** - Cirugía Cardiovascular
   - Email: `doctor2@clinica.com`
   - RUT: `23456789-0`
   - Estado: Activo

3. **Dr. Juan Pérez** - Cirugía Ortopédica
   - Email: `doctor3@clinica.com`
   - RUT: `34567890-1`
   - Estado: Activo

### Pacientes:
- **Doctor 1:** Ana Silva, Pedro Martínez, Laura Rodríguez
- **Doctor 2:** Roberto Fernández, Carmen López
- **Doctor 3:** Diego Sánchez, Patricia Torres, Fernando Morales

### Cirugías Programadas:
- **Mañana:** 3 cirugías (Doctor 1 en Pabellón 1 y 2, Doctor 2 en Pabellón 3)
- **Pasado mañana:** 1 cirugía (Doctor 3 en Pabellón 1)
- **En 3 días:** 1 cirugía (Doctor 1 en Pabellón 2)
- **En 5 días:** 1 cirugía (Doctor 2 en Pabellón 4)

### Bloqueos de Horario:
1. **Mañana 12:00-14:00:** Pabellón 1 bloqueado por convenio
2. **Pasado mañana todo el día:** Pabellón 2 bloqueado por mantenimiento
3. **En 4 días 10:00-12:00:** Pabellón 3 bloqueado por convenio
4. **En 6 días 09:00-11:00:** Pabellón 1 bloqueado personalmente por Doctor 1

## 🔐 Credenciales de Acceso

Los doctores pueden iniciar sesión con:
- **Email:** `doctor1@clinica.com`, `doctor2@clinica.com`, `doctor3@clinica.com`
- **Password:** La contraseña que configuraste al crear los usuarios en auth

## ⚠️ Notas Importantes

1. **Seguridad:** En producción, asegúrate de cambiar las contraseñas después de la creación inicial
2. **RUTs:** Los RUTs usados son de ejemplo. En producción, usa RUTs reales
3. **Fechas:** Las cirugías se crean con fechas relativas (mañana, pasado mañana, etc.)
4. **Conflictos:** El script usa `ON CONFLICT DO NOTHING` para evitar errores si los datos ya existen
5. **Soft Delete:** Todos los datos usan soft delete, así que puedes recuperarlos si es necesario

## 🐛 Solución de Problemas

### Error: "No se encontraron todos los pabellones"
**Solución:** Ejecuta primero `crear_pabellones_basicos.sql`

### Error: "No se encontró ningún usuario para crear bloques"
**Solución:** Crea primero un usuario pabellón usando `crear_usuario_pabellon.sql`

### Error: "violates foreign key constraint"
**Solución:** Asegúrate de que los usuarios existen en `auth.users` antes de ejecutar el script

### Los doctores no pueden iniciar sesión
**Solución:** Verifica que:
1. Los usuarios existen en `auth.users`
2. El email está confirmado (`email_confirmed_at` no es NULL)
3. Los usuarios tienen el rol correcto en `public.users`

## 📝 Personalización

Si quieres cambiar los emails, nombres, o fechas, edita el archivo `crear_doctores_y_datos_completos.sql` antes de ejecutarlo.

---

**Última actualización:** 2026-01-23
