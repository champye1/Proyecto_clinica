# Base de Datos - Guía de Archivos SQL

Esta carpeta contiene todos los scripts SQL necesarios para configurar y mantener la base de datos.

## 📁 Estructura Recomendada

```
database/
├── schema.sql                    # ⚠️ ESENCIAL: Esquema completo de BD
├── rls_policies.sql              # ⚠️ ESENCIAL: Políticas de seguridad
├── migrations/                   # Migraciones oficiales (ejecutar en orden)
│   ├── add_cleaning_time.sql
│   ├── add_hour_states_system.sql
│   └── add_inventory_control.sql
├── setup/                        # Scripts de configuración inicial
│   ├── crear_pabellones_basicos.sql
│   ├── crear_usuario_pabellon.sql
│   └── insumos_basicos_chile.sql
├── utilities/                    # Scripts de utilidad y mantenimiento
│   ├── crear_doctores_y_datos_completos.sql
│   ├── crear_medico_directo.sql
│   ├── eliminar_usuarios.sql
│   ├── limpiar_cirugias_y_bloqueos.sql
│   └── verificar_medicos.sql
├── fixes/                       # Scripts de corrección de problemas
│   ├── fix_audit_logs_permissions.sql
│   ├── fix_doctors_user_id.sql
│   └── solucionar_login_pabellon.sql
└── functions/                   # Funciones personalizadas
    └── function_create_doctor_user.sql
```

## 🚨 Archivos ESENCIALES (NO ELIMINAR)

### 1. `schema.sql`
**Propósito:** Define toda la estructura de la base de datos (tablas, tipos, índices, constraints).

**Cuándo ejecutar:** 
- Primera vez que configuras la base de datos
- Si necesitas recrear todo desde cero

**⚠️ NO ELIMINAR:** Es el archivo más importante del proyecto.

### 2. `rls_policies.sql`
**Propósito:** Define las políticas de Row Level Security (RLS) para control de acceso.

**Cuándo ejecutar:**
- Después de ejecutar `schema.sql`
- Si modificas políticas de seguridad

**⚠️ NO ELIMINAR:** Esencial para la seguridad del sistema.

### 3. `migrations/` (Carpeta)
**Propósito:** Migraciones incrementales que modifican el esquema existente.

**Cuándo ejecutar:**
- Después de `schema.sql` y `rls_policies.sql`
- En orden cronológico (por fecha de creación)

**Archivos:**
- `add_cleaning_time.sql` - Agrega tiempo de limpieza entre cirugías
- `add_hour_states_system.sql` - Sistema de estados por hora
- `add_inventory_control.sql` - Control de inventario

**⚠️ NO ELIMINAR:** Necesarios para actualizar bases de datos existentes.

## 📝 Scripts de Configuración Inicial (`setup/`)

**Propósito:** Crear datos iniciales para empezar a usar el sistema.

**Cuándo ejecutar:** Después de configurar el esquema básico.

- `crear_pabellones_basicos.sql` - Crea pabellones de ejemplo
- `crear_usuario_pabellon.sql` - Crea usuario pabellón inicial
- `insumos_basicos_chile.sql` - Crea insumos básicos

**💡 Opcional:** Puedes ejecutarlos o crear los datos manualmente desde la interfaz.

## 🛠️ Scripts de Utilidad (`utilities/`)

**Propósito:** Tareas comunes de mantenimiento y administración.

**Cuándo ejecutar:** Según necesidad.

- `crear_doctores_y_datos_completos.sql` - Crea doctores con datos de prueba completos
- `crear_medico_directo.sql` - Crea un médico directamente
- `eliminar_usuarios.sql` - Elimina usuarios (cuidado)
- `limpiar_cirugias_y_bloqueos.sql` - Limpia cirugías y bloqueos
- `verificar_medicos.sql` - Verifica datos de médicos

**💡 Útiles para desarrollo y pruebas.**

## 🔧 Scripts de Corrección (`fixes/`)

**Propósito:** Solucionar problemas específicos que pueden surgir.

**Cuándo ejecutar:** Solo cuando tengas el problema específico.

- `fix_audit_logs_permissions.sql` - Corrige permisos de audit_logs
- `fix_doctors_user_id.sql` - Corrige user_id de doctores
- `solucionar_login_pabellon.sql` - Soluciona problemas de login

**💡 Mantener por si acaso surgen problemas.**

## ⚙️ Funciones (`functions/`)

**Propósito:** Funciones PostgreSQL reutilizables.

- `function_create_doctor_user.sql` - Función para crear usuarios doctores

**💡 Pueden estar integradas en schema.sql o ser independientes.**

## 📋 Orden de Ejecución Recomendado

### Primera Instalación:

1. ✅ `schema.sql` - Crear estructura base
2. ✅ `rls_policies.sql` - Configurar seguridad
3. ✅ `migrations/add_cleaning_time.sql` - Migración 1
4. ✅ `migrations/add_hour_states_system.sql` - Migración 2
5. ✅ `migrations/add_inventory_control.sql` - Migración 3 (si existe)
6. ✅ `setup/crear_pabellones_basicos.sql` - Datos iniciales
7. ✅ `setup/crear_usuario_pabellon.sql` - Usuario inicial

### Actualización de Base Existente:

1. ✅ Ejecutar solo las migraciones nuevas en orden
2. ✅ Verificar que no haya conflictos

## ⚠️ ADVERTENCIAS IMPORTANTES

### ❌ NO ELIMINAR:
- `schema.sql` - Base de todo el sistema
- `rls_policies.sql` - Seguridad crítica
- Archivos en `migrations/` - Historial de cambios

### ⚠️ USAR CON CUIDADO:
- Scripts de `eliminar_*` - Pueden borrar datos
- Scripts de `limpiar_*` - Pueden borrar datos
- Scripts en `fixes/` - Solo si tienes el problema específico

### ✅ SEGUROS DE ELIMINAR (si no los necesitas):
- Scripts de datos de prueba (si ya tienes datos reales)
- Scripts de fixes antiguos (si ya resolviste el problema)

## 💡 Recomendación

**NO consolidar ni eliminar archivos SQL** porque:
1. ✅ Cada archivo tiene un propósito específico
2. ✅ Algunos se ejecutan en momentos diferentes
3. ✅ Son necesarios para diferentes escenarios (desarrollo, producción, fixes)
4. ✅ Eliminarlos podría romper el sistema

**Mejor opción:** Organizarlos en subcarpetas como se muestra arriba para mantenerlos organizados pero accesibles.

---

**Última actualización:** 2026-01-25
