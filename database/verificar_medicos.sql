-- =====================================================
-- VERIFICAR MÉDICOS EXISTENTES
-- =====================================================
-- 
-- Ejecuta este SQL para ver todos los médicos registrados:

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

-- Si encuentras el médico, usa su email exacto en el UPDATE:
-- UPDATE public.doctors
-- SET user_id = 'd67b9659-a560-4ada-83ba-907160a088df'
-- WHERE email = 'EMAIL_EXACTO_AQUI';
