-- =====================================================
-- Ajuste: asegurar que el doctor esteban venegas pueda
-- entrar con usuario "evenegas" (además del correo).
-- Ejecutar en Supabase → SQL Editor.
-- =====================================================
-- Si ya ejecutaste add_get_doctor_email_by_username.sql
-- solo hace falta este UPDATE. Si no, ejecuta primero
-- add_get_doctor_email_by_username.sql completo.

UPDATE public.users
SET username = 'evenegas'
WHERE email = 'estebanv144@gmail.com'
  AND role = 'doctor'
  AND (username IS NULL OR username = '');
