-- =====================================================
-- SOLUCIÓN RÁPIDA: Arreglar login de Pabellón
-- =====================================================
-- 
-- PROBLEMA: El usuario existe en auth.users pero no en la tabla users
-- SOLUCIÓN: Crear el registro en users con rol 'pabellon'
-- =====================================================

-- Para el usuario pabellontest@gmail.com con UUID 30300f38-dd15-4d8f-a319-3403d7bb762c
-- (Este es el usuario que aparece en tu dashboard de Supabase)

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

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el usuario ahora existe con el rol correcto
SELECT 
    u.id,
    u.email,
    u.role,
    CASE 
        WHEN u.role = 'pabellon' THEN '✅ Configuración correcta - Puede iniciar sesión'
        ELSE '❌ Rol incorrecto'
    END as estado
FROM public.users u
WHERE u.id = '30300f38-dd15-4d8f-a319-3403d7bb762c';

-- =====================================================
-- SI TIENES OTRO USUARIO DE PABELLÓN
-- =====================================================
-- Reemplaza el UUID y email en la consulta INSERT de arriba
