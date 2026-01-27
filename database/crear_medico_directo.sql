-- =====================================================
-- CREAR MÉDICO DIRECTAMENTE EN LA BASE DE DATOS
-- =====================================================
-- 
-- Ejecuta este SQL para crear el médico directamente
-- Luego podrás asignar el user_id después

INSERT INTO public.doctors (
  nombre,
  apellido,
  rut,
  email,
  especialidad,
  estado,
  acceso_web_enabled,
  user_id
)
VALUES (
  'ESTE',                    -- Nombre
  'ESTE',                    -- Apellido
  '11111111-1',              -- RUT (formato: 12345678-9)
  'test01@gmail.com',        -- Email (en minúsculas)
  'cirugia_general',         -- Especialidad (debe ser del enum)
  'activo',                  -- Estado: 'activo' o 'vacaciones'
  true,                      -- Acceso web habilitado
  NULL                       -- user_id será NULL por ahora
);

-- Verificar que se creó:
SELECT * FROM public.doctors WHERE email = 'test01@gmail.com';
