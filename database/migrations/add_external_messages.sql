-- =====================================================
-- SISTEMA DE CORREOS EXTERNOS
-- Permite que doctores externos (sin cuenta) envíen
-- mensajes al personal de pabellón
-- =====================================================

CREATE TABLE IF NOT EXISTS public.external_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Datos del remitente (doctor externo)
    nombre_remitente TEXT NOT NULL,
    email_remitente TEXT NOT NULL,
    telefono_remitente TEXT,
    especialidad_remitente TEXT,
    institucion_remitente TEXT,
    -- Contenido del mensaje
    asunto TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    -- Datos del paciente (opcional)
    nombre_paciente TEXT,
    rut_paciente TEXT,
    tipo_cirugia TEXT,
    urgencia TEXT NOT NULL DEFAULT 'normal' CHECK (urgencia IN ('normal', 'urgente', 'electiva')),
    -- Estado
    leido BOOLEAN NOT NULL DEFAULT false,
    leido_at TIMESTAMPTZ,
    leido_por UUID REFERENCES public.users(id),
    archivado BOOLEAN NOT NULL DEFAULT false,
    -- Respuesta interna (notas de pabellón)
    notas_internas TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_external_messages_leido ON public.external_messages(leido) WHERE deleted_at IS NULL;
CREATE INDEX idx_external_messages_created_at ON public.external_messages(created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- RLS: Cualquier usuario anónimo puede INSERT (enviar)
--       Solo pabellón puede SELECT/UPDATE
-- =====================================================
ALTER TABLE public.external_messages ENABLE ROW LEVEL SECURITY;

-- Política: insertar sin autenticación (formulario público)
CREATE POLICY "external_messages_insert_anon"
ON public.external_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política: solo pabellón puede leer
CREATE POLICY "external_messages_select_pabellon"
ON public.external_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'pabellon'
    )
);

-- Política: solo pabellón puede actualizar (marcar leído, notas)
CREATE POLICY "external_messages_update_pabellon"
ON public.external_messages
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'pabellon'
    )
);
