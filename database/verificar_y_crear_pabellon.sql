-- =====================================================
-- SCRIPT PARA VERIFICAR Y CREAR USUARIO PABELLÓN
-- Soluciona el problema de "no me deja ingresar como pabellon"
-- =====================================================
-- 
-- Este script:
-- 1. Verifica si el usuario existe en auth.users
-- 2. Verifica si existe en la tabla users con rol 'pabellon'
-- 3. Crea el registro en users si falta
-- 4. Corrige el rol si está incorrecto
-- =====================================================

-- =====================================================
-- PASO 1: Verificar usuarios existentes
-- =====================================================

-- Ver todos los usuarios en auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Ver usuarios en la tabla users
SELECT 
    id,
    email,
    role,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- =====================================================
-- PASO 2: Verificar usuario específico
-- =====================================================
-- Reemplaza el UUID o email según tu caso

-- Opción A: Verificar por UUID (usa el UUID de tu usuario)
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    u.id as users_id,
    u.email as users_email,
    u.role as users_role
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.id = '30300f38-dd15-4d8f-a319-3403d7bb762c';  -- Reemplaza con tu UUID

-- Opción B: Verificar por email
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    u.id as users_id,
    u.email as users_email,
    u.role as users_role
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email = 'pabellontest@gmail.com';  -- Reemplaza con tu email

-- =====================================================
-- PASO 3: Crear o corregir usuario en tabla users
-- =====================================================

-- OPCIÓN 1: Crear usuario si no existe (por UUID)
-- Reemplaza el UUID y email según tu caso
INSERT INTO public.users (id, email, role)
VALUES (
    '30300f38-dd15-4d8f-a319-3403d7bb762c',  -- UUID del usuario en auth.users
    'pabellontest@gmail.com',                 -- Email del usuario
    'pabellon'                                -- Rol: debe ser 'pabellon'
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'pabellon',  -- Asegurar que el rol sea 'pabellon'
    email = EXCLUDED.email;  -- Actualizar email si cambió

-- OPCIÓN 2: Crear usuario si no existe (por email - requiere buscar UUID primero)
-- Primero ejecuta esto para obtener el UUID:
-- SELECT id, email FROM auth.users WHERE email = 'pabellontest@gmail.com';
-- Luego usa ese UUID en la OPCIÓN 1

-- OPCIÓN 3: Corregir rol si el usuario existe pero tiene rol incorrecto
UPDATE public.users
SET role = 'pabellon'
WHERE id = '30300f38-dd15-4d8f-a319-3403d7bb762c'  -- Reemplaza con tu UUID
  AND role != 'pabellon';

-- =====================================================
-- PASO 4: Verificación final
-- =====================================================

-- Verificar que el usuario ahora existe con el rol correcto
SELECT 
    u.id,
    u.email,
    u.role,
    u.created_at,
    CASE 
        WHEN u.role = 'pabellon' THEN '✅ Configuración correcta'
        ELSE '❌ Rol incorrecto'
    END as estado
FROM public.users u
WHERE u.email = 'pabellontest@gmail.com'  -- Reemplaza con tu email
   OR u.id = '30300f38-dd15-4d8f-a319-3403d7bb762c';  -- O por UUID

-- =====================================================
-- SOLUCIÓN RÁPIDA (TODO EN UNO)
-- =====================================================
-- Si solo quieres ejecutar una consulta, usa esta:

-- Para el usuario pabellontest@gmail.com con UUID 30300f38-dd15-4d8f-a319-3403d7bb762c:
INSERT INTO public.users (id, email, role)
VALUES (
    '30300f38-dd15-4d8f-a319-3403d7bb762c',
    'pabellontest@gmail.com',
    'pabellon'
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'pabellon',
    email = EXCLUDED.email;
