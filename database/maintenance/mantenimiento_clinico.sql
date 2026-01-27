-- =====================================================
-- SCRIPTS DE MANTENIMIENTO CLÍNICO
-- Agrupa varios SQL pequeños de ajustes y limpieza
-- =====================================================

-- =====================================================
-- 1) AGREGAR USERNAME A USERS
--    (agregar_username_a_users.sql)
-- =====================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username 
ON public.users(username) 
WHERE username IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN public.users.username IS 'Nombre de usuario para login alternativo al email';


-- =====================================================
-- 2) CORREGIR PERMISOS DE AUDITORÍA
--    (fix_audit_logs_permissions.sql)
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, accion, tabla_afectada, registro_id, datos_anteriores)
        VALUES (
            current_user_id,
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

GRANT INSERT ON public.audit_logs TO postgres, anon, authenticated, service_role;


-- =====================================================
-- 3) PERMITIR MÉDICOS SIN USER_ID (TEMPORAL)
--    (fix_doctors_user_id.sql)
-- =====================================================

ALTER TABLE public.doctors 
ALTER COLUMN user_id DROP NOT NULL;

-- Después de crear el usuario en Auth, asignar manualmente:
-- UPDATE public.doctors 
-- SET user_id = 'USER_UID_AQUI' 
-- WHERE email = 'doctor@clinica.cl';


-- =====================================================
-- 4) LIMPIAR CIRUGÍAS Y BLOQUEOS (RESET DE AGENDA)
--    (limpiar_cirugias_y_bloqueos.sql)
-- =====================================================

-- ⚠️ ADVERTENCIA: elimina todas las cirugías y bloqueos

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

-- Eliminar insumos de cirugías
DELETE FROM public.surgery_supplies;

-- Eliminar todas las cirugías programadas
DELETE FROM public.surgeries;

-- Eliminar todos los bloqueos de horario
DELETE FROM public.schedule_blocks;

-- Verificación rápida
SELECT 
    'Cirugías restantes' as verificación,
    COUNT(*) as total
FROM public.surgeries
UNION ALL
SELECT 
    'Bloqueos restantes',
    COUNT(*)
FROM public.schedule_blocks;


-- =====================================================
-- 5) UTILIDADES - VER MÉDICOS
--    (verificar_medicos.sql)
-- =====================================================

SELECT 
  id,
  nombre,
  apellido,
  rut,
  email,
  user_id,
  especialidad,
  estado
FROM public.doctors
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

