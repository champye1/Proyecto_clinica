-- =====================================================
-- SCRIPT PARA ELIMINAR USUARIOS DE SUPABASE
-- Clínica Privada Viña del Mar
-- =====================================================
-- 
-- IMPORTANTE: Antes de eliminar usuarios, ejecuta primero:
-- database/fix_audit_logs_permissions.sql
-- para corregir el error "permission denied for table audit_logs"
--
-- INSTRUCCIONES:
-- 1. PRIMERO ejecuta: database/fix_audit_logs_permissions.sql
-- 2. Luego reemplaza los UUIDs o emails en la sección correspondiente
-- 3. Ejecuta este script en el SQL Editor de Supabase
-- 4. ADVERTENCIA: La eliminación es permanente y no se puede deshacer
--
-- NOTA: Al eliminar un usuario de auth.users, se eliminarán automáticamente:
--   - El registro en la tabla users (por ON DELETE CASCADE)
--   - El registro en la tabla doctors si existe (por ON DELETE CASCADE)
--   - Los recordatorios y notificaciones asociadas (por ON DELETE CASCADE)
--
-- Sin embargo, si el usuario tiene pacientes, solicitudes quirúrgicas o cirugías,
-- la eliminación puede fallar debido a restricciones ON DELETE RESTRICT.
-- En ese caso, primero debes eliminar o transferir esos datos relacionados.
-- =====================================================

-- =====================================================
-- OPCIÓN 1: Eliminar usuario por UUID
-- =====================================================
-- Reemplaza 'USER_UUID_AQUI' con el UUID del usuario que deseas eliminar
-- Puedes encontrar el UUID en Authentication → Users → Click en el usuario

-- Ejemplo para un solo usuario:
-- DELETE FROM auth.users WHERE id = 'f0351fea-5f06-453b-8689-39363598f724';

-- Ejemplo para múltiples usuarios (los UUIDs de la imagen):
DELETE FROM auth.users 
WHERE id IN (
  'f0351fea-5f06-453b-8689-39363598f724',  -- estetest@gmail.com
  '2580477d-72cf-47bf-9af2-b2f6e7d49452',  -- juan.perez@example.com
  'd67b9659-a560-4ada-83ba-907160a088df'   -- pabellontest01@gmail.com
);

-- =====================================================
-- OPCIÓN 2: Eliminar usuario por email
-- =====================================================
-- Si prefieres eliminar por email, usa esta consulta:

-- DELETE FROM auth.users 
-- WHERE email IN (
--   'estetest@gmail.com',
--   'juan.perez@example.com',
--   'pabellontest01@gmail.com'
-- );

-- =====================================================
-- OPCIÓN 3: Verificar datos relacionados antes de eliminar
-- =====================================================
-- Ejecuta esta consulta primero para ver qué datos tiene el usuario:

-- SELECT 
--   u.id,
--   u.email,
--   u.role,
--   d.id as doctor_id,
--   (SELECT COUNT(*) FROM patients WHERE doctor_id = d.id) as total_pacientes,
--   (SELECT COUNT(*) FROM surgery_requests WHERE doctor_id = d.id) as total_solicitudes,
--   (SELECT COUNT(*) FROM surgeries WHERE doctor_id = d.id) as total_cirugias,
--   (SELECT COUNT(*) FROM schedule_blocks WHERE doctor_id = d.id) as total_bloqueos
-- FROM users u
-- LEFT JOIN doctors d ON d.user_id = u.id
-- WHERE u.email IN (
--   'estetest@gmail.com',
--   'juan.perez@example.com',
--   'pabellontest01@gmail.com'
-- );

-- =====================================================
-- OPCIÓN 4: Eliminar usuarios de prueba (por patrón de email)
-- =====================================================
-- Si quieres eliminar todos los usuarios que contengan "test" en el email:

-- DELETE FROM auth.users 
-- WHERE email LIKE '%test%';

-- =====================================================
-- VERIFICACIÓN POST-ELIMINACIÓN
-- =====================================================
-- Ejecuta esto después de eliminar para verificar:

-- SELECT id, email, created_at 
-- FROM auth.users 
-- ORDER BY created_at DESC;
