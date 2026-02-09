-- =====================================================
-- Ajuste: asegurar que los doctores puedan entrar
-- con su nombre de usuario (además del correo).
-- Ejecutar en Supabase → SQL Editor.
-- =====================================================
-- Si la función get_doctor_email_by_username no existe,
-- ejecuta antes add_get_doctor_email_by_username.sql.

-- Doctor esteban venegas -> usuario evenegas
UPDATE public.users
SET username = 'evenegas'
WHERE email = 'estebanv144@gmail.com'
  AND role = 'doctor'
  AND (username IS NULL OR username = '');

-- Doctor Rocio potocosio -> usuario rpotocosio
UPDATE public.users
SET username = 'rpotocosio'
WHERE email = 'potocosio@gmail.com'
  AND role = 'doctor'
  AND (username IS NULL OR username = '');
