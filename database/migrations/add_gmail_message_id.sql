-- Agrega campo para evitar duplicados al importar emails de Gmail
ALTER TABLE public.external_messages
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS fuente TEXT NOT NULL DEFAULT 'formulario'
    CHECK (fuente IN ('formulario', 'gmail'));

CREATE INDEX IF NOT EXISTS idx_external_messages_gmail_id
  ON public.external_messages(gmail_message_id)
  WHERE gmail_message_id IS NOT NULL;
