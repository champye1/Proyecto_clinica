-- ============================================================
-- Cron job para poll-gmail usando pg_cron + pg_net.
-- Llama a la edge function cada 5 minutos.
--
-- ANTES DE EJECUTAR:
--   Reemplaza <SUPABASE_URL>      con tu URL de proyecto
--   Reemplaza <SUPABASE_ANON_KEY> con tu anon key pública
--   Ambos están en Supabase Dashboard → Settings → API
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Habilitar extensiones necesarias ─────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net   WITH SCHEMA extensions;

-- ── 2. Eliminar job anterior si existía (re-ejecución segura)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'poll-gmail';

-- ── 3. Crear el job ─────────────────────────────────────────
SELECT cron.schedule(
  'poll-gmail',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := '<SUPABASE_URL>/functions/v1/poll-gmail',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SUPABASE_ANON_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
