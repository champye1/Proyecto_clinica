-- ============================================================
-- Tabla de códigos de respaldo para MFA.
-- Cada usuario puede tener hasta 8 códigos; se marcan usados.
-- Los hashes son SHA-256 del código en mayúsculas sin guiones.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mfa_backup_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user
  ON public.mfa_backup_codes (user_id)
  WHERE used_at IS NULL;

-- Solo el propio usuario puede ver y modificar sus códigos
ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve sus propios backup codes"
  ON public.mfa_backup_codes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "usuario inserta sus propios backup codes"
  ON public.mfa_backup_codes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "usuario actualiza sus propios backup codes"
  ON public.mfa_backup_codes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "usuario elimina sus propios backup codes"
  ON public.mfa_backup_codes FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.mfa_backup_codes IS
  'Códigos de respaldo para recuperación de acceso cuando se pierde el dispositivo MFA.';
