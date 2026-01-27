-- =====================================================
-- MIGRACIÓN: Tiempo de Limpieza entre Cirugías
-- Fecha: 2026-01-24
-- Descripción: Agrega campo de tiempo de limpieza a pabellones
-- =====================================================

-- Agregar campo de tiempo de limpieza (en minutos) a operating_rooms
ALTER TABLE public.operating_rooms
ADD COLUMN IF NOT EXISTS tiempo_limpieza_minutos INTEGER NOT NULL DEFAULT 30 CHECK (tiempo_limpieza_minutos >= 0);

-- Comentario para documentación
COMMENT ON COLUMN public.operating_rooms.tiempo_limpieza_minutos IS 'Tiempo requerido para limpieza entre cirugías (en minutos)';

-- Actualizar pabellones existentes con valor por defecto
UPDATE public.operating_rooms
SET tiempo_limpieza_minutos = 30
WHERE tiempo_limpieza_minutos IS NULL;
