-- =====================================================
-- SCRIPT COMPLETO PARA ELIMINAR USUARIOS
-- Incluye la corrección de permisos y la eliminación
-- Clínica Privada Viña del Mar
-- =====================================================
-- 
-- Este script hace dos cosas:
-- 1. Corrige los permisos de audit_logs (necesario para evitar errores)
-- 2. Elimina los usuarios especificados
--
-- INSTRUCCIONES:
-- 1. Modifica los UUIDs en la sección "ELIMINAR USUARIOS" según tus necesidades
-- 2. Ejecuta TODO el script en el SQL Editor de Supabase
-- 3. ADVERTENCIA: La eliminación es permanente y no se puede deshacer
-- =====================================================

-- =====================================================
-- PARTE 1: CORREGIR PERMISOS DE AUDIT_LOGS
-- =====================================================

-- Modificar la función de auditoría para que tenga permisos correctos
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

-- Asegurar que la política RLS permita la inserción desde triggers
DROP POLICY IF EXISTS "Sistema puede crear logs de auditoría" ON public.audit_logs;

CREATE POLICY "Sistema puede crear logs de auditoría"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- PARTE 2: ELIMINAR USUARIOS
-- =====================================================
-- MODIFICA LOS UUIDs AQUÍ SEGÚN TUS NECESIDADES

-- Opción 1: Eliminar usuarios específicos por UUID (descomenta y modifica)
DELETE FROM auth.users 
WHERE id IN (
  'f0351fea-5f06-453b-8689-39363598f724',  -- estetest@gmail.com
  '2580477d-72cf-47bf-9af2-b2f6e7d49452',  -- juan.perez@example.com
  'd67b9659-a560-4ada-83ba-907160a088df'   -- pabellontest01@gmail.com
);

-- Opción 2: Eliminar por email (descomenta y modifica si prefieres)
-- DELETE FROM auth.users 
-- WHERE email IN (
--   'estetest@gmail.com',
--   'juan.perez@example.com',
--   'pabellontest01@gmail.com'
-- );

-- =====================================================
-- VERIFICACIÓN POST-ELIMINACIÓN
-- =====================================================

-- Ver usuarios restantes
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
