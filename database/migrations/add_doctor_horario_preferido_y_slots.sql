-- =====================================================
-- Doctor: solicitar horas específicas vacías (sin reservas ni bloqueos)
-- - Campos en solicitud: fecha y horario preferido
-- - Función para que el doctor vea slots disponibles por fecha
-- =====================================================

-- 1. Campos en surgery_requests para horario preferido
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS fecha_preferida DATE NULL,
  ADD COLUMN IF NOT EXISTS hora_fin_recomendada TIME NULL;

COMMENT ON COLUMN public.surgery_requests.fecha_preferida IS 'Fecha preferida por el doctor para la cirugía (slot vacío, sin reservas ni bloqueos)';
COMMENT ON COLUMN public.surgery_requests.hora_fin_recomendada IS 'Hora fin del slot preferido; junto con hora_recomendada define el rango solicitado';

-- 2. Función: slots disponibles por fecha (para que el doctor elija)
-- Retorna slots de 1 hora (08:00-09:00, 09:00-10:00, ... 18:00-19:00) que no tienen cirugía ni bloqueo
CREATE OR REPLACE FUNCTION public.get_slots_disponibles_pabellon(p_fecha DATE)
RETURNS TABLE(
    operating_room_id UUID,
    nombre_pabellon TEXT,
    hora_inicio TIME,
    hora_fin TIME
) AS $$
DECLARE
    v_hora TIME;
    v_hora_fin TIME;
    v_room RECORD;
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
            -- Slot libre si no hay cirugía ni bloqueo que lo solape
            IF NOT EXISTS (
                SELECT 1 FROM public.surgeries s
                WHERE s.operating_room_id = v_room.id
                  AND s.fecha = p_fecha
                  AND s.deleted_at IS NULL
                  AND s.estado NOT IN ('cancelada')
                  AND s.hora_inicio < v_hora_fin
                  AND s.hora_fin > v_hora
            ) AND NOT EXISTS (
                SELECT 1 FROM public.schedule_blocks b
                WHERE b.operating_room_id = v_room.id
                  AND b.fecha = p_fecha
                  AND b.deleted_at IS NULL
                  AND (b.fecha_auto_liberacion IS NULL OR b.fecha_auto_liberacion >= p_fecha)
                  AND (b.vigencia_hasta IS NULL OR b.vigencia_hasta >= p_fecha)
                  AND b.hora_inicio < v_hora_fin
                  AND b.hora_fin > v_hora
            ) THEN
                operating_room_id := v_room.id;
                nombre_pabellon := v_room.nombre;
                hora_inicio := v_hora;
                hora_fin := v_hora_fin;
                RETURN NEXT;
            END IF;
            v_hora := v_hora_fin;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_slots_disponibles_pabellon(DATE) IS 'Slots de 1h disponibles por fecha (sin cirugías ni bloqueos). Para que el doctor solicite horas específicas vacías.';

GRANT EXECUTE ON FUNCTION public.get_slots_disponibles_pabellon(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_slots_disponibles_pabellon(DATE) TO anon;
