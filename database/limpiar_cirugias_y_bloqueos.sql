-- =====================================================
-- LIMPIAR TODAS LAS CIRUGÍAS Y BLOQUEOS
-- =====================================================
-- Este script elimina todas las cirugías programadas y bloqueos
-- para dejar los pabellones completamente disponibles
-- ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE

-- Verificar qué se va a eliminar
SELECT 
    'Cirugías programadas' as tipo,
    COUNT(*) as total
FROM public.surgeries
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'Bloqueos de horario',
    COUNT(*)
FROM public.schedule_blocks
WHERE deleted_at IS NULL;

-- =====================================================
-- ELIMINAR DATOS
-- =====================================================

-- 1. Eliminar insumos de cirugías
DELETE FROM public.surgery_supplies;

-- 2. Eliminar todas las cirugías programadas
DELETE FROM public.surgeries;

-- 3. Eliminar todos los bloqueos de horario
DELETE FROM public.schedule_blocks;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todo se eliminó correctamente
SELECT 
    'Cirugías restantes' as verificación,
    COUNT(*) as total
FROM public.surgeries
UNION ALL
SELECT 
    'Bloqueos restantes',
    COUNT(*)
FROM public.schedule_blocks;

-- Ver estado de los pabellones
SELECT 
    id,
    nombre,
    activo,
    created_at
FROM public.operating_rooms 
WHERE deleted_at IS NULL 
ORDER BY nombre;
