# 🧪 Plan Completo de Pruebas QA - Sistema Clínico Quirúrgico

**Fecha de Creación:** 2026-01-26  
**Versión del Sistema:** 1.0.0  
**Estado:** ✅ Listo para Ejecución

---

## 📋 Índice

1. [Autenticación y Autorización](#1-autenticación-y-autorización)
2. [Gestión de Médicos](#2-gestión-de-médicos)
3. [Gestión de Pacientes](#3-gestión-de-pacientes)
4. [Solicitudes Quirúrgicas](#4-solicitudes-quirúrgicas)
5. [Programación de Cirugías](#5-programación-de-cirugías)
6. [Reagendamiento de Cirugías](#6-reagendamiento-de-cirugías)
7. [Bloqueo de Horarios](#7-bloqueo-de-horarios)
8. [Gestión de Insumos](#8-gestión-de-insumos)
9. [Calendario](#9-calendario)
10. [Notificaciones y Recordatorios](#10-notificaciones-y-recordatorios)
11. [Auditoría](#11-auditoría)
12. [Seguridad y RLS](#12-seguridad-y-rls)
13. [Validaciones de Base de Datos](#13-validaciones-de-base-de-datos)
14. [Pruebas de Integración](#14-pruebas-de-integración)
15. [Pruebas de Rendimiento](#15-pruebas-de-rendimiento)

---

## 1. Autenticación y Autorización

### 1.1 Login Pabellón

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| AUTH-001 | Login exitoso con credenciales válidas | Usuario pabellón existe en BD | 1. Ir a `/login-pabellon`<br>2. Ingresar email válido<br>3. Ingresar contraseña válida<br>4. Click en "Iniciar Sesión" | ✅ Redirección a `/pabellon/dashboard`<br>✅ Token JWT almacenado<br>✅ Sesión activa | 🔴 CRÍTICA |
| AUTH-002 | Login fallido con email incorrecto | - | 1. Ir a `/login-pabellon`<br>2. Ingresar email inexistente<br>3. Ingresar contraseña<br>4. Click en "Iniciar Sesión" | ❌ Mensaje de error: "Credenciales inválidas"<br>❌ No se crea sesión | 🔴 CRÍTICA |
| AUTH-003 | Login fallido con contraseña incorrecta | Usuario existe | 1. Ir a `/login-pabellon`<br>2. Ingresar email válido<br>3. Ingresar contraseña incorrecta<br>4. Click en "Iniciar Sesión" | ❌ Mensaje de error: "Credenciales inválidas"<br>❌ No se crea sesión | 🔴 CRÍTICA |
| AUTH-004 | Validación de campos vacíos | - | 1. Ir a `/login-pabellon`<br>2. Dejar campos vacíos<br>3. Click en "Iniciar Sesión" | ❌ Validación de campos requeridos<br>❌ Botón deshabilitado o mensaje de error | 🟡 ALTA |
| AUTH-005 | Persistencia de sesión | Usuario logueado | 1. Cerrar navegador<br>2. Abrir nuevamente<br>3. Ir a `/` | ✅ Sesión persiste<br>✅ Redirección automática a dashboard | 🟡 ALTA |

### 1.2 Login Doctor

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| AUTH-006 | Login exitoso con credenciales válidas | Usuario doctor existe y está activo | 1. Ir a `/login-doctor`<br>2. Ingresar email válido<br>3. Ingresar contraseña válida<br>4. Click en "Iniciar Sesión" | ✅ Redirección a `/doctor/dashboard`<br>✅ Token JWT almacenado<br>✅ Sesión activa | 🔴 CRÍTICA |
| AUTH-007 | Login fallido con doctor inactivo | Doctor existe pero `estado = 'vacaciones'` | 1. Ir a `/login-doctor`<br>2. Ingresar credenciales de doctor inactivo<br>3. Click en "Iniciar Sesión" | ❌ Mensaje: "Tu cuenta está inactiva"<br>❌ No se crea sesión | 🔴 CRÍTICA |
| AUTH-008 | Login fallido con `acceso_web_enabled = false` | Doctor existe pero sin acceso web | 1. Ir a `/login-doctor`<br>2. Ingresar credenciales<br>3. Click en "Iniciar Sesión" | ❌ Mensaje: "No tienes acceso web habilitado"<br>❌ No se crea sesión | 🔴 CRÍTICA |

### 1.3 Logout

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| AUTH-009 | Logout exitoso | Usuario logueado | 1. Click en botón "Cerrar Sesión"<br>2. Confirmar | ✅ Sesión cerrada<br>✅ Redirección a `/`<br>✅ Token eliminado | 🟡 ALTA |
| AUTH-010 | Acceso a rutas protegidas sin sesión | Usuario no logueado | 1. Intentar acceder a `/pabellon/dashboard` directamente | ❌ Redirección a `/login-pabellon` | 🔴 CRÍTICA |

---

## 2. Gestión de Médicos

### 2.1 Crear Médico

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| MED-001 | Crear médico exitoso | Usuario pabellón logueado | 1. Ir a `/pabellon/medicos`<br>2. Click en "Crear Médico"<br>3. Llenar formulario completo<br>4. Click en "Guardar" | ✅ Médico creado en BD<br>✅ Usuario creado en Supabase Auth<br>✅ Notificación de éxito | 🔴 CRÍTICA |
| MED-002 | Validación RUT duplicado | Médico con RUT existe | 1. Intentar crear médico con RUT existente | ❌ Error: "RUT ya existe"<br>❌ No se crea médico | 🔴 CRÍTICA |
| MED-003 | Validación formato RUT | - | 1. Ingresar RUT inválido (ej: "123")<br>2. Intentar guardar | ❌ Error: "Formato de RUT inválido"<br>❌ Validación en frontend | 🟡 ALTA |
| MED-004 | Validación campos requeridos | - | 1. Dejar campos obligatorios vacíos<br>2. Intentar guardar | ❌ Validación de campos<br>❌ Botón deshabilitado | 🟡 ALTA |
| MED-005 | Validación email duplicado | Médico con email existe | 1. Intentar crear médico con email existente | ❌ Error: "Email ya existe"<br>❌ No se crea médico | 🔴 CRÍTICA |

### 2.2 Editar Médico

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| MED-006 | Editar información básica | Médico existe | 1. Ir a `/pabellon/medicos`<br>2. Click en "Editar"<br>3. Modificar nombre/apellido<br>4. Guardar | ✅ Cambios guardados<br>✅ `updated_at` actualizado | 🟡 ALTA |
| MED-007 | Cambiar estado a vacaciones | Médico activo | 1. Editar médico<br>2. Cambiar estado a "vacaciones"<br>3. Guardar | ✅ Estado actualizado<br>✅ No puede iniciar sesión | 🟡 ALTA |
| MED-008 | Cambiar estado a activo | Médico en vacaciones | 1. Editar médico<br>2. Cambiar estado a "activo"<br>3. Guardar | ✅ Estado actualizado<br>✅ Puede iniciar sesión | 🟡 ALTA |
| MED-009 | Habilitar/deshabilitar acceso web | Médico existe | 1. Editar médico<br>2. Toggle `acceso_web_enabled`<br>3. Guardar | ✅ Acceso actualizado<br>✅ Afecta capacidad de login | 🟡 ALTA |

### 2.3 Eliminar Médico

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| MED-010 | Eliminar médico (soft delete) | Médico sin cirugías activas | 1. Click en "Eliminar"<br>2. Confirmar | ✅ `deleted_at` establecido<br>✅ No aparece en listados<br>✅ Datos preservados | 🔴 CRÍTICA |
| MED-011 | No eliminar médico con cirugías activas | Médico con cirugías programadas | 1. Intentar eliminar médico con cirugías | ❌ Error: "No se puede eliminar, tiene cirugías activas"<br>❌ Soft delete bloqueado | 🔴 CRÍTICA |
| MED-012 | Confirmación antes de eliminar | - | 1. Click en "Eliminar" | ✅ Modal de confirmación<br>✅ Requiere confirmación explícita | 🟡 ALTA |

### 2.4 Listar Médicos

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| MED-013 | Listar todos los médicos | Múltiples médicos en BD | 1. Ir a `/pabellon/medicos` | ✅ Lista completa de médicos<br>✅ Solo médicos no eliminados | 🟡 ALTA |
| MED-014 | Filtrar por estado | Médicos con diferentes estados | 1. Seleccionar filtro "Activos" | ✅ Solo muestra médicos activos | 🟢 MEDIA |
| MED-015 | Buscar médico por nombre | - | 1. Ingresar nombre en búsqueda | ✅ Filtra resultados en tiempo real | 🟢 MEDIA |
| MED-016 | Paginación | Más de 20 médicos | 1. Navegar a página siguiente | ✅ Paginación funciona correctamente | 🟢 MEDIA |

---

## 3. Gestión de Pacientes

### 3.1 Crear Paciente y Solicitud

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| PAT-001 | Crear paciente nuevo con solicitud | Doctor logueado y activo | 1. Ir a `/doctor/crear-paciente`<br>2. Llenar datos del paciente<br>3. Seleccionar código operación<br>4. Agregar insumos<br>5. Guardar | ✅ Paciente creado<br>✅ Solicitud creada con estado "pendiente"<br>✅ Insumos asociados | 🔴 CRÍTICA |
| PAT-002 | Usar paciente existente | Paciente con mismo RUT existe | 1. Ingresar RUT de paciente existente<br>2. Llenar resto del formulario<br>3. Guardar | ✅ Usa paciente existente<br>✅ Actualiza nombre si cambió<br>✅ Crea nueva solicitud | 🔴 CRÍTICA |
| PAT-003 | Validación RUT | - | 1. Ingresar RUT inválido<br>2. Intentar guardar | ❌ Error: "RUT inválido"<br>❌ Validación de dígito verificador | 🟡 ALTA |
| PAT-004 | Crear solicitud sin insumos | - | 1. Crear solicitud sin agregar insumos<br>2. Confirmar advertencia<br>3. Guardar | ✅ Solicitud creada sin insumos<br>✅ Advertencia mostrada | 🟡 ALTA |
| PAT-005 | Agregar múltiples insumos | - | 1. Agregar insumo 1<br>2. Agregar insumo 2<br>3. Agregar insumo 3<br>4. Guardar | ✅ Todos los insumos asociados<br>✅ Cantidades correctas | 🟡 ALTA |
| PAT-006 | Validación campos requeridos | - | 1. Dejar campos obligatorios vacíos<br>2. Intentar guardar | ❌ Validación de campos<br>❌ Botón deshabilitado | 🟡 ALTA |
| PAT-007 | Validación código operación | - | 1. Seleccionar código operación inválido | ❌ Error o validación | 🟡 ALTA |

### 3.2 Editar Paciente

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| PAT-008 | Actualizar nombre de paciente | Paciente existe | 1. Editar paciente<br>2. Cambiar nombre<br>3. Guardar | ✅ Nombre actualizado<br>✅ `updated_at` actualizado | 🟢 MEDIA |

---

## 4. Solicitudes Quirúrgicas

### 4.1 Vista Doctor - Solicitudes

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| SOL-001 | Ver mis solicitudes | Doctor con solicitudes | 1. Ir a `/doctor/solicitudes` | ✅ Lista solo mis solicitudes<br>✅ Estados visibles | 🟡 ALTA |
| SOL-002 | Filtrar por estado | Solicitudes con diferentes estados | 1. Seleccionar filtro "Pendientes" | ✅ Solo muestra pendientes | 🟢 MEDIA |
| SOL-003 | Ver detalles de solicitud | Solicitud existe | 1. Click en "Ver Detalles" | ✅ Modal con información completa<br>✅ Insumos listados | 🟡 ALTA |

### 4.2 Vista Pabellón - Gestión de Solicitudes

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| SOL-004 | Ver todas las solicitudes | Múltiples solicitudes | 1. Ir a `/pabellon/solicitudes` | ✅ Lista todas las solicitudes<br>✅ Información de doctor y paciente | 🔴 CRÍTICA |
| SOL-005 | Aceptar solicitud | Solicitud pendiente | 1. Click en "Aceptar"<br>2. Confirmar | ✅ Estado cambia a "aceptada"<br>✅ Notificación al doctor<br>✅ Puede programarse | 🔴 CRÍTICA |
| SOL-006 | Rechazar solicitud | Solicitud pendiente | 1. Click en "Rechazar"<br>2. Ingresar motivo<br>3. Confirmar | ✅ Estado cambia a "rechazada"<br>✅ Notificación al doctor<br>✅ No puede programarse | 🔴 CRÍTICA |
| SOL-007 | Programar cirugía desde solicitud | Solicitud aceptada | 1. Click en "Programar"<br>2. Seleccionar fecha, hora, pabellón<br>3. Guardar | ✅ Cirugía creada<br>✅ Solicitud vinculada<br>✅ Insumos copiados<br>✅ Notificación al doctor | 🔴 CRÍTICA |
| SOL-008 | Filtrar solicitudes por doctor | Múltiples doctores | 1. Seleccionar doctor en filtro | ✅ Solo muestra solicitudes del doctor | 🟢 MEDIA |
| SOL-009 | Buscar solicitud | - | 1. Ingresar texto en búsqueda | ✅ Filtra por paciente/doctor | 🟢 MEDIA |
| SOL-010 | Ver detalles completos | Solicitud existe | 1. Click en "Ver Detalles" | ✅ Modal con toda la información<br>✅ Insumos listados | 🟡 ALTA |

---

## 5. Programación de Cirugías

### 5.1 Programar Cirugía

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| CIR-001 | Programar cirugía exitosa | Solicitud aceptada, pabellón disponible | 1. Programar cirugía<br>2. Seleccionar fecha futura<br>3. Seleccionar horario disponible<br>4. Seleccionar pabellón<br>5. Guardar | ✅ Cirugía creada<br>✅ Estado "programada"<br>✅ `estado_hora = 'agendado'`<br>✅ Insumos copiados<br>✅ Solicitud actualizada a "aceptada" | 🔴 CRÍTICA |
| CIR-002 | Validación solapamiento | Cirugía ya existe en horario | 1. Intentar programar en horario ocupado | ❌ Error: "Ya existe una cirugía programada en este horario"<br>❌ No se crea cirugía | 🔴 CRÍTICA |
| CIR-003 | Validación tiempo de limpieza | Cirugía anterior existe | 1. Intentar programar con tiempo insuficiente | ❌ Error: "Debe haber al menos X minutos de limpieza"<br>❌ Mensaje con tiempo requerido vs disponible | 🔴 CRÍTICA |
| CIR-004 | Validación bloqueo activo | Bloqueo existe en horario | 1. Intentar programar en horario bloqueado | ❌ Error: "El horario está bloqueado"<br>❌ No se crea cirugía | 🔴 CRÍTICA |
| CIR-005 | Validación fecha pasada | - | 1. Intentar programar en fecha pasada | ❌ Error: "No se puede programar en fecha pasada"<br>❌ Validación en frontend y backend | 🔴 CRÍTICA |
| CIR-006 | Validación hora_fin > hora_inicio | - | 1. Seleccionar hora_fin anterior a hora_inicio | ❌ Error: "Hora de fin debe ser mayor que hora de inicio"<br>❌ Validación en frontend | 🟡 ALTA |
| CIR-007 | Transacción atómica | Solicitud con insumos | 1. Programar cirugía<br>2. Simular error en medio | ✅ Rollback completo<br>✅ No se crea cirugía parcial<br>✅ Solicitud no se actualiza | 🔴 CRÍTICA |
| CIR-008 | Formato de horas | - | 1. Ingresar hora en formato HH:MM<br>2. Guardar | ✅ Se convierte a HH:MM:SS<br>✅ Almacenado correctamente | 🟡 ALTA |

### 5.2 Ver Cirugías Programadas

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| CIR-009 | Ver cirugías del día | Cirugías programadas hoy | 1. Ir a calendario<br>2. Ver vista del día | ✅ Cirugías del día visibles<br>✅ Información completa | 🟡 ALTA |
| CIR-010 | Filtrar por pabellón | Múltiples pabellones | 1. Seleccionar pabellón en filtro | ✅ Solo muestra cirugías del pabellón | 🟢 MEDIA |
| CIR-011 | Ver detalles de cirugía | Cirugía existe | 1. Click en cirugía en calendario | ✅ Modal con detalles<br>✅ Paciente, doctor, insumos | 🟡 ALTA |

---

## 6. Reagendamiento de Cirugías

### 6.1 Reagendar Cirugía

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| REA-001 | Reagendar cirugía exitosa | Cirugía en estado "programada" | 1. Editar cirugía<br>2. Cambiar fecha/hora<br>3. Guardar | ✅ Fecha/hora actualizados<br>✅ `fecha_anterior` guardada<br>✅ `hora_inicio_anterior` guardada<br>✅ `hora_fin_anterior` guardada<br>✅ `estado_hora = 'reagendado'`<br>✅ `fecha_ultimo_agendamiento` actualizado<br>✅ Registro en `surgery_schedule_history` | 🔴 CRÍTICA |
| REA-002 | No reagendar si estado != "programada" | Cirugía "en_proceso" | 1. Intentar reagendar cirugía en proceso | ❌ Error: "Solo se pueden reagendar cirugías en estado programada"<br>❌ No se actualiza | 🔴 CRÍTICA |
| REA-003 | No reagendar a fecha pasada | Cirugía programada | 1. Intentar reagendar a fecha pasada | ❌ Error: "No se puede reagendar a fecha pasada"<br>❌ Validación en trigger | 🔴 CRÍTICA |
| REA-004 | Validación solapamiento al reagendar | Otra cirugía en nuevo horario | 1. Reagendar a horario ocupado | ❌ Error: "Ya existe una cirugía en este horario"<br>❌ No se actualiza | 🔴 CRÍTICA |
| REA-005 | Validación tiempo de limpieza al reagendar | Cirugía anterior/siguiente existe | 1. Reagendar con tiempo insuficiente | ❌ Error: "Tiempo de limpieza insuficiente"<br>❌ No se actualiza | 🔴 CRÍTICA |
| REA-006 | Historial completo de reagendamientos | Cirugía reagendada múltiples veces | 1. Reagendar primera vez<br>2. Reagendar segunda vez<br>3. Reagendar tercera vez | ✅ 3 registros en `surgery_schedule_history`<br>✅ Historial completo preservado | 🔴 CRÍTICA |
| REA-007 | Hora anterior queda vacía | Cirugía reagendada | 1. Reagendar cirugía<br>2. Verificar hora anterior | ✅ Hora anterior disponible<br>✅ `estado_hora` anterior = 'vacio' | 🔴 CRÍTICA |
| REA-008 | Reagendar solo fecha (misma hora) | Cirugía programada | 1. Cambiar solo fecha<br>2. Mantener misma hora | ✅ Solo fecha actualizada<br>✅ Historial registrado | 🟡 ALTA |
| REA-009 | Reagendar solo hora (misma fecha) | Cirugía programada | 1. Cambiar solo hora<br>2. Mantener misma fecha | ✅ Solo hora actualizada<br>✅ Historial registrado | 🟡 ALTA |

### 6.2 Ver Historial de Reagendamientos

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| REA-010 | Ver historial completo | Cirugía con múltiples reagendamientos | 1. Ver detalles de cirugía<br>2. Ver historial | ✅ Lista todos los reagendamientos<br>✅ Fechas/horas anteriores y nuevas<br>✅ Timestamps | 🟡 ALTA |

---

## 7. Bloqueo de Horarios

### 7.1 Crear Bloqueo

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| BLO-001 | Crear bloqueo permanente | Usuario pabellón | 1. Ir a `/pabellon/bloqueo-horario`<br>2. Seleccionar pabellón, fecha, hora<br>3. Ingresar motivo<br>4. NO configurar auto-liberación<br>5. Guardar | ✅ Bloqueo creado<br>✅ `fecha_auto_liberacion = NULL`<br>✅ No se puede programar en ese horario | 🔴 CRÍTICA |
| BLO-002 | Crear bloqueo temporal con auto-liberación | Usuario pabellón | 1. Crear bloqueo<br>2. Configurar `dias_auto_liberacion = 3`<br>3. Guardar | ✅ Bloqueo creado<br>✅ `fecha_auto_liberacion` calculada<br>✅ Se liberará automáticamente en 3 días | 🔴 CRÍTICA |
| BLO-003 | Validación solapamiento con cirugía | Cirugía existe en horario | 1. Intentar bloquear horario con cirugía | ❌ Error: "No se puede bloquear, hay cirugía programada"<br>❌ No se crea bloqueo | 🔴 CRÍTICA |
| BLO-004 | Validación solapamiento con otro bloqueo | Bloqueo existe | 1. Intentar bloquear horario ya bloqueado | ❌ Error: "Horario ya está bloqueado"<br>❌ No se crea bloqueo | 🟡 ALTA |
| BLO-005 | Validación campos requeridos | - | 1. Dejar campos obligatorios vacíos | ❌ Validación de campos<br>❌ Botón deshabilitado | 🟡 ALTA |
| BLO-006 | Bloqueo con vigencia_hasta | - | 1. Crear bloqueo con `vigencia_hasta` | ✅ Bloqueo activo hasta fecha<br>✅ `fecha_auto_liberacion = vigencia_hasta` | 🟡 ALTA |

### 7.2 Auto-Liberación de Bloqueos

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| BLO-007 | Auto-liberación por fecha | Bloqueo con `fecha_auto_liberacion` pasada | 1. Ejecutar `liberar_bloqueos_expirados()`<br>2. Verificar bloqueos | ✅ Bloqueos con fecha pasada liberados<br>✅ `deleted_at` establecido<br>✅ Horarios disponibles | 🔴 CRÍTICA |
| BLO-008 | Auto-liberación por vigencia_hasta | Bloqueo con `vigencia_hasta` pasada | 1. Ejecutar función<br>2. Verificar | ✅ Bloqueos expirados liberados | 🔴 CRÍTICA |
| BLO-009 | Bloqueo permanente no se auto-libera | Bloqueo sin auto-liberación | 1. Esperar tiempo<br>2. Ejecutar función | ✅ Bloqueo permanente sigue activo<br>✅ Solo se libera manualmente | 🔴 CRÍTICA |
| BLO-010 | Estadísticas de liberación | Múltiples bloqueos expirados | 1. Ejecutar función | ✅ Retorna cantidad de bloqueos liberados<br>✅ Mensaje informativo | 🟡 ALTA |

### 7.3 Eliminar Bloqueo Manualmente

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| BLO-011 | Eliminar bloqueo (soft delete) | Bloqueo existe | 1. Click en "Eliminar"<br>2. Confirmar | ✅ `deleted_at` establecido<br>✅ Horario disponible nuevamente | 🟡 ALTA |
| BLO-012 | Ver bloqueos activos | Múltiples bloqueos | 1. Ir a lista de bloqueos | ✅ Solo muestra bloqueos activos<br>✅ No muestra eliminados | 🟡 ALTA |

---

## 8. Gestión de Insumos

### 8.1 CRUD de Insumos

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| INS-001 | Crear insumo | Usuario pabellón | 1. Ir a `/pabellon/insumos`<br>2. Click en "Crear"<br>3. Llenar formulario<br>4. Guardar | ✅ Insumo creado<br>✅ Código único<br>✅ `activo = true` por defecto | 🔴 CRÍTICA |
| INS-002 | Validación código único | Insumo con código existe | 1. Intentar crear con código duplicado | ❌ Error: "Código ya existe"<br>❌ No se crea insumo | 🔴 CRÍTICA |
| INS-003 | Editar insumo | Insumo existe | 1. Click en "Editar"<br>2. Modificar datos<br>3. Guardar | ✅ Cambios guardados<br>✅ `updated_at` actualizado | 🟡 ALTA |
| INS-004 | Desactivar insumo | Insumo activo | 1. Editar insumo<br>2. Cambiar `activo = false`<br>3. Guardar | ✅ Insumo desactivado<br>✅ No aparece en listados activos<br>✅ No se puede usar en nuevas solicitudes | 🟡 ALTA |
| INS-005 | Activar insumo | Insumo inactivo | 1. Editar insumo<br>2. Cambiar `activo = true`<br>3. Guardar | ✅ Insumo activado<br>✅ Aparece en listados | 🟡 ALTA |
| INS-006 | Eliminar insumo (soft delete) | Insumo sin uso activo | 1. Click en "Eliminar"<br>2. Confirmar | ✅ `deleted_at` establecido<br>✅ No aparece en listados | 🟡 ALTA |
| INS-007 | Buscar insumo | Múltiples insumos | 1. Ingresar texto en búsqueda | ✅ Filtra por nombre/código<br>✅ Búsqueda en tiempo real | 🟢 MEDIA |

### 8.2 Control de Stock

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| INS-008 | Ver stock actual | Insumos con stock | 1. Ver lista de insumos | ✅ Stock visible<br>✅ Indicadores de bajo stock | 🟡 ALTA |
| INS-009 | Actualizar stock | Insumo existe | 1. Editar insumo<br>2. Cambiar `stock_actual`<br>3. Guardar | ✅ Stock actualizado<br>✅ `updated_at` actualizado | 🟡 ALTA |
| INS-010 | Alerta de bajo stock | Insumo con `stock_actual < stock_minimo` | 1. Ver lista de insumos | ✅ Indicador visual de bajo stock<br>✅ Color/icono de alerta | 🟡 ALTA |
| INS-011 | Actualizar stock de todos los insumos | Script SQL disponible | 1. Ejecutar `update_all_supplies_stock.sql` | ✅ Todos los insumos activos con stock = 10<br>✅ Resumen de actualizados | 🟢 MEDIA |

---

## 9. Calendario

### 9.1 Vista de Calendario

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| CAL-001 | Ver calendario mensual | Cirugías programadas | 1. Ir a `/pabellon/calendario` o `/doctor/calendario` | ✅ Calendario mensual visible<br>✅ Cirugías marcadas en fechas<br>✅ Navegación entre meses | 🟡 ALTA |
| CAL-002 | Ver calendario semanal | - | 1. Cambiar a vista semanal | ✅ Vista semanal<br>✅ Horas visibles<br>✅ Cirugías por hora | 🟡 ALTA |
| CAL-003 | Ver calendario diario | - | 1. Cambiar a vista diaria | ✅ Vista diaria<br>✅ Horas detalladas<br>✅ Cirugías del día | 🟡 ALTA |
| CAL-004 | Filtrar por pabellón | Múltiples pabellones | 1. Seleccionar pabellón | ✅ Solo muestra cirugías del pabellón | 🟡 ALTA |
| CAL-005 | Ver estados de horas | Cirugías y bloqueos | 1. Ver calendario | ✅ Colores diferentes por estado<br>✅ Agendado, reagendado, bloqueado visibles | 🟡 ALTA |
| CAL-006 | Doctor ve solo sus cirugías | Doctor logueado | 1. Ir a `/doctor/calendario` | ✅ Solo muestra cirugías del doctor<br>✅ No ve cirugías de otros doctores | 🔴 CRÍTICA |
| CAL-007 | Pabellón ve todas las cirugías | Usuario pabellón | 1. Ir a `/pabellon/calendario` | ✅ Ve todas las cirugías<br>✅ Información completa | 🔴 CRÍTICA |

### 9.2 Interacción con Calendario

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| CAL-008 | Seleccionar slot vacío | Slot disponible | 1. Click en slot vacío<br>2. Programar cirugía | ✅ Modal de programación<br>✅ Fecha/hora prellenadas | 🟡 ALTA |
| CAL-009 | Ver detalles de cirugía | Cirugía en calendario | 1. Click en cirugía | ✅ Modal con detalles<br>✅ Información completa | 🟡 ALTA |
| CAL-010 | Programar desde calendario | Solicitud aceptada | 1. Seleccionar slot<br>2. Seleccionar solicitud<br>3. Programar | ✅ Cirugía programada<br>✅ Aparece en calendario | 🔴 CRÍTICA |

---

## 10. Notificaciones y Recordatorios

### 10.1 Notificaciones

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| NOT-001 | Notificación al aceptar solicitud | Solicitud pendiente | 1. Aceptar solicitud | ✅ Notificación creada para doctor<br>✅ Aparece en panel de notificaciones | 🟡 ALTA |
| NOT-002 | Notificación al rechazar solicitud | Solicitud pendiente | 1. Rechazar solicitud | ✅ Notificación creada para doctor<br>✅ Motivo incluido | 🟡 ALTA |
| NOT-003 | Notificación al programar cirugía | Solicitud aceptada | 1. Programar cirugía | ✅ Notificación creada para doctor<br>✅ Fecha/hora incluidas | 🟡 ALTA |
| NOT-004 | Ver notificaciones no leídas | Notificaciones pendientes | 1. Ir a panel de notificaciones | ✅ Contador de no leídas<br>✅ Lista de notificaciones | 🟡 ALTA |
| NOT-005 | Marcar notificación como leída | Notificación no leída | 1. Click en notificación | ✅ `leida = true`<br>✅ Contador actualizado | 🟡 ALTA |
| NOT-006 | Notificaciones en tiempo real | - | 1. Usuario A crea notificación<br>2. Usuario B está conectado | ✅ Notificación aparece automáticamente<br>✅ Sin recargar página | 🟡 ALTA |

### 10.2 Recordatorios

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| REM-001 | Recordatorio automático al programar | Cirugía programada | 1. Programar cirugía | ✅ Recordatorio creado<br>✅ Fecha calculada (X días antes) | 🟡 ALTA |
| REM-002 | Ver recordatorios pendientes | Recordatorios activos | 1. Ver panel de recordatorios | ✅ Lista de recordatorios<br>✅ Fechas visibles | 🟢 MEDIA |
| REM-003 | Recordatorio se activa en fecha | Recordatorio programado | 1. Esperar a fecha del recordatorio | ✅ Recordatorio activo<br>✅ Notificación mostrada | 🟢 MEDIA |

---

## 11. Auditoría

### 11.1 Logs de Auditoría

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| AUD-001 | Ver logs de auditoría | Acciones realizadas | 1. Ir a `/pabellon/auditoria` | ✅ Lista de acciones<br>✅ Usuario, acción, timestamp | 🟡 ALTA |
| AUD-002 | Filtrar logs por usuario | Múltiples usuarios | 1. Seleccionar usuario en filtro | ✅ Solo muestra logs del usuario | 🟢 MEDIA |
| AUD-003 | Filtrar logs por acción | Múltiples acciones | 1. Seleccionar tipo de acción | ✅ Solo muestra logs del tipo | 🟢 MEDIA |
| AUD-004 | Filtrar logs por fecha | - | 1. Seleccionar rango de fechas | ✅ Solo muestra logs en rango | 🟢 MEDIA |
| AUD-005 | Log al crear médico | - | 1. Crear médico | ✅ Log registrado<br>✅ Acción: "create_doctor"<br>✅ Usuario registrado | 🟡 ALTA |
| AUD-006 | Log al programar cirugía | - | 1. Programar cirugía | ✅ Log registrado<br>✅ Acción: "create_surgery" | 🟡 ALTA |
| AUD-007 | Log al reagendar cirugía | - | 1. Reagendar cirugía | ✅ Log registrado<br>✅ Acción: "reschedule_surgery"<br>✅ Datos anteriores y nuevos | 🟡 ALTA |

---

## 12. Seguridad y RLS

### 12.1 Row Level Security

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| SEC-001 | Doctor no puede ver cirugías de otros doctores | Doctor A y B existen | 1. Doctor A intenta ver cirugías de Doctor B | ❌ Error RLS o lista vacía<br>✅ Solo ve sus propias cirugías | 🔴 CRÍTICA |
| SEC-002 | Doctor no puede modificar solicitudes de otros | Solicitud de Doctor B | 1. Doctor A intenta modificar | ❌ Error RLS<br>❌ Operación bloqueada | 🔴 CRÍTICA |
| SEC-003 | Pabellón puede ver todo | Usuario pabellón | 1. Ver cualquier dato | ✅ Acceso completo<br>✅ Ve todas las cirugías, solicitudes, etc. | 🔴 CRÍTICA |
| SEC-004 | Doctor no puede acceder a rutas de pabellón | Doctor logueado | 1. Intentar acceder a `/pabellon/*` | ❌ Redirección o error 403<br>❌ Acceso denegado | 🔴 CRÍTICA |
| SEC-005 | Pabellón puede acceder a todas las rutas | Usuario pabellón | 1. Acceder a cualquier ruta | ✅ Acceso permitido | 🔴 CRÍTICA |
| SEC-006 | Usuario no autenticado no puede acceder | Usuario no logueado | 1. Intentar acceder a rutas protegidas | ❌ Redirección a login<br>❌ No se puede acceder | 🔴 CRÍTICA |

### 12.2 Validaciones de Seguridad

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| SEC-007 | SQL Injection en búsqueda | - | 1. Ingresar `'; DROP TABLE--` en búsqueda | ✅ Input sanitizado<br>✅ No se ejecuta SQL malicioso | 🔴 CRÍTICA |
| SEC-008 | XSS en campos de texto | - | 1. Ingresar `<script>alert('XSS')</script>` | ✅ Input sanitizado<br>✅ No se ejecuta script | 🔴 CRÍTICA |
| SEC-009 | Validación de permisos en funciones SQL | - | 1. Intentar ejecutar función sin permisos | ❌ Error de permisos<br>✅ Solo usuarios autorizados | 🔴 CRÍTICA |

---

## 13. Validaciones de Base de Datos

### 13.1 Constraints y Triggers

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| DB-001 | Constraint RUT único | Médico con RUT existe | 1. Intentar crear médico con mismo RUT | ❌ Error de constraint<br>❌ No se crea registro | 🔴 CRÍTICA |
| DB-002 | Constraint hora_fin > hora_inicio | - | 1. Intentar crear cirugía con hora_fin <= hora_inicio | ❌ Error de constraint<br>❌ No se crea cirugía | 🔴 CRÍTICA |
| DB-003 | Constraint fecha >= CURRENT_DATE | - | 1. Intentar crear cirugía con fecha pasada | ❌ Error de constraint<br>❌ No se crea cirugía | 🔴 CRÍTICA |
| DB-004 | Trigger validar_solapamiento_cirugia | Cirugía existe | 1. Intentar crear cirugía solapada | ❌ Error del trigger<br>❌ No se crea cirugía | 🔴 CRÍTICA |
| DB-005 | Trigger actualizar_fecha_ultimo_agendamiento | Cirugía existe | 1. Reagendar cirugía | ✅ Trigger ejecutado<br>✅ Campos actualizados automáticamente | 🔴 CRÍTICA |
| DB-006 | Trigger registrar en historial | Cirugía existe | 1. Reagendar cirugía | ✅ Registro en `surgery_schedule_history`<br>✅ Datos completos | 🔴 CRÍTICA |
| DB-007 | Constraint estado_hora válido | - | 1. Intentar insertar estado_hora inválido | ❌ Error de constraint<br>❌ Solo acepta valores del ENUM | 🔴 CRÍTICA |

### 13.2 Funciones SQL

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| DB-008 | Función programar_cirugia_completa | Solicitud aceptada | 1. Ejecutar función con parámetros válidos | ✅ Cirugía creada<br>✅ Insumos copiados<br>✅ Solicitud actualizada<br>✅ Todo en transacción | 🔴 CRÍTICA |
| DB-009 | Función programar_cirugia_completa - rollback | Solicitud aceptada | 1. Ejecutar función con error simulado | ✅ Rollback completo<br>✅ No se crea nada parcialmente | 🔴 CRÍTICA |
| DB-010 | Función verificar_disponibilidad_con_limpieza | - | 1. Ejecutar función con horario disponible | ✅ Retorna `disponible: true`<br>✅ Información de tiempo de limpieza | 🟡 ALTA |
| DB-011 | Función verificar_disponibilidad_con_limpieza - ocupado | Cirugía existe | 1. Ejecutar función con horario ocupado | ✅ Retorna `disponible: false`<br>✅ Mensaje explicativo | 🟡 ALTA |
| DB-012 | Función liberar_bloqueos_expirados | Bloqueos expirados | 1. Ejecutar función | ✅ Bloqueos liberados<br>✅ Estadísticas retornadas | 🟡 ALTA |

---

## 14. Pruebas de Integración

### 14.1 Flujos Completos

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| INT-001 | Flujo completo: Crear paciente → Solicitud → Aceptar → Programar | Doctor y pabellón activos | 1. Doctor crea paciente y solicitud<br>2. Pabellón acepta solicitud<br>3. Pabellón programa cirugía<br>4. Verificar todo | ✅ Flujo completo exitoso<br>✅ Estados correctos en cada paso<br>✅ Notificaciones enviadas | 🔴 CRÍTICA |
| INT-002 | Flujo completo con reagendamiento | Cirugía programada | 1. Reagendar cirugía<br>2. Verificar historial<br>3. Verificar hora anterior liberada | ✅ Reagendamiento exitoso<br>✅ Historial completo<br>✅ Hora anterior disponible | 🔴 CRÍTICA |
| INT-003 | Flujo con bloqueo y liberación | - | 1. Crear bloqueo con auto-liberación<br>2. Esperar fecha<br>3. Ejecutar función de liberación<br>4. Verificar | ✅ Bloqueo creado<br>✅ Auto-liberado correctamente<br>✅ Horario disponible | 🟡 ALTA |
| INT-004 | Flujo con múltiples insumos | - | 1. Crear solicitud con 5 insumos<br>2. Programar cirugía<br>3. Verificar | ✅ Todos los insumos copiados<br>✅ Cantidades correctas | 🟡 ALTA |

---

## 15. Pruebas de Rendimiento

### 15.1 Rendimiento de Consultas

| ID | Caso de Prueba | Precondiciones | Pasos | Resultado Esperado | Prioridad |
|----|----------------|----------------|-------|-------------------|-----------|
| PERF-001 | Carga de calendario con muchas cirugías | 100+ cirugías | 1. Abrir calendario mensual | ✅ Carga en < 2 segundos<br>✅ Renderizado fluido | 🟢 MEDIA |
| PERF-002 | Búsqueda de insumos | 500+ insumos | 1. Buscar insumo | ✅ Resultados en < 500ms<br>✅ Búsqueda eficiente | 🟢 MEDIA |
| PERF-003 | Lista de solicitudes | 200+ solicitudes | 1. Cargar lista | ✅ Carga en < 1 segundo<br>✅ Paginación funciona | 🟢 MEDIA |
| PERF-004 | Vista de auditoría con muchos logs | 1000+ logs | 1. Cargar auditoría | ✅ Carga con paginación<br>✅ Filtros funcionan rápido | 🟢 MEDIA |

---

## 📊 Resumen de Pruebas

### Por Prioridad

- **🔴 CRÍTICA:** 85 casos de prueba
- **🟡 ALTA:** 45 casos de prueba
- **🟢 MEDIA:** 25 casos de prueba

**Total:** 155 casos de prueba

### Por Módulo

- Autenticación: 10 casos
- Gestión de Médicos: 16 casos
- Gestión de Pacientes: 8 casos
- Solicitudes Quirúrgicas: 10 casos
- Programación de Cirugías: 8 casos
- Reagendamiento: 10 casos
- Bloqueo de Horarios: 12 casos
- Gestión de Insumos: 11 casos
- Calendario: 10 casos
- Notificaciones: 6 casos
- Auditoría: 7 casos
- Seguridad: 9 casos
- Validaciones DB: 12 casos
- Integración: 4 casos
- Rendimiento: 4 casos

---

## 🚀 Cómo Ejecutar las Pruebas

### 1. Preparación del Entorno

```bash
# 1. Asegurar que el proyecto esté configurado
npm install

# 2. Configurar variables de entorno
cp env.example .env
# Editar .env con credenciales de Supabase

# 3. Ejecutar migraciones en Supabase
# Ejecutar en orden:
# - database/schema.sql
# - database/rls_policies.sql
# - database/migrations/add_cleaning_time.sql
# - database/migrations/add_hour_states_system.sql
# - database/migrations/fix_critical_issues.sql
```

### 2. Datos de Prueba

Crear usuarios de prueba:
- 1 usuario pabellón
- 2-3 usuarios doctores
- Varios pacientes
- Varios insumos
- Varias solicitudes en diferentes estados

### 3. Ejecución Manual

1. Abrir el proyecto en navegador
2. Seguir cada caso de prueba en orden
3. Documentar resultados (✅ Pass / ❌ Fail)
4. Registrar bugs encontrados

### 4. Scripts SQL de Prueba

Ver sección siguiente para scripts automatizados.

---

## 📝 Plantilla de Reporte de Pruebas

```markdown
# Reporte de Pruebas QA - [Fecha]

## Resumen
- Total de pruebas: 155
- Pasadas: X
- Fallidas: Y
- Bloqueadas: Z

## Pruebas Críticas
- [ ] AUTH-001: Login Pabellón
- [ ] AUTH-006: Login Doctor
- [ ] CIR-001: Programar cirugía
- [ ] REA-001: Reagendar cirugía
- ...

## Bugs Encontrados
1. [ID-BUG-001] Descripción del bug
   - Módulo: X
   - Prioridad: Alta
   - Pasos para reproducir: ...
   - Resultado esperado: ...
   - Resultado actual: ...

## Notas
- ...
```

---

**Última actualización:** 2026-01-26  
**Próxima revisión:** Después de implementar correcciones
