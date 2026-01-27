-- =====================================================
-- INSERTAR USUARIO PABELLÓN EN TABLA USERS
-- =====================================================
-- 
-- Este SQL inserta el usuario Pabellón que ya creaste en Auth
-- User UID: d67b9659-a560-4ada-83ba-907160a088df
-- Email: pabellontest01@gmail.com

INSERT INTO public.users (id, email, role)
VALUES (
  'd67b9659-a560-4ada-83ba-907160a088df',
  'pabellontest01@gmail.com',
  'pabellon'
);

-- Verificar que se insertó correctamente:
SELECT * FROM public.users WHERE id = 'd67b9659-a560-4ada-83ba-907160a088df';
