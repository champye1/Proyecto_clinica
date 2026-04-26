-- ============================================================
-- Tabla para guardar las suscripciones Web Push de cada usuario.
-- Un usuario puede tener múltiples suscripciones (distintos navegadores).
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id  UUID        REFERENCES public.clinicas(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gestiona sus propias suscripciones"
  ON public.push_subscriptions
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Edge functions (service_role) pueden leer todas para enviar pushes
-- Esto se maneja automáticamente con service_role key en la edge function.

-- ── Índice ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_clinica
  ON public.push_subscriptions (clinica_id);

COMMENT ON TABLE public.push_subscriptions IS
  'Suscripciones Web Push por usuario. Cada fila = un navegador/dispositivo suscrito.';
