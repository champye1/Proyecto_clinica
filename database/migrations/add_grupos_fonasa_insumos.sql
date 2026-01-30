-- =====================================================
-- MIGRACIÓN: Grupos Fonasa en Insumos
-- Descripción: Permite acotar qué insumos puede elegir el médico
--              según el tipo de cirugía (grupo Fonasa del código).
--              Ej: mallas para hernias (grupo 18) no en cirugía de cerebro (80).
-- =====================================================

-- Columna grupos_fonasa: códigos de grupo Fonasa separados por coma (ej. '18,19').
-- Si está vacío o NULL, el insumo se considera válido para todas las cirugías (comportamiento anterior).
ALTER TABLE public.supplies
ADD COLUMN IF NOT EXISTS grupos_fonasa TEXT NULL DEFAULT NULL;

COMMENT ON COLUMN public.supplies.grupos_fonasa IS 'Grupos Fonasa para los que aplica este insumo (ej. 18=hernias). Vacío = aplica a todas las cirugías. Valores separados por coma.';

-- Índice para búsquedas por grupo (opcional, si se filtra por texto)
-- CREATE INDEX IF NOT EXISTS idx_supplies_grupos_fonasa ON public.supplies USING gin(string_to_array(grupos_fonasa, ','));
-- Mejor no crear índice GIN sobre expresión si no hay muchas filas; el filtrado se puede hacer en app.
