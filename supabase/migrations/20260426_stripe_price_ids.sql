-- ============================================================
-- Asigna los Stripe Price IDs a cada plan.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

UPDATE public.planes
SET stripe_price_id = 'price_1TQZJc57LtgS7tfzdGHxUvyF'
WHERE id = 'da72ab24-c45f-4ec3-9b06-fedeb398fb09';   -- Básico

UPDATE public.planes
SET stripe_price_id = 'price_1TQZJd57LtgS7tfzaDjZZz4e'
WHERE id = '0b8f6d65-7048-43e0-a51c-ed6ab3f31474';   -- Estándar

UPDATE public.planes
SET stripe_price_id = 'price_1TQXqS57LtgS7tfzDTyT1qKC'
WHERE id = '76268c92-073d-49e4-a1bb-7bb9dd1cf358';   -- Pro

-- Verificar resultado
SELECT id, nombre, precio_mensual_usd, stripe_price_id FROM public.planes ORDER BY precio_mensual_usd;
