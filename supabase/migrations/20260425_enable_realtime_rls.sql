-- ============================================================
-- 1. Habilita Realtime en las tablas críticas
--    (Supabase usa una publicación interna llamada supabase_realtime)
-- 2. Política RLS: doctores pueden cancelar sus propias cirugías
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Realtime ────────────────────────────────────────────────
-- Agrega cada tabla solo si aún no es miembro de la publicación
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'notifications',
    'surgery_requests',
    'surgeries',
    'schedule_blocks',
    'external_messages'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      RAISE NOTICE 'Tabla % agregada a supabase_realtime', tbl;
    ELSE
      RAISE NOTICE 'Tabla % ya estaba en supabase_realtime, omitida', tbl;
    END IF;
  END LOOP;
END;
$$;

-- ── RLS: doctor puede cancelar sus propias cirugías programadas
-- Borramos si ya existía para evitar duplicados
DROP POLICY IF EXISTS "doctor_can_cancel_own_surgery" ON public.surgeries;

CREATE POLICY "doctor_can_cancel_own_surgery"
  ON public.surgeries
  FOR UPDATE
  USING (
    -- Solo sus propias cirugías y solo cuando están programadas
    EXISTS (
      SELECT 1
      FROM public.doctors d
      JOIN public.users u ON u.id = d.user_id
      WHERE d.id = public.surgeries.doctor_id
        AND u.id = auth.uid()
        AND d.deleted_at IS NULL
    )
    AND public.surgeries.estado = 'programada'
  )
  WITH CHECK (
    -- Solo puede cambiar el estado a 'cancelada'
    estado = 'cancelada'
  );
