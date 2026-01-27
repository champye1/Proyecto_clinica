-- =====================================================
-- MIGRACIÓN: Control de Inventario de Insumos
-- Fecha: 2026-01-24
-- Descripción: Agrega campos de stock y control de inventario
-- =====================================================

-- Agregar campos de stock a la tabla supplies
ALTER TABLE public.supplies
ADD COLUMN IF NOT EXISTS stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
ADD COLUMN IF NOT EXISTS stock_minimo INTEGER NOT NULL DEFAULT 10 CHECK (stock_minimo >= 0),
ADD COLUMN IF NOT EXISTS unidad_medida TEXT NOT NULL DEFAULT 'unidad';

-- Crear índice para búsquedas de stock bajo
CREATE INDEX IF NOT EXISTS idx_supplies_stock_bajo 
ON public.supplies(stock_actual) 
WHERE deleted_at IS NULL AND activo = true AND stock_actual <= stock_minimo;

-- Comentarios para documentación
COMMENT ON COLUMN public.supplies.stock_actual IS 'Cantidad actual disponible en inventario';
COMMENT ON COLUMN public.supplies.stock_minimo IS 'Cantidad mínima antes de generar alerta';
COMMENT ON COLUMN public.supplies.unidad_medida IS 'Unidad de medida (unidad, caja, litro, etc.)';

-- =====================================================
-- TABLA: Movimientos de Inventario
-- =====================================================
CREATE TABLE IF NOT EXISTS public.supply_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE RESTRICT,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    motivo TEXT,
    relacionado_con UUID NULL, -- Puede referenciar surgery_id, surgery_request_id, etc.
    relacionado_tipo TEXT NULL CHECK (relacionado_tipo IN ('cirugia', 'solicitud', 'ajuste_manual', 'compra')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_supply_movements_supply_id ON public.supply_movements(supply_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_supply_movements_tipo ON public.supply_movements(tipo) WHERE deleted_at IS NULL;
CREATE INDEX idx_supply_movements_created_at ON public.supply_movements(created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.supply_movements IS 'Registro de todos los movimientos de inventario de insumos';
COMMENT ON COLUMN public.supply_movements.tipo IS 'Tipo de movimiento: entrada (compra/reposición), salida (uso), ajuste (corrección)';

-- =====================================================
-- FUNCIÓN: Actualizar stock automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_supply_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'entrada' THEN
        UPDATE public.supplies
        SET stock_actual = stock_actual + NEW.cantidad,
            updated_at = NOW()
        WHERE id = NEW.supply_id;
    ELSIF NEW.tipo = 'salida' THEN
        UPDATE public.supplies
        SET stock_actual = GREATEST(0, stock_actual - NEW.cantidad),
            updated_at = NOW()
        WHERE id = NEW.supply_id;
    ELSIF NEW.tipo = 'ajuste' THEN
        -- Los ajustes se manejan manualmente actualizando stock_actual directamente
        UPDATE public.supplies
        SET updated_at = NOW()
        WHERE id = NEW.supply_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock automáticamente
DROP TRIGGER IF EXISTS trigger_update_supply_stock ON public.supply_movements;
CREATE TRIGGER trigger_update_supply_stock
    AFTER INSERT ON public.supply_movements
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NULL)
    EXECUTE FUNCTION public.update_supply_stock();

-- =====================================================
-- FUNCIÓN: Crear movimiento de salida al programar cirugía
-- =====================================================
-- Esta función se llamará cuando se programe una cirugía
-- para descontar automáticamente los insumos del stock

CREATE OR REPLACE FUNCTION public.create_supply_movements_from_surgery()
RETURNS TRIGGER AS $$
DECLARE
    supply_record RECORD;
BEGIN
    -- Solo procesar si la cirugía está en estado 'programada' o 'en_proceso'
    IF NEW.estado IN ('programada', 'en_proceso') AND (OLD.estado IS NULL OR OLD.estado != NEW.estado) THEN
        -- Crear movimientos de salida para cada insumo asociado a la cirugía
        FOR supply_record IN
            SELECT ss.supply_id, ss.cantidad
            FROM public.surgery_supplies ss
            WHERE ss.surgery_id = NEW.id
        LOOP
            INSERT INTO public.supply_movements (
                supply_id,
                tipo,
                cantidad,
                motivo,
                relacionado_con,
                relacionado_tipo,
                created_by
            ) VALUES (
                supply_record.supply_id,
                'salida',
                supply_record.cantidad,
                'Uso en cirugía programada',
                NEW.id,
                'cirugia',
                NEW.doctor_id::text::uuid -- Usar doctor_id como created_by (ajustar según necesidad)
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear movimientos al programar cirugía
DROP TRIGGER IF EXISTS trigger_supply_movements_from_surgery ON public.surgeries;
CREATE TRIGGER trigger_supply_movements_from_surgery
    AFTER INSERT OR UPDATE ON public.surgeries
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NULL)
    EXECUTE FUNCTION public.create_supply_movements_from_surgery();
