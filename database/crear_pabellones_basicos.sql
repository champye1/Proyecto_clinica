-- =====================================================
-- CREAR PABELLONES BÁSICOS
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
