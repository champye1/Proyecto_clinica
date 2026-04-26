-- ============================================================
-- Agrega columnas de Stripe necesarias para el flujo de pago.
-- stripe_customer_id ya puede existir (creado por stripe-checkout).
-- stripe_price_id es el Price ID de Stripe para cada plan.
-- stripe_subscription_id se guarda al confirmar el pago.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── clinicas ────────────────────────────────────────────────
ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ── planes ──────────────────────────────────────────────────
ALTER TABLE public.planes
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- ── Índice para lookup rápido por subscription_id ───────────
CREATE INDEX IF NOT EXISTS idx_clinicas_stripe_subscription
  ON public.clinicas (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── Comentarios ─────────────────────────────────────────────
COMMENT ON COLUMN public.clinicas.stripe_customer_id IS
  'ID de cliente en Stripe (cus_xxx). Se crea en stripe-checkout si no existe.';

COMMENT ON COLUMN public.clinicas.stripe_subscription_id IS
  'ID de suscripción activa en Stripe (sub_xxx). Se guarda al confirmar checkout.session.completed.';

COMMENT ON COLUMN public.planes.stripe_price_id IS
  'Price ID de Stripe (price_xxx). Necesario para crear la Checkout Session.';
