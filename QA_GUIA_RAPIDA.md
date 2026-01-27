# 🚀 Guía Rápida de Ejecución de Pruebas QA

**Fecha:** 2026-01-26  
**Versión:** 1.0.0

---

## 📋 Checklist Pre-Pruebas

Antes de comenzar, asegúrate de tener:

- [ ] Proyecto configurado y funcionando
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Base de datos con migraciones ejecutadas
- [ ] Usuarios de prueba creados:
  - [ ] 1 usuario pabellón
  - [ ] 2-3 usuarios doctores
- [ ] Datos de prueba básicos:
  - [ ] Al menos 2 pabellones activos
  - [ ] Al menos 5 insumos activos
  - [ ] Algunos pacientes creados

---

## 🎯 Pruebas Críticas (Prioridad Máxima)

Estas pruebas **DEBEN** pasar antes de considerar el sistema listo:

### Autenticación
- [ ] **AUTH-001**: Login Pabellón exitoso
- [ ] **AUTH-006**: Login Doctor exitoso
- [ ] **AUTH-007**: Login Doctor inactivo rechazado
- [ ] **AUTH-010**: Rutas protegidas requieren autenticación

### Programación de Cirugías
- [ ] **CIR-001**: Programar cirugía exitosa
- [ ] **CIR-002**: Validación de solapamiento
- [ ] **CIR-003**: Validación de tiempo de limpieza
- [ ] **CIR-004**: Validación de bloqueos
- [ ] **CIR-007**: Transacción atómica

### Reagendamiento
- [ ] **REA-001**: Reagendar cirugía exitosa
- [ ] **REA-002**: No reagendar si estado != "programada"
- [ ] **REA-003**: No reagendar a fecha pasada
- [ ] **REA-004**: Validación de solapamiento al reagendar
- [ ] **REA-006**: Historial completo de reagendamientos

### Seguridad
- [ ] **SEC-001**: Doctor no ve cirugías de otros
- [ ] **SEC-002**: Doctor no modifica solicitudes de otros
- [ ] **SEC-003**: Pabellón puede ver todo
- [ ] **SEC-004**: Doctor no accede a rutas de pabellón

### Base de Datos
- [ ] **DB-001**: Constraint RUT único
- [ ] **DB-002**: Constraint hora_fin > hora_inicio
- [ ] **DB-003**: Constraint fecha >= CURRENT_DATE
- [ ] **DB-004**: Trigger validar_solapamiento
- [ ] **DB-005**: Trigger actualizar_fecha_ultimo_agendamiento
- [ ] **DB-008**: Función programar_cirugia_completa

---

## 🔧 Ejecutar Pruebas SQL Automatizadas

### Paso 1: Conectar a Supabase

1. Ve a tu proyecto en Supabase
2. Abre **SQL Editor**
3. Copia y pega cada bloque de prueba desde `database/utilities/qa_test_scripts.sql`

### Paso 2: Ejecutar Pruebas Individuales

Cada prueba está en un bloque `BEGIN; ... ROLLBACK;`. Ejecuta una a la vez:

```sql
-- Ejemplo: TEST-001
BEGIN;
DO $$
BEGIN
    -- Código de la prueba
    ...
END $$;
ROLLBACK;
```

### Paso 3: Ver Resultados

Busca mensajes `✅ TEST-XXX PASADO` o `❌ TEST FALLIDO` en la consola.

---

## 📝 Plantilla de Reporte Rápido

```markdown
# Reporte de Pruebas QA - [Fecha]

## Ambiente
- Base de datos: [Supabase Project]
- Usuarios de prueba: [X pabellón, Y doctores]

## Pruebas Críticas
- [ ] AUTH-001: Login Pabellón
- [ ] AUTH-006: Login Doctor
- [ ] CIR-001: Programar cirugía
- [ ] REA-001: Reagendar cirugía
- [ ] SEC-001: RLS Doctor
- [ ] DB-008: Función programar_cirugia_completa

## Resultados
- Pasadas: X/6
- Fallidas: Y/6

## Bugs Encontrados
1. [ID] Descripción breve
   - Módulo: X
   - Prioridad: Alta/Media/Baja

## Notas
- ...
```

---

## 🐛 Cómo Reportar Bugs

Para cada bug encontrado, documenta:

1. **ID del caso de prueba** (ej: CIR-002)
2. **Descripción breve** del problema
3. **Módulo afectado** (ej: Programación de Cirugías)
4. **Prioridad** (🔴 Crítica / 🟡 Alta / 🟢 Media)
5. **Pasos para reproducir**:
   - Paso 1: ...
   - Paso 2: ...
   - Paso 3: ...
6. **Resultado esperado**: ...
7. **Resultado actual**: ...
8. **Capturas de pantalla** (si aplica)
9. **Logs de consola** (si hay errores)

---

## ⚡ Pruebas Rápidas (5 minutos)

Si tienes poco tiempo, ejecuta estas pruebas esenciales:

1. **Login Pabellón** → Debe funcionar
2. **Login Doctor** → Debe funcionar
3. **Crear solicitud** (como doctor) → Debe crear
4. **Programar cirugía** (como pabellón) → Debe programar
5. **Reagendar cirugía** → Debe reagendar y guardar historial
6. **Verificar RLS** → Doctor no debe ver cirugías de otros

Si todas pasan, el sistema tiene funcionalidad básica operativa.

---

## 📊 Métricas de Éxito

### Mínimo Aceptable
- ✅ 90% de pruebas críticas pasando
- ✅ 0 bugs críticos sin resolver
- ✅ Todas las pruebas de seguridad pasando

### Ideal
- ✅ 100% de pruebas críticas pasando
- ✅ 95%+ de todas las pruebas pasando
- ✅ 0 bugs sin resolver

---

## 🔄 Flujo de Pruebas Recomendado

1. **Día 1**: Autenticación + Seguridad (AUTH, SEC)
2. **Día 2**: Gestión de Médicos y Pacientes (MED, PAT)
3. **Día 3**: Solicitudes y Programación (SOL, CIR)
4. **Día 4**: Reagendamiento y Bloqueos (REA, BLO)
5. **Día 5**: Insumos, Calendario, Notificaciones (INS, CAL, NOT)
6. **Día 6**: Auditoría, Integración, Rendimiento (AUD, INT, PERF)

---

## 📚 Documentación Relacionada

- **Plan Completo**: `QA_PLAN_COMPLETO.md` (155 casos de prueba)
- **Scripts SQL**: `database/utilities/qa_test_scripts.sql`
- **Correcciones Implementadas**: `RESUMEN_CORRECCIONES_IMPLEMENTADAS.md`

---

## ✅ Checklist Final

Antes de considerar las pruebas completas:

- [ ] Todas las pruebas críticas ejecutadas
- [ ] Todos los bugs documentados
- [ ] Reporte de pruebas generado
- [ ] Bugs críticos resueltos
- [ ] Pruebas de regresión ejecutadas
- [ ] Documentación actualizada

---

**Última actualización:** 2026-01-26
