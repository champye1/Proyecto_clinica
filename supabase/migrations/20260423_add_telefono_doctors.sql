-- Agregar campo telefono a doctors para notificaciones WhatsApp
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS telefono TEXT;

-- Índice para búsquedas por teléfono
CREATE INDEX IF NOT EXISTS idx_doctors_telefono ON public.doctors(telefono)
  WHERE telefono IS NOT NULL;
