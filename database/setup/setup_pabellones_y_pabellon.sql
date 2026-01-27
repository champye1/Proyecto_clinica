-- =====================================================
-- SETUP BÁSICO DE PABELLONES Y USUARIO DE PABELLÓN
-- Agrupa varios scripts antiguos en uno solo, más legible
-- =====================================================

-- =====================================================
-- 1) PABELLONES BÁSICOS
--    (Contenido original de crear_pabellones_basicos.sql)
-- =====================================================

-- Este script crea los 4 pabellones básicos necesarios
-- para el funcionamiento del sistema

-- Insertar los 4 pabellones si no existen
INSERT INTO public.operating_rooms (id, nombre, camillas_disponibles, activo, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Pabellón 1', 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'Pabellón 2', 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'Pabellón 3', 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'Pabellón 4', 1, true, NOW(), NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT id, nombre, activo, created_at 
FROM public.operating_rooms 
WHERE deleted_at IS NULL 
ORDER BY nombre;


-- =====================================================
-- 2) USUARIO DE PABELLÓN (PLANTILLA GENERAL)
--    (Basado en crear_usuario_pabellon.sql)
-- =====================================================

-- INSTRUCCIONES:
-- 1. Crea primero el usuario en Supabase Auth (Authentication > Users):
--    - Email clínico (por ejemplo: pabellon@clinica.cl)
--    - Password segura
--    - Marca "Auto Confirm User"
-- 2. Copia el UUID del usuario creado.
-- 3. Ejecuta el siguiente bloque reemplazando los valores:

-- EJEMPLO (EDITAR ANTES DE EJECUTAR):
-- INSERT INTO public.users (id, email, role)
-- VALUES (
--   'UUID_DEL_USUARIO_EN_AUTH_AQUI',
--   'pabellon@clinica.cl',
--   'pabellon'
-- )
-- ON CONFLICT (id)
-- DO UPDATE SET
--   role = 'pabellon',
--   email = EXCLUDED.email;


-- =====================================================
-- 3) VERIFICAR Y CORREGIR USUARIO PABELLÓN
--    (Resumen práctico de verificar_y_crear_pabellon.sql
--     y solucionar_login_pabellon.sql)
-- =====================================================

-- Reemplaza estos valores por los de tu entorno:
--   UUID: 30300f38-dd15-4d8f-a319-3403d7bb762c
--   EMAIL: pabellontest@gmail.com

-- BLOQUE ÚNICO: crear o corregir usuario con rol 'pabellon'
INSERT INTO public.users (id, email, role)
VALUES (
    '30300f38-dd15-4d8f-a319-3403d7bb762c',  -- UUID del usuario en auth.users
    'pabellontest@gmail.com',                -- Email del usuario
    'pabellon'                               -- Rol: debe ser 'pabellon'
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'pabellon',
    email = EXCLUDED.email;

-- Verificación rápida
SELECT 
    u.id,
    u.email,
    u.role,
    CASE 
        WHEN u.role = 'pabellon' THEN '✅ Configuración correcta'
        ELSE '❌ Rol incorrecto'
    END as estado
FROM public.users u
WHERE u.id = '30300f38-dd15-4d8f-a319-3403d7bb762c'
   OR u.email = 'pabellontest@gmail.com';

