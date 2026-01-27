-- =====================================================
-- HACER user_id NULLABLE TEMPORALMENTE EN DOCTORS
-- =====================================================
-- 
-- Este script permite crear médicos sin usuario de Auth primero
-- Luego puedes asignar el user_id manualmente después de crear el usuario

-- Paso 1: Hacer user_id nullable
ALTER TABLE public.doctors 
ALTER COLUMN user_id DROP NOT NULL;

-- Paso 2: Remover la restricción UNIQUE temporalmente (opcional)
-- Si quieres permitir múltiples médicos sin user_id temporalmente
-- ALTER TABLE public.doctors DROP CONSTRAINT doctors_user_id_key;

-- NOTA: Después de crear el usuario en Auth, actualiza el user_id:
-- UPDATE public.doctors 
-- SET user_id = 'USER_UID_AQUI' 
-- WHERE email = 'doctor@clinica.cl';
