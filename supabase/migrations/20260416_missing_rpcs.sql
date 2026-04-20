-- ============================================================
-- RPCs faltantes para demo completo de SurgicalHUB
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- DROP previos para evitar conflictos de tipo de retorno
DROP FUNCTION IF EXISTS actualizar_plan_clinica(UUID);
DROP FUNCTION IF EXISTS get_admin_stats();
DROP FUNCTION IF EXISTS get_all_clinicas();
DROP FUNCTION IF EXISTS extender_trial(UUID, INT);
DROP FUNCTION IF EXISTS admin_activar_plan(UUID, UUID);

-- ── actualizar_plan_clinica ───────────────────────────────────
-- Permite que el admin de una clínica seleccione su plan durante el onboarding.
CREATE OR REPLACE FUNCTION actualizar_plan_clinica(p_plan_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clinica_id UUID;
BEGIN
  -- Obtener la clínica del usuario logueado
  SELECT clinica_id INTO v_clinica_id
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró clínica para el usuario';
  END IF;

  UPDATE clinicas
  SET
    plan_id   = p_plan_id,
    estado    = 'activo',
    updated_at = NOW()
  WHERE id = v_clinica_id;
END;
$$;


-- ── get_admin_stats ───────────────────────────────────────────
-- Estadísticas globales para el Super Admin dashboard.
-- Retorna conteos de clínicas, médicos y cirugías.
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  SELECT jsonb_build_object(
    'total_clinicas',      (SELECT COUNT(*) FROM clinicas),
    'clinicas_en_trial',   (SELECT COUNT(*) FROM clinicas WHERE estado = 'trial' AND trial_hasta >= NOW()),
    'clinicas_activas',    (SELECT COUNT(*) FROM clinicas WHERE estado = 'activo'),
    'clinicas_expiradas',  (SELECT COUNT(*) FROM clinicas WHERE (estado = 'trial' AND trial_hasta < NOW()) OR estado = 'expirado'),
    'total_doctores',      (SELECT COUNT(*) FROM doctors WHERE deleted_at IS NULL),
    'total_cirugias',      (SELECT COUNT(*) FROM surgeries WHERE deleted_at IS NULL)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ── get_all_clinicas ──────────────────────────────────────────
-- Lista todas las clínicas con su estado, plan y métricas.
-- Solo accesible por super_admin.
CREATE OR REPLACE FUNCTION get_all_clinicas()
RETURNS TABLE (
  id              UUID,
  nombre          TEXT,
  ciudad          TEXT,
  estado          TEXT,
  trial_hasta     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ,
  plan_nombre     TEXT,
  total_doctores  BIGINT,
  total_cirugias  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.nombre::TEXT,
    c.ciudad::TEXT,
    c.estado::TEXT,
    c.trial_hasta,
    c.created_at,
    p.nombre::TEXT AS plan_nombre,
    (SELECT COUNT(*) FROM doctors d WHERE d.clinica_id = c.id AND d.deleted_at IS NULL),
    (SELECT COUNT(*) FROM surgeries s WHERE s.clinica_id = c.id AND s.deleted_at IS NULL)
  FROM clinicas c
  LEFT JOIN planes p ON p.id = c.plan_id
  ORDER BY c.created_at DESC;
END;
$$;


-- ── extender_trial ────────────────────────────────────────────
-- Extiende el período de trial de una clínica (solo super_admin).
CREATE OR REPLACE FUNCTION extender_trial(
  p_clinica_id UUID,
  p_dias       INT DEFAULT 14
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  UPDATE clinicas
  SET
    trial_hasta = GREATEST(COALESCE(trial_hasta, NOW()), NOW()) + (p_dias || ' days')::INTERVAL,
    estado      = CASE WHEN estado = 'expirado' THEN 'trial' ELSE estado END,
    updated_at  = NOW()
  WHERE id = p_clinica_id;
END;
$$;


-- ── admin_activar_plan ────────────────────────────────────────
-- Activa un plan de pago para una clínica (solo super_admin).
-- Usado para activar clientes que pagaron por fuera de Stripe.
CREATE OR REPLACE FUNCTION admin_activar_plan(
  p_clinica_id UUID,
  p_plan_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  UPDATE clinicas
  SET
    plan_id    = p_plan_id,
    estado     = 'activo',
    updated_at = NOW()
  WHERE id = p_clinica_id;
END;
$$;
