-- =====================================================
-- Segundo horario preferido en solicitudes (doctor puede pedir 2 opciones)
-- =====================================================

ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS fecha_preferida_2 DATE NULL,
  ADD COLUMN IF NOT EXISTS hora_recomendada_2 TIME NULL,
  ADD COLUMN IF NOT EXISTS hora_fin_recomendada_2 TIME NULL,
  ADD COLUMN IF NOT EXISTS operating_room_id_preferido_2 UUID NULL REFERENCES public.operating_rooms(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.surgery_requests.fecha_preferida_2 IS 'Segunda fecha preferida (alternativa) por el doctor';
COMMENT ON COLUMN public.surgery_requests.hora_recomendada_2 IS 'Hora inicio del segundo horario preferido';
COMMENT ON COLUMN public.surgery_requests.hora_fin_recomendada_2 IS 'Hora fin del segundo horario preferido';
COMMENT ON COLUMN public.surgery_requests.operating_room_id_preferido_2 IS 'Segundo pabellón preferido (alternativa)';
