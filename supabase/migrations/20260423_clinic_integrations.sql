-- ============================================================
-- Integraciones por clínica: Gmail polling + WhatsApp (Twilio)
-- Cada clínica configura sus propias credenciales.
-- Los tokens sensibles nunca se exponen al cliente —
-- se acceden solo via SECURITY DEFINER o service_role.
-- ============================================================

-- ── 1. Columnas en clinicas ──────────────────────────────────
ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS gmail_email            TEXT,
  ADD COLUMN IF NOT EXISTS gmail_refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS gmail_polling_enabled  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS twilio_account_sid     TEXT,
  ADD COLUMN IF NOT EXISTS twilio_auth_token      TEXT,
  ADD COLUMN IF NOT EXISTS twilio_whatsapp_from   TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled       BOOLEAN NOT NULL DEFAULT false;

-- ── 2. clinica_id en external_messages ──────────────────────
ALTER TABLE public.external_messages
  ADD COLUMN IF NOT EXISTS clinica_id UUID
    REFERENCES public.clinicas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ext_msg_clinica_id
  ON public.external_messages(clinica_id);

-- ── 3. RLS en external_messages ─────────────────────────────
ALTER TABLE public.external_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Clínica ve sus mensajes"              ON public.external_messages;
  DROP POLICY IF EXISTS "Clínica actualiza sus mensajes"       ON public.external_messages;
  DROP POLICY IF EXISTS "Service role inserta mensajes"        ON public.external_messages;
  DROP POLICY IF EXISTS "Anon puede enviar formulario de contacto" ON public.external_messages;
END;
$$;

CREATE POLICY "Clínica ve sus mensajes"
  ON public.external_messages FOR SELECT
  TO authenticated
  USING (
    clinica_id IS NULL
    OR clinica_id = (SELECT clinica_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Clínica actualiza sus mensajes"
  ON public.external_messages FOR UPDATE
  TO authenticated
  USING (
    clinica_id IS NULL
    OR clinica_id = (SELECT clinica_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Service role inserta mensajes"
  ON public.external_messages FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Anon puede enviar formulario de contacto"
  ON public.external_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── 4. get_my_clinic_integrations ───────────────────────────
-- Retorna config NO sensible (sin tokens) para el frontend.
CREATE OR REPLACE FUNCTION public.get_my_clinic_integrations()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinica_id UUID;
  v_row        record;
BEGIN
  SELECT clinica_id INTO v_clinica_id
  FROM public.users WHERE id = auth.uid();

  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'Sin clínica asociada';
  END IF;

  SELECT
    gmail_email,
    (gmail_refresh_token IS NOT NULL AND gmail_refresh_token <> '') AS gmail_connected,
    gmail_polling_enabled,
    twilio_account_sid,
    (twilio_auth_token IS NOT NULL AND twilio_auth_token <> '') AS twilio_configured,
    twilio_whatsapp_from,
    whatsapp_enabled
  INTO v_row
  FROM public.clinicas
  WHERE id = v_clinica_id;

  RETURN json_build_object(
    'clinica_id',            v_clinica_id,
    'gmail_email',           v_row.gmail_email,
    'gmail_connected',       COALESCE(v_row.gmail_connected, false),
    'gmail_polling_enabled', COALESCE(v_row.gmail_polling_enabled, false),
    'twilio_account_sid',    v_row.twilio_account_sid,
    'twilio_configured',     COALESCE(v_row.twilio_configured, false),
    'twilio_whatsapp_from',  v_row.twilio_whatsapp_from,
    'whatsapp_enabled',      COALESCE(v_row.whatsapp_enabled, false)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_clinic_integrations() TO authenticated;

-- ── 5. save_twilio_config ────────────────────────────────────
-- Acepta campos vacíos (no sobreescribe el token si se omite).
CREATE OR REPLACE FUNCTION public.save_twilio_config(
  p_account_sid    TEXT,
  p_auth_token     TEXT,
  p_whatsapp_from  TEXT,
  p_enabled        BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinica_id UUID;
  v_role       TEXT;
BEGIN
  SELECT clinica_id, role INTO v_clinica_id, v_role
  FROM public.users WHERE id = auth.uid();

  IF v_clinica_id IS NULL THEN RAISE EXCEPTION 'Sin clínica'; END IF;
  IF v_role NOT IN ('pabellon', 'admin_clinica') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.clinicas SET
    twilio_account_sid   = CASE WHEN COALESCE(p_account_sid, '')  <> '' THEN p_account_sid  ELSE twilio_account_sid  END,
    twilio_auth_token    = CASE WHEN COALESCE(p_auth_token, '')   <> '' THEN p_auth_token   ELSE twilio_auth_token   END,
    twilio_whatsapp_from = CASE WHEN COALESCE(p_whatsapp_from,'') <> '' THEN p_whatsapp_from ELSE twilio_whatsapp_from END,
    whatsapp_enabled     = p_enabled,
    updated_at = now()
  WHERE id = v_clinica_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_twilio_config(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ── 6. save_gmail_tokens ─────────────────────────────────────
-- Llamado exclusivamente por la edge function gmail-exchange-token
-- con service_role key — el refresh_token nunca pasa por el cliente.
CREATE OR REPLACE FUNCTION public.save_gmail_tokens(
  p_clinica_id    UUID,
  p_gmail_email   TEXT,
  p_refresh_token TEXT,
  p_enabled       BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clinicas SET
    gmail_email           = p_gmail_email,
    gmail_refresh_token   = p_refresh_token,
    gmail_polling_enabled = p_enabled,
    updated_at = now()
  WHERE id = p_clinica_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Clínica no encontrada'; END IF;
  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_gmail_tokens(UUID, TEXT, TEXT, BOOLEAN) TO service_role;

-- ── 7. toggle_gmail_polling ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_gmail_polling(p_enabled BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinica_id UUID;
  v_role       TEXT;
BEGIN
  SELECT clinica_id, role INTO v_clinica_id, v_role
  FROM public.users WHERE id = auth.uid();

  IF v_role NOT IN ('pabellon', 'admin_clinica') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.clinicas
  SET gmail_polling_enabled = p_enabled, updated_at = now()
  WHERE id = v_clinica_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_gmail_polling(BOOLEAN) TO authenticated;

-- ── 8. disconnect_gmail ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.disconnect_gmail()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinica_id UUID;
  v_role       TEXT;
BEGIN
  SELECT clinica_id, role INTO v_clinica_id, v_role
  FROM public.users WHERE id = auth.uid();

  IF v_role NOT IN ('pabellon', 'admin_clinica') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.clinicas SET
    gmail_email           = NULL,
    gmail_refresh_token   = NULL,
    gmail_polling_enabled = false,
    updated_at = now()
  WHERE id = v_clinica_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.disconnect_gmail() TO authenticated;
