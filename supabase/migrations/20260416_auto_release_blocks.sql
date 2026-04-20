-- ============================================================
-- Auto-liberación de bloques de horario expirados
-- Usa pg_cron para ejecutar la limpieza cada hora.
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Función de limpieza ───────────────────────────────────────────────────────
-- Marca como eliminados (soft delete) los bloques cuya fecha de liberación
-- ya pasó, según el campo dias_liberacion.
CREATE OR REPLACE FUNCTION auto_release_expired_blocks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE schedule_blocks
  SET deleted_at = NOW()
  WHERE deleted_at IS NULL
    AND (
      -- Si dias_liberacion es NULL o 0, liberar al día siguiente de la fecha del bloqueo
      CASE
        WHEN dias_liberacion IS NULL OR dias_liberacion = 0
          THEN fecha < CURRENT_DATE
        ELSE
          fecha + (dias_liberacion || ' days')::INTERVAL < NOW()
      END
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Registrar en log si hubo liberaciones
  IF v_count > 0 THEN
    INSERT INTO audit_log (accion, detalle, created_at)
    VALUES (
      'auto_release_blocks',
      format('Se liberaron %s bloques de horario expirados', v_count),
      NOW()
    )
    ON CONFLICT DO NOTHING;  -- por si la tabla audit_log no existe aún
  END IF;

  RETURN v_count;
END;
$$;

-- ── Programar con pg_cron ────────────────────────────────────────────────────
-- Se ejecuta cada hora en punto.
-- pg_cron debe estar habilitado en el proyecto de Supabase
-- (Extensions → pg_cron → Enable).

SELECT cron.schedule(
  'auto-release-expired-blocks',      -- nombre del job (único)
  '0 * * * *',                        -- cada hora en punto
  'SELECT auto_release_expired_blocks()'
);

-- ── Para verificar que quedó programado ──────────────────────────────────────
-- SELECT * FROM cron.job WHERE jobname = 'auto-release-expired-blocks';

-- ── Para desactivar el job si es necesario ───────────────────────────────────
-- SELECT cron.unschedule('auto-release-expired-blocks');
