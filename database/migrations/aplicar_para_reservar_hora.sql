-- =====================================================
-- EJECUTAR EN SUPABASE (SQL Editor) para que funcione
-- "Reservar hora" y la vista de horarios por pabellón
-- =====================================================
-- Si ves error 404 en get_estado_slots_pabellon o 400 al crear
-- una solicitud, ejecuta este script completo en tu proyecto.

-- 1) Columnas en surgery_requests (horario preferido y segundo horario)
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS fecha_preferida DATE NULL,
  ADD COLUMN IF NOT EXISTS hora_fin_recomendada TIME NULL;

ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS operating_room_id_preferido UUID NULL REFERENCES public.operating_rooms(id) ON DELETE SET NULL;

ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS fecha_preferida_2 DATE NULL,
  ADD COLUMN IF NOT EXISTS hora_recomendada_2 TIME NULL,
  ADD COLUMN IF NOT EXISTS hora_fin_recomendada_2 TIME NULL,
  ADD COLUMN IF NOT EXISTS operating_room_id_preferido_2 UUID NULL REFERENCES public.operating_rooms(id) ON DELETE SET NULL;

-- 2) Dejar fecha a pabellón + horarios extra
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS dejar_fecha_a_pabellon BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS horarios_preferidos_extra JSONB NULL;

-- 3) Función RPC para que el doctor vea estado de slots (libre / ocupado / bloqueado / solicitado)
CREATE OR REPLACE FUNCTION public.get_estado_slots_pabellon(p_fecha DATE)
RETURNS TABLE(
    operating_room_id UUID,
    nombre_pabellon TEXT,
    hora_inicio TIME,
    hora_fin TIME,
    estado TEXT
) AS $$
DECLARE
    v_hora TIME;
    v_hora_fin TIME;
    v_room RECORD;
    v_ocupado BOOLEAN;
    v_bloqueado BOOLEAN;
    v_solicitado BOOLEAN;
BEGIN
    IF p_fecha < CURRENT_DATE THEN
        RETURN;
    END IF;

    FOR v_room IN
        SELECT id, nombre
        FROM public.operating_rooms
        WHERE activo = true AND deleted_at IS NULL
    LOOP
        v_hora := '08:00'::TIME;
        WHILE v_hora < '19:00'::TIME LOOP
            v_hora_fin := v_hora + INTERVAL '1 hour';

            v_ocupado := EXISTS (
                SELECT 1 FROM public.surgeries s
                WHERE s.operating_room_id = v_room.id
                  AND s.fecha = p_fecha
                  AND s.deleted_at IS NULL
                  AND s.estado NOT IN ('cancelada')
                  AND s.hora_inicio < v_hora_fin
                  AND s.hora_fin > v_hora
            );
            v_bloqueado := EXISTS (
                SELECT 1 FROM public.schedule_blocks b
                WHERE b.operating_room_id = v_room.id
                  AND b.fecha = p_fecha
                  AND b.deleted_at IS NULL
                  AND (b.fecha_auto_liberacion IS NULL OR b.fecha_auto_liberacion >= p_fecha)
                  AND (b.vigencia_hasta IS NULL OR b.vigencia_hasta >= p_fecha)
                  AND b.hora_inicio < v_hora_fin
                  AND b.hora_fin > v_hora
            );
            v_solicitado := NOT v_ocupado AND NOT v_bloqueado AND EXISTS (
                SELECT 1 FROM public.surgery_requests sr
                WHERE sr.operating_room_id_preferido = v_room.id
                  AND sr.fecha_preferida = p_fecha
                  AND sr.deleted_at IS NULL
                  AND sr.estado IN ('pendiente', 'aceptada')
                  AND sr.hora_recomendada IS NOT NULL
                  AND sr.hora_recomendada < v_hora_fin
                  AND (sr.hora_fin_recomendada IS NULL OR sr.hora_fin_recomendada > v_hora)
            );

            operating_room_id := v_room.id;
            nombre_pabellon := v_room.nombre;
            hora_inicio := v_hora;
            hora_fin := v_hora_fin;
            IF v_ocupado THEN
                estado := 'ocupado';
            ELSIF v_bloqueado THEN
                estado := 'bloqueado';
            ELSIF v_solicitado THEN
                estado := 'solicitado';
            ELSE
                estado := 'libre';
            END IF;
            RETURN NEXT;

            v_hora := v_hora_fin;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_estado_slots_pabellon(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_estado_slots_pabellon(DATE) TO anon;
