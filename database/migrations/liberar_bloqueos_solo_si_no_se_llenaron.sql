-- =====================================================
-- LÓGICA: Liberar bloqueos expirados solo si "no se llenaron"
-- Regla de negocio: si ponemos "5 días máximo" de vigencia,
-- y hay un bloqueo (ej. 9 feb) que al llegar esa fecha no se
-- llenó (no hay cirugía en ese slot), se libera para que el
-- calendario esté más visual.
-- =====================================================

DROP FUNCTION IF EXISTS liberar_bloqueos_expirados();

CREATE OR REPLACE FUNCTION liberar_bloqueos_expirados()
RETURNS TABLE(
    bloqueos_liberados INTEGER,
    mensaje TEXT
) AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Solo liberar bloqueos que:
    -- 1) Ya pasó su vigencia (vigencia_hasta o fecha_auto_liberacion) O la fecha del bloqueo ya pasó
    -- 2) Y NO se llenaron: no existe una cirugía en el mismo pabellón/fecha/hora (solapada)
    UPDATE public.schedule_blocks b
    SET deleted_at = NOW()
    WHERE b.deleted_at IS NULL
      AND (
          (b.vigencia_hasta IS NOT NULL AND b.vigencia_hasta < CURRENT_DATE)
          OR (b.fecha_auto_liberacion IS NOT NULL AND b.fecha_auto_liberacion < CURRENT_DATE)
          OR (b.fecha < CURRENT_DATE)
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.surgeries s
          WHERE s.operating_room_id = b.operating_room_id
            AND s.fecha = b.fecha
            AND s.deleted_at IS NULL
            AND s.estado != 'cancelada'
            AND s.hora_inicio < b.hora_fin
            AND s.hora_fin > b.hora_inicio
      );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN QUERY SELECT
        v_count,
        format('Se liberaron %s bloqueos expirados (solo los que no tenían cirugía en el slot)', v_count)::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION liberar_bloqueos_expirados IS 'Libera bloqueos expirados cuya vigencia o fecha ya pasó, SOLO si el slot no fue llenado por ninguna cirugía. Así el calendario queda más visual. Ejecutar diariamente (cron o Edge Function).';

GRANT EXECUTE ON FUNCTION liberar_bloqueos_expirados() TO authenticated;
