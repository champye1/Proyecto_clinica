-- =====================================================
-- Script: Actualizar Stock de Todos los Insumos
-- Fecha: 2026-01-25
-- Descripción: Establece el stock_actual de todos los insumos activos a 10
-- =====================================================

-- Actualizar todos los insumos activos y no eliminados a stock de 10
UPDATE public.supplies
SET stock_actual = 10,
    updated_at = NOW()
WHERE deleted_at IS NULL
  AND activo = true;

-- Mostrar resumen de insumos actualizados
SELECT 
    COUNT(*) AS total_insumos_actualizados,
    SUM(CASE WHEN stock_actual = 10 THEN 1 ELSE 0 END) AS insumos_con_stock_10,
    SUM(CASE WHEN stock_actual < stock_minimo THEN 1 ELSE 0 END) AS insumos_bajo_stock_minimo
FROM public.supplies
WHERE deleted_at IS NULL
  AND activo = true;
