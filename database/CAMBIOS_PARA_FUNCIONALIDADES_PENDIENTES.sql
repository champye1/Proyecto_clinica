-- =====================================================
-- CAMBIOS EN BASE DE DATOS PARA FUNCIONALIDADES PENDIENTES
-- Sistema Clínico Quirúrgico
-- =====================================================

-- =====================================================
-- 1. CANCELACIÓN DE CIRUGÍAS
-- =====================================================
-- Los doctores necesitan poder cancelar sus propias cirugías programadas
-- Agregar política RLS para que doctores puedan actualizar estado de sus cirugías

-- PASO 1: Crear la función current_doctor_id() si no existe
-- Esta función debería existir si ejecutaste rls_policies.sql, pero la creamos por si acaso
CREATE OR REPLACE FUNCTION current_doctor_id()
RETURNS UUID AS $$
DECLARE
    doctor_uuid UUID;
BEGIN
    SELECT id INTO doctor_uuid
    FROM public.doctors
    WHERE user_id = auth.uid()
    AND deleted_at IS NULL;
    
    RETURN doctor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Eliminar política si existe (para evitar errores de duplicado)
DROP POLICY IF EXISTS "Doctor puede cancelar sus propias cirugías programadas" ON public.surgeries;

-- PASO 3: Crear política RLS para cancelación de cirugías
CREATE POLICY "Doctor puede cancelar sus propias cirugías programadas"
    ON public.surgeries FOR UPDATE
    USING (
        doctor_id = current_doctor_id() 
        AND estado = 'programada'
        AND deleted_at IS NULL
    )
    WITH CHECK (
        doctor_id = current_doctor_id()
        AND deleted_at IS NULL
        -- Solo puede cambiar a 'cancelada' (USING ya verifica que estaba 'programada')
        -- En WITH CHECK, las referencias a columnas se refieren automáticamente a los nuevos valores
        AND estado = 'cancelada'
    );

-- =====================================================
-- 2. NOTIFICACIONES EN TIEMPO REAL
-- =====================================================
-- Habilitar Realtime en Supabase Dashboard para las siguientes tablas:
-- 
-- INSTRUCCIONES:
-- 1. Ve al Dashboard de Supabase
-- 2. Navega a Database > Replication
-- 3. Habilita Realtime para las siguientes tablas:
--    - notifications
--    - surgery_requests  
--    - surgeries
--
-- O ejecuta estos comandos desde SQL Editor:

-- Habilitar publicación para Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.surgery_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.surgeries;

-- =====================================================
-- NOTAS ADICIONALES
-- =====================================================
-- 
-- EDICIÓN DE SOLICITUDES:
-- ✅ Ya existe política RLS que permite a doctores actualizar sus solicitudes pendientes
-- ✅ Ya existe política para gestionar insumos de solicitudes pendientes
-- ✅ No se requieren cambios adicionales en BD
--
-- BÚSQUEDA Y FILTROS:
-- ✅ No requiere cambios en BD, solo implementación en frontend
--
-- =====================================================
