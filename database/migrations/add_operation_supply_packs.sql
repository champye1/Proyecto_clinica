-- =====================================================
-- MIGRACIÓN: Packs de Insumos por Código de Operación
-- Descripción: Permite definir insumos recomendados y packs
--              preseleccionados por procedimiento quirúrgico.
--              Buenas prácticas: estandarización de procedure packs
--              (Cardinal Health, NHS Supply Chain).
-- =====================================================

-- Funciones auxiliares para RLS (crear si no existen; requieren tabla public.users)
CREATE OR REPLACE FUNCTION public.is_pabellon()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'pabellon'
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'doctor'
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabla: packs y recomendados por código de operación
-- cantidad >= 1: insumo en el pack (se añade automáticamente al elegir el código)
-- cantidad = 0: solo recomendado (aparece destacado en la lista, no se autoañade)
CREATE TABLE IF NOT EXISTS public.operation_supply_packs (
    codigo_operacion TEXT NOT NULL,
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (codigo_operacion, supply_id)
);

CREATE INDEX IF NOT EXISTS idx_osp_codigo ON public.operation_supply_packs(codigo_operacion);
CREATE INDEX IF NOT EXISTS idx_osp_supply_id ON public.operation_supply_packs(supply_id);

COMMENT ON TABLE public.operation_supply_packs IS 'Packs y recomendados de insumos por código de operación. cantidad>=1 = pack (autoañadir); cantidad=0 = solo recomendado.';

-- RLS: lectura para doctores y pabellón
ALTER TABLE public.operation_supply_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctores pueden ver packs por operación"
    ON public.operation_supply_packs FOR SELECT
    USING (is_doctor());

CREATE POLICY "Pabellón puede ver packs por operación"
    ON public.operation_supply_packs FOR SELECT
    USING (is_pabellon());

-- Pabellón puede gestionar packs (insert/update/delete) para configurar procedimientos
CREATE POLICY "Pabellón puede insertar packs"
    ON public.operation_supply_packs FOR INSERT
    WITH CHECK (is_pabellon());

CREATE POLICY "Pabellón puede actualizar packs"
    ON public.operation_supply_packs FOR UPDATE
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

CREATE POLICY "Pabellón puede eliminar packs"
    ON public.operation_supply_packs FOR DELETE
    USING (is_pabellon());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_operation_supply_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_osp_updated_at ON public.operation_supply_packs;
CREATE TRIGGER trigger_osp_updated_at
    BEFORE UPDATE ON public.operation_supply_packs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operation_supply_packs_updated_at();
