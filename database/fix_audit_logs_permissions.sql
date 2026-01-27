-- =====================================================
-- SCRIPT PARA CORREGIR PERMISOS DE AUDIT_LOGS
-- Soluciona el error "permission denied for table audit_logs"
-- al eliminar usuarios
-- =====================================================

-- =====================================================
-- PASO 1: Modificar la función de auditoría para que sea SECURITY DEFINER
-- Esto permite que la función ejecute con permisos de superusuario
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER 
SECURITY DEFINER -- Permite ejecutar con permisos del creador de la función
SET search_path = public -- Asegura que use el esquema correcto
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Intentar obtener el user_id del contexto actual
    -- Puede ser NULL cuando se elimina desde dashboard/service_role
    current_user_id := auth.uid();
    
    -- Si es NULL (eliminación desde dashboard), usar NULL para user_id
    -- La tabla audit_logs permite NULL en user_id (ON DELETE SET NULL)
    
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, accion, tabla_afectada, registro_id, datos_anteriores)
        VALUES (
            current_user_id, -- Puede ser NULL si se elimina desde dashboard
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
        VALUES (
            current_user_id,
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, accion, tabla_afectada, registro_id, datos_nuevos)
        VALUES (
            current_user_id,
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- =====================================================
-- PASO 2: Asegurar que la función tenga permisos para INSERT en audit_logs
-- =====================================================

-- Otorgar permisos explícitos a la función (aunque SECURITY DEFINER debería ser suficiente)
GRANT INSERT ON public.audit_logs TO postgres, anon, authenticated, service_role;

-- =====================================================
-- PASO 3: Verificar que la política RLS permita la inserción desde triggers
-- =====================================================

-- La política "Sistema puede crear logs de auditoría" ya existe y permite INSERT con CHECK (true)
-- Pero vamos a asegurarnos de que esté correctamente configurada

DROP POLICY IF EXISTS "Sistema puede crear logs de auditoría" ON public.audit_logs;

CREATE POLICY "Sistema puede crear logs de auditoría"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- PASO 4: Verificar que los triggers estén correctamente configurados
-- =====================================================

-- Los triggers ya deberían estar creados, pero verificamos que usen la función actualizada
-- No necesitamos recrearlos, solo se actualizará la función que referencian

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la función existe y tiene SECURITY DEFINER
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'registrar_auditoria';

-- Verificar que la política existe
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'audit_logs';
