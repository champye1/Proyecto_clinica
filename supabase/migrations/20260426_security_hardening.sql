-- ============================================================
-- Security Hardening — Ley 21.719 & mejoras de seguridad
-- 1. Restricción audit_logs INSERT: solo usuario autenticado de la misma clínica
-- 2. Política de retención de datos (documentación en DB)
-- 3. Función helper para auditar accesos sensibles
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. AUDIT_LOGS: restringir INSERT a la clínica del usuario ─
DROP POLICY IF EXISTS "Sistema puede crear logs de auditoría" ON public.audit_logs;

CREATE POLICY "Sistema puede crear logs de auditoría"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Solo puede insertar logs de su propia clínica
    clinica_id = get_my_clinica_id()
  );

-- ── 2. TABLA DE POLÍTICA DE RETENCIÓN (auditoría legal) ───────
-- Documenta la política de retención de datos según Ley 20.584
-- (fichas clínicas: mínimo 15 años)
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla         TEXT NOT NULL UNIQUE,
  descripcion   TEXT NOT NULL,
  retencion_dias INTEGER NOT NULL,
  base_legal    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo super admin puede ver retención"
  ON public.data_retention_policies FOR SELECT
  USING (is_super_admin());

INSERT INTO public.data_retention_policies
  (tabla, descripcion, retencion_dias, base_legal)
VALUES
  ('patients',         'Datos de pacientes (nombre, RUT, fecha nacimiento)',       5475, 'Ley 20.584 art. 12 — mínimo 15 años'),
  ('surgeries',        'Registros de cirugías realizadas',                         5475, 'Ley 20.584 art. 12 — mínimo 15 años'),
  ('surgery_requests', 'Solicitudes quirúrgicas (incluso rechazadas)',              5475, 'Ley 20.584 art. 12 — mínimo 15 años'),
  ('audit_logs',       'Logs de auditoría del sistema',                            1825, 'Ley 21.719 art. 14 — 5 años mínimo'),
  ('notifications',    'Notificaciones de usuarios',                                365, 'Política interna — 1 año'),
  ('users',            'Cuentas de usuarios del sistema',                          1095, 'Ley 21.719 — 3 años post desactivación'),
  ('doctors',          'Perfil y datos de médicos',                                1825, 'Ley 21.719 — 5 años post desactivación')
ON CONFLICT (tabla) DO NOTHING;

-- ── 3. FUNCIÓN: registrar acceso a datos sensibles de paciente ─
CREATE OR REPLACE FUNCTION public.log_patient_access(
  p_patient_id   UUID,
  p_action       TEXT,
  p_description  TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    clinica_id,
    user_id,
    action,
    table_name,
    record_id,
    description,
    created_at
  )
  SELECT
    u.clinica_id,
    auth.uid(),
    p_action,
    'patients',
    p_patient_id,
    p_description,
    NOW()
  FROM public.users u
  WHERE u.id = auth.uid();
END;
$$;

-- ── 4. TABLA CONSENTIMIENTOS (cumplimiento Ley 21.719) ─────────
-- Registra el consentimiento explícito de cada usuario al registrarse
CREATE TABLE IF NOT EXISTS public.privacy_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id   UUID REFERENCES public.clinicas(id),
  ip_address   TEXT,
  user_agent   TEXT,
  version      TEXT NOT NULL DEFAULT '1.0',
  accepted_at  TIMESTAMPTZ DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ,
  UNIQUE (user_id, version)
);

ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario puede ver su propio consentimiento"
  ON public.privacy_consents FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Sistema puede registrar consentimiento"
  ON public.privacy_consents FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Super admin puede ver todos los consentimientos"
  ON public.privacy_consents FOR SELECT
  USING (is_super_admin());

COMMENT ON TABLE public.privacy_consents IS
  'Registra consentimientos explícitos conforme a Ley 21.719 de Protección de Datos Personales';
