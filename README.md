# Sistema Clínico Quirúrgico - Clínica Privada Viña del Mar

Sistema completo de gestión para clínica quirúrgica privada desarrollado con React, Tailwind CSS y Supabase (PostgreSQL).

**Versión:** 1.0.0  
**Última actualización:** 2026-01-25

---

## 📑 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Instalación](#instalación)
3. [Sistema de Estados por Hora](#sistema-de-estados-por-hora)
4. [Modelo de Datos](#modelo-de-datos)
5. [Flujos Principales](#flujos-principales)
6. [Seguridad](#seguridad)
7. [Comparación con Sistemas Comerciales](#comparación-con-sistemas-comerciales)
8. [Desarrollo](#desarrollo)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Estilos**: Tailwind CSS
- **Backend/BaaS**: Supabase
- **Base de Datos**: PostgreSQL
- **Autenticación**: Supabase Auth (JWT)
- **Seguridad**: Row Level Security (RLS)
- **Estado**: TanStack Query (React Query)

### Roles del Sistema

1. **Pabellón** (Administrador único)
   - Gestión completa del sistema
   - Administración de médicos
   - Programación de cirugías
   - Gestión de solicitudes
   - Control de bloqueos horarios
   - Administración de insumos

2. **Doctor**
   - Crear fichas de pacientes
   - Crear solicitudes quirúrgicas
   - Ver calendario personal
   - Ver estado de solicitudes
   - Ver recordatorios y notificaciones

---

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ y npm/yarn
- Cuenta en Supabase (https://supabase.com)
- Git

### Paso 1: Configurar Proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta
2. Crea un nuevo proyecto
3. En **Settings** → **API**, copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public** key

### Paso 2: Configurar Base de Datos

#### 2.1 Ejecutar Schema SQL

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `database/schema.sql` de este proyecto
3. Copia TODO el contenido y ejecútalo
4. Verifica que no haya errores

#### 2.2 Ejecutar Políticas RLS

1. En el SQL Editor, abre `database/rls_policies.sql`
2. Copia TODO el contenido y ejecútalo
3. Verifica que todas las políticas se hayan creado

#### 2.3 Ejecutar Migraciones

Ejecuta las migraciones en orden:

1. `database/migrations/add_cleaning_time.sql` - Tiempo de limpieza entre cirugías
2. `database/migrations/add_hour_states_system.sql` - Sistema de estados por hora

### Paso 3: Crear Usuario Pabellón Inicial

#### 3.1 Crear Usuario en Auth

1. Ve a **Authentication** → **Users** en Supabase
2. Haz clic en **Add user** → **Create new user**
3. Ingresa email y contraseña
4. Activa **Auto Confirm User**
5. **IMPORTANTE**: Copia el **User UID** generado

#### 3.2 Crear Registro en Tabla Users

Ejecuta este SQL (reemplaza `TU_USER_UID_AQUI` con el UID copiado):

```sql
INSERT INTO public.users (id, email, role)
VALUES (
  'TU_USER_UID_AQUI',
  'pabellon@clinica.cl',
  'pabellon'
);
```

### Paso 4: Configurar Proyecto Local

#### 4.1 Instalar Dependencias

```bash
npm install
```

#### 4.2 Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### Paso 5: Ejecutar el Proyecto

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:5173`

---

## 🎯 Sistema de Estados por Hora

El sistema implementa **4 estados diferentes** para cada hora del calendario, permitiendo un control granular sobre la disponibilidad de los pabellones quirúrgicos.

### Los 4 Estados

#### 1. **VACIO** 🟢
- La hora está disponible para agendar
- No hay cirugía programada ni bloqueo activo

#### 2. **AGENDADO** 🔵
- Existe un paciente que ocupa esa hora
- Primera vez que se agenda la cirugía
- `fecha_ultimo_agendamiento` se establece automáticamente

#### 3. **REAGENDADO** 🟡
- Paciente que cambió de fecha/hora
- Se guarda automáticamente:
  - `fecha_anterior`: Fecha original
  - `hora_inicio_anterior`: Hora de inicio original
  - `hora_fin_anterior`: Hora de fin original
- `fecha_ultimo_agendamiento` se actualiza con el cambio

#### 4. **BLOQUEADO** 🔴
- Horas bloqueadas sin necesidad de paciente
- Puede tener **auto-liberación configurable**
- Dos tipos:
  - **Permanente**: Sin auto-liberación (hasta liberación manual)
  - **Temporal**: Con auto-liberación por días hacia adelante

### Auto-Liberación de Bloqueos

Cada bloqueo puede tener configurado:
- **`dias_auto_liberacion`**: Cantidad de días hacia adelante
- **`fecha_auto_liberacion`**: Fecha calculada automáticamente

**Ejemplo:** Si bloqueas un pabellón el lunes con `dias_auto_liberacion = 2`, se liberará automáticamente el miércoles.

### Flujo de Reagendamiento

Cuando un doctor modifica la fecha/hora de una cirugía:
1. El sistema detecta el cambio automáticamente
2. Guarda la fecha/hora anterior
3. Marca la cirugía como `'reagendado'`
4. Actualiza `fecha_ultimo_agendamiento`
5. La hora anterior queda automáticamente **VACIA**

### Vista de Estados

Consulta los estados usando la vista `v_estados_horas`:

```sql
SELECT * FROM v_estados_horas
WHERE fecha = '2026-01-30'
  AND operating_room_id = 'pabellon-id'
ORDER BY hora;
```

---

## 📊 Modelo de Datos

### Tablas Principales

- `users` - Usuarios del sistema (vinculados a Supabase Auth)
- `doctors` - Información de médicos
- `patients` - Pacientes registrados
- `operating_rooms` - Pabellones quirúrgicos
- `supplies` - Insumos médicos
- `surgery_requests` - Solicitudes quirúrgicas
- `surgeries` - Cirugías programadas (con estados por hora)
- `schedule_blocks` - Bloqueos de horarios (con auto-liberación)
- `reminders` - Recordatorios
- `notifications` - Notificaciones
- `audit_logs` - Logs de auditoría

### Campos Importantes en `surgeries`

- `estado_hora` - Estado de la hora: 'vacio', 'agendado', 'reagendado', 'bloqueado'
- `fecha_anterior` - Fecha anterior cuando fue reagendada
- `hora_inicio_anterior` - Hora de inicio anterior
- `hora_fin_anterior` - Hora de fin anterior
- `fecha_ultimo_agendamiento` - Fecha y hora del último agendamiento

### Campos Importantes en `schedule_blocks`

- `dias_auto_liberacion` - Cantidad de días hacia adelante para auto-liberación
- `fecha_auto_liberacion` - Fecha calculada automáticamente

Ver `database/schema.sql` para detalles completos.

---

## 🔄 Flujos Principales

### Flujo: Solicitud → Aprobación → Programación

1. Doctor crea ficha de paciente y solicitud quirúrgica
2. Pabellón revisa solicitud pendiente
3. Pabellón acepta/rechaza solicitud
4. Si acepta, se crea notificación automática al doctor
5. Pabellón programa cirugía (fecha, hora, pabellón)
6. Se crea notificación y recordatorio automático al doctor
7. La cirugía queda con estado `'agendado'`

### Flujo: Reagendamiento

1. Doctor modifica fecha/hora de cirugía existente
2. Sistema detecta cambio automáticamente
3. Guarda fecha/hora anterior
4. Marca como `'reagendado'`
5. Actualiza `fecha_ultimo_agendamiento`
6. La hora anterior queda automáticamente **VACIA**

### Flujo: Bloqueo de Horario

1. Pabellón crea bloqueo (pabellón, fecha, hora, motivo)
2. Opcionalmente configura `dias_auto_liberacion`
3. Sistema calcula `fecha_auto_liberacion` automáticamente
4. Sistema valida que no haya solapamiento
5. Bloqueo queda activo hasta liberación manual o automática

---

## 🔐 Seguridad

### Row Level Security (RLS)

El sistema implementa RLS en todas las tablas para garantizar que:

- **Pabellón**: Acceso total a todos los datos
- **Doctor**: Solo puede ver y modificar sus propios datos
- Las políticas previenen accesos cruzados entre doctores
- Todas las acciones críticas se registran en auditoría

### Validaciones

- Validación de solapamiento de cirugías en mismo pabellón/hora
- Validación de bloqueos horarios
- Verificación de estado de médico antes de crear solicitudes
- Soft delete en todas las tablas críticas
- Validación de estados por hora al reagendar

---

## 📊 Comparación con Sistemas Comerciales

### Ventajas Competitivas

1. **✅ Estados Granulares por Hora**
   - Único en el mercado: Sistema de 4 estados
   - Reagendamiento automático con historial completo
   - Auto-liberación configurable de bloqueos

2. **✅ Arquitectura Moderna y Escalable**
   - Stack tecnológico actualizado (React 18, Supabase, PostgreSQL)
   - Código abierto y mantenible
   - Bajo costo de infraestructura (BaaS)

3. **✅ Seguridad Robusta**
   - Row Level Security (RLS) completo
   - Soft delete en todas las tablas
   - Auditoría completa de cambios

4. **✅ Costo Total de Propiedad**
   - Tu sistema: ~$25-100 USD/mes
   - Sistemas comerciales: $500-$50,000+ USD/mes
   - **Diferencia: 10-100x más económico**

### Gaps Principales

**Alta Prioridad:**
- Analytics y reportes (PDF/Excel)
- Gestión de inventario de insumos
- Notificaciones por email/SMS

**Media Prioridad:**
- Optimización automática de asignaciones
- Gestión de equipo quirúrgico completo
- Integraciones con EMR/EHR

### Posicionamiento

**Tu Sistema es Ideal Para:**
- ✅ Clínicas privadas pequeñas/medianas (1-10 pabellones)
- ✅ Clínicas que necesitan customización específica
- ✅ Organizaciones con presupuesto limitado
- ✅ Proyectos que requieren implementación rápida

Ver `COMPARACION_SISTEMAS_COMERCIALES.md` para análisis detallado.

---

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Construye para producción
npm run preview  # Previsualiza build de producción
npm run lint     # Ejecuta linter
```

### Convenciones de Código

- Componentes en PascalCase
- Hooks personalizados con prefijo `use`
- Servicios en camelCase
- Archivos de configuración en camelCase

### Estructura del Proyecto

```
Proyecto_clinica/
├── database/
│   ├── schema.sql              # Esquema completo de base de datos
│   ├── rls_policies.sql        # Políticas de seguridad RLS
│   └── migrations/              # Migraciones de base de datos
│       ├── add_cleaning_time.sql
│       └── add_hour_states_system.sql
├── src/
│   ├── components/             # Componentes reutilizables
│   ├── config/                 # Configuración (Supabase)
│   ├── layouts/                # Layouts por rol
│   ├── pages/                  # Páginas de la aplicación
│   ├── hooks/                  # Hooks personalizados
│   └── utils/                  # Utilidades
├── .env                        # Variables de entorno
└── README.md                   # Este archivo
```

### Migraciones

Para cambios futuros en el esquema:

1. Crea archivos de migración en `database/migrations/`
2. Ejecuta migraciones en orden
3. Actualiza políticas RLS si es necesario

---

## 🐛 Solución de Problemas

### Error: "RLS policy violation"

- Verifica que el usuario tenga el rol correcto en la tabla `users`
- Revisa las políticas RLS en Supabase Dashboard
- Asegúrate de que las funciones auxiliares (`is_pabellon()`, etc.) estén creadas

### Error: "User not found"

- Verifica que el usuario exista en `auth.users` y `public.users`
- Asegúrate de que el rol esté correctamente asignado

### Error: "Overlapping surgeries"

- El sistema previene solapamientos automáticamente
- Verifica bloqueos activos en el horario seleccionado
- Revisa que no haya cirugías ya programadas

### Error: "Invalid API key"

- Verifica que el `.env` tenga las credenciales correctas
- Asegúrate de usar la clave **anon public**, no la **service_role**
- Reinicia el servidor de desarrollo después de cambiar `.env`

### El proyecto no inicia

```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install

# Verifica versión de Node
node --version  # Debe ser 18 o superior
```

---

## 📝 Notas Importantes

### Crear Médicos desde Pabellón

El sistema requiere usar la API de administración de Supabase para crear usuarios médicos. En producción, considera:

1. Usar `supabase.auth.admin.createUser()` desde el backend
2. O crear un endpoint seguro en Supabase Edge Functions
3. Implementar flujo de invitación por correo

### Variables de Entorno

Nunca commitees el archivo `.env` con credenciales reales. Usa `.env.example` como plantilla.

### Auto-Liberación de Bloqueos

Los bloqueos NO se liberan automáticamente. Debes ejecutar `liberar_bloqueos_expirados()` periódicamente (recomendado: diario via cron job).

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de React](https://react.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de TanStack Query](https://tanstack.com/query/latest)

---

## 📄 Licencia

Este proyecto es privado y confidencial para uso exclusivo de la Clínica Privada Viña del Mar.

---

## 👥 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**Última actualización:** 2026-01-25
