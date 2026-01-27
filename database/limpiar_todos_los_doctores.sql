-- =====================================================
-- SCRIPT PARA LIMPIAR TODOS LOS DOCTORES DE LA BASE DE DATOS
-- ⚠️ ADVERTENCIA: ESTO ELIMINARÁ TODOS LOS DOCTORES Y SUS DATOS RELACIONADOS
-- =====================================================
-- 
-- Este script elimina:
-- 1. Todos los pacientes asociados a doctores
-- 2. Todas las solicitudes quirúrgicas
-- 3. Todas las cirugías programadas
-- 4. Todos los bloqueos de horario de doctores
-- 5. Todos los registros de doctores
-- 6. Todos los usuarios con rol 'doctor' (opcional)
--
-- ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
-- =====================================================

-- =====================================================
-- PASO 1: Verificar qué se va a eliminar
-- =====================================================

-- Ver resumen de datos a eliminar
SELECT 
    'Doctores' as tabla,
    COUNT(*) as total_registros
FROM public.doctors
UNION ALL
SELECT 
    'Pacientes',
    COUNT(*)
FROM public.patients
UNION ALL
SELECT 
    'Solicitudes Quirúrgicas',
    COUNT(*)
FROM public.surgery_requests
UNION ALL
SELECT 
    'Cirugías Programadas',
    COUNT(*)
FROM public.surgeries
UNION ALL
SELECT 
    'Bloqueos de Horario (doctores)',
    COUNT(*)
FROM public.schedule_blocks
WHERE doctor_id IS NOT NULL
UNION ALL
SELECT 
    'Usuarios con rol doctor',
    COUNT(*)
FROM public.users
WHERE role = 'doctor';

-- =====================================================
-- PASO 2: ELIMINAR DATOS RELACIONADOS (en orden correcto)
-- =====================================================

-- 2.1: Eliminar insumos de cirugías (tabla surgery_supplies)
DELETE FROM public.surgery_supplies;

-- 2.2: Eliminar cirugías programadas
DELETE FROM public.surgeries;

-- 2.3: Eliminar insumos de solicitudes (tabla surgery_request_supplies)
DELETE FROM public.surgery_request_supplies;

-- 2.4: Eliminar solicitudes quirúrgicas
DELETE FROM public.surgery_requests;

-- 2.5: Eliminar pacientes
DELETE FROM public.patients;

-- 2.6: Eliminar bloqueos de horario de doctores
DELETE FROM public.schedule_blocks
WHERE doctor_id IS NOT NULL;

-- 2.7: Eliminar recordatorios y notificaciones de doctores
DELETE FROM public.reminders
WHERE user_id IN (SELECT id FROM public.users WHERE role = 'doctor');

DELETE FROM public.notifications
WHERE user_id IN (SELECT id FROM public.users WHERE role = 'doctor');

-- =====================================================
-- PASO 3: ELIMINAR DOCTORES
-- =====================================================

DELETE FROM public.doctors;

-- =====================================================
-- PASO 4: ELIMINAR USUARIOS CON ROL DOCTOR (OPCIONAL)
-- =====================================================
-- Descomenta las siguientes líneas si también quieres eliminar los usuarios de auth

-- OPCIÓN A: Solo eliminar de la tabla users (mantiene auth.users)
DELETE FROM public.users
WHERE role = 'doctor';

-- OPCIÓN B: Eliminar completamente de auth.users (también elimina de users por CASCADE)
-- ⚠️ Descomenta solo si quieres eliminar los usuarios de autenticación también
-- DELETE FROM auth.users
-- WHERE id IN (
--     SELECT id FROM public.users WHERE role = 'doctor'
-- );

-- =====================================================
-- PASO 5: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todo se eliminó correctamente
SELECT 
    'Doctores restantes' as verificación,
    COUNT(*) as total
FROM public.doctors
UNION ALL
SELECT 
    'Pacientes restantes',
    COUNT(*)
FROM public.patients
UNION ALL
SELECT 
    'Solicitudes restantes',
    COUNT(*)
FROM public.surgery_requests
UNION ALL
SELECT 
    'Cirugías restantes',
    COUNT(*)
FROM public.surgeries
UNION ALL
SELECT 
    'Usuarios doctor restantes',
    COUNT(*)
FROM public.users
WHERE role = 'doctor';

-- Ver todos los usuarios restantes
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users
ORDER BY created_at DESC;
