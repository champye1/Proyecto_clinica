-- =====================================================
-- PACKS DE INSUMOS POR CÓDIGO DE OPERACIÓN (EJEMPLO)
-- Ejecutar después de add_operation_supply_packs.sql y con supplies ya cargados.
-- Ajustar códigos de insumos según tu inventario (supplies.codigo).
-- =====================================================

-- Evitar duplicados: solo insertar si no existe la fila
INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '001', id, 2 FROM public.supplies WHERE codigo = 'INS-001' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '001', id, 2 FROM public.supplies WHERE codigo = 'INS-002' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '001', id, 1 FROM public.supplies WHERE codigo = 'INS-006' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '001', id, 1 FROM public.supplies WHERE codigo = 'INS-014' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '001', id, 1 FROM public.supplies WHERE codigo = 'INS-017' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

-- 002 - Colecistectomía abierta (mismo grupo 18, pack similar)
INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '002', id, 2 FROM public.supplies WHERE codigo = 'INS-001' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '002', id, 1 FROM public.supplies WHERE codigo = 'INS-006' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '002', id, 1 FROM public.supplies WHERE codigo = 'INS-014' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

-- 003 - Apendicectomía laparoscópica
INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '003', id, 2 FROM public.supplies WHERE codigo = 'INS-001' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '003', id, 1 FROM public.supplies WHERE codigo = 'INS-006' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;

INSERT INTO public.operation_supply_packs (codigo_operacion, supply_id, cantidad)
SELECT '003', id, 1 FROM public.supplies WHERE codigo = 'INS-017' AND deleted_at IS NULL LIMIT 1
ON CONFLICT (codigo_operacion, supply_id) DO NOTHING;
