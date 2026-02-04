-- =====================================================
-- Vista de horarios disponibles por pabellón (doctor)
-- "Debe tener la vista de que horario tienen disponible los distintos pabellones"
-- Retorna cada slot con estado: libre | ocupado | bloqueado (sin exponer datos de otros doctores)
-- =====================================================

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

            operating_room_id := v_room.id;
            nombre_pabellon := v_room.nombre;
            hora_inicio := v_hora;
            hora_fin := v_hora_fin;
            IF v_ocupado THEN
                estado := 'ocupado';
            ELSIF v_bloqueado THEN
                estado := 'bloqueado';
            ELSE
                estado := 'libre';
            END IF;
            RETURN NEXT;

            v_hora := v_hora_fin;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_estado_slots_pabellon(DATE) IS 'Vista de estado de cada slot por fecha: libre, ocupado o bloqueado. Para que el doctor vea qué horario tienen disponible los distintos pabellones.';

GRANT EXECUTE ON FUNCTION public.get_estado_slots_pabellon(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_estado_slots_pabellon(DATE) TO anon;
