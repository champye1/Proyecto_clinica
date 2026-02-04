-- =====================================================
-- Dejar fecha a pabellón + horarios preferidos extra (3º, 4º, ...)
-- =====================================================

-- El doctor puede indicar que la fecha la elige pabellón
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS dejar_fecha_a_pabellon BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.surgery_requests.dejar_fecha_a_pabellon IS 'Si true, el doctor deja que pabellón asigne la fecha/hora; los horarios preferidos se ignoran para asignación.';

-- Horarios adicionales (3º, 4º, ...) como JSON array
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS horarios_preferidos_extra JSONB NULL;

COMMENT ON COLUMN public.surgery_requests.horarios_preferidos_extra IS 'Array de horarios adicionales: [{ fecha_preferida, operating_room_id, hora_recomendada, hora_fin_recomendada }, ...]';
