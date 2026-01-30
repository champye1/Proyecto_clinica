-- =====================================================
-- MIGRACIÓN: Proveedor en Insumos
-- Descripción: Indica quién proveyó el item (proveedor del insumo).
-- =====================================================

ALTER TABLE public.supplies
ADD COLUMN IF NOT EXISTS proveedor TEXT NULL DEFAULT NULL;

COMMENT ON COLUMN public.supplies.proveedor IS 'Proveedor del insumo (quien proveyó el item).';
