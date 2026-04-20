-- ============================================================
-- FIX: Reemplaza todas las funciones que referenciaban
-- la tabla "user_roles" inexistente.
-- La tabla correcta es "public.users" con columna "role".
-- is_super_admin() y get_my_clinica_id() ya existen (20260417).
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Step 1: DROP todas las funciones rotas ────────────────────
DROP FUNCTION IF EXISTS get_all_usuarios();
DROP FUNCTION IF EXISTS admin_crear_clinica(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,UUID,INT);
DROP FUNCTION IF EXISTS admin_desactivar_usuario(UUID);
DROP FUNCTION IF EXISTS get_all_clinicas();
DROP FUNCTION IF EXISTS get_admin_stats();
DROP FUNCTION IF EXISTS extender_trial(UUID, INT);
DROP FUNCTION IF EXISTS admin_activar_plan(UUID, UUID);
DROP FUNCTION IF EXISTS actualizar_plan_clinica(UUID);

-- ── Step 2: Recrear usando public.users + helpers existentes ──

-- ── get_all_usuarios ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_all_usuarios()
RETURNS TABLE (
  user_id        UUID,
  email          TEXT,
  nombre         TEXT,
  rol            TEXT,
  activo         BOOLEAN,
  clinica_id     UUID,
  clinica_nombre TEXT,
  created_at     TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN QUERY
  SELECT
    u.id                                                              AS user_id,
    u.email::TEXT,
    COALESCE(
      d.nombre || ' ' || d.apellido,
      p.nombre,
      u.email
    )::TEXT                                                           AS nombre,
    u.role::TEXT                                                      AS rol,
    CASE
      WHEN u.role = 'doctor'   THEN COALESCE(d.estado = 'activo', TRUE)
      WHEN u.role = 'pabellon' THEN COALESCE(p.activo, TRUE)
      ELSE TRUE
    END                                                               AS activo,
    u.clinica_id,
    c.nombre::TEXT                                                    AS clinica_nombre,
    u.created_at
  FROM public.users u
  LEFT JOIN doctors d         ON d.user_id    = u.id AND d.deleted_at IS NULL
  LEFT JOIN pabellon_users p  ON p.user_id    = u.id
  LEFT JOIN clinicas c        ON c.id         = u.clinica_id
  WHERE u.deleted_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_usuarios() TO authenticated;


-- ── admin_crear_clinica ───────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_crear_clinica(
  p_nombre         TEXT,
  p_rut            TEXT DEFAULT NULL,
  p_ciudad         TEXT DEFAULT NULL,
  p_region         TEXT DEFAULT NULL,
  p_direccion      TEXT DEFAULT NULL,
  p_telefono       TEXT DEFAULT NULL,
  p_email_contacto TEXT DEFAULT NULL,
  p_plan_id        UUID DEFAULT NULL,
  p_trial_dias     INT  DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clinica_id UUID;
  v_codigo     TEXT;
BEGIN
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado');
  END IF;

  v_codigo := upper(substring(md5(random()::TEXT) FROM 1 FOR 4)) || '-' ||
              upper(substring(md5(random()::TEXT) FROM 1 FOR 4));

  INSERT INTO clinicas (
    nombre, rut, ciudad, region, direccion, telefono, email_contacto,
    plan_id, estado, trial_hasta, codigo_acceso
  )
  VALUES (
    p_nombre, p_rut, p_ciudad, p_region, p_direccion, p_telefono, p_email_contacto,
    p_plan_id,
    CASE WHEN p_plan_id IS NOT NULL THEN 'activo' ELSE 'trial' END,
    NOW() + (p_trial_dias || ' days')::INTERVAL,
    v_codigo
  )
  RETURNING id INTO v_clinica_id;

  RETURN jsonb_build_object(
    'success',       true,
    'clinica_id',    v_clinica_id,
    'codigo_acceso', v_codigo
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_crear_clinica(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,UUID,INT) TO authenticated;


-- ── admin_desactivar_usuario ──────────────────────────────────
CREATE OR REPLACE FUNCTION admin_desactivar_usuario(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  UPDATE doctors
  SET estado = 'inactivo', updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE pabellon_users
  SET activo = false, updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.users
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_desactivar_usuario(UUID) TO authenticated;


-- ── get_admin_stats ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN jsonb_build_object(
    'total_clinicas',     (SELECT COUNT(*) FROM clinicas),
    'clinicas_en_trial',  (SELECT COUNT(*) FROM clinicas WHERE estado = 'trial' AND trial_hasta >= NOW()),
    'clinicas_activas',   (SELECT COUNT(*) FROM clinicas WHERE estado = 'activo'),
    'clinicas_expiradas', (SELECT COUNT(*) FROM clinicas WHERE (estado = 'trial' AND trial_hasta < NOW()) OR estado = 'expirado'),
    'total_doctores',     (SELECT COUNT(*) FROM doctors WHERE deleted_at IS NULL),
    'total_cirugias',     (SELECT COUNT(*) FROM surgeries WHERE deleted_at IS NULL)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;


-- ── get_all_clinicas ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_all_clinicas()
RETURNS TABLE (
  id             UUID,
  nombre         TEXT,
  ciudad         TEXT,
  estado         TEXT,
  trial_hasta    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ,
  plan_nombre    TEXT,
  total_doctores BIGINT,
  total_cirugias BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
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
    p.nombre::TEXT                                                   AS plan_nombre,
    (SELECT COUNT(*) FROM doctors  d WHERE d.clinica_id = c.id AND d.deleted_at IS NULL),
    (SELECT COUNT(*) FROM surgeries s WHERE s.clinica_id = c.id AND s.deleted_at IS NULL)
  FROM clinicas c
  LEFT JOIN planes p ON p.id = c.plan_id
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_clinicas() TO authenticated;


-- ── extender_trial ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION extender_trial(
  p_clinica_id UUID,
  p_dias       INT DEFAULT 14
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
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

GRANT EXECUTE ON FUNCTION extender_trial(UUID, INT) TO authenticated;


-- ── admin_activar_plan ────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_activar_plan(
  p_clinica_id UUID,
  p_plan_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_super_admin() THEN
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

GRANT EXECUTE ON FUNCTION admin_activar_plan(UUID, UUID) TO authenticated;


-- ── actualizar_plan_clinica ───────────────────────────────────
-- Permite que el admin de una clínica seleccione su plan.
-- Usa get_my_clinica_id() en lugar de user_roles.
CREATE OR REPLACE FUNCTION actualizar_plan_clinica(p_plan_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clinica_id UUID;
BEGIN
  v_clinica_id := get_my_clinica_id();

  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró clínica para el usuario';
  END IF;

  UPDATE clinicas
  SET
    plan_id    = p_plan_id,
    estado     = 'activo',
    updated_at = NOW()
  WHERE id = v_clinica_id;
END;
$$;

GRANT EXECUTE ON FUNCTION actualizar_plan_clinica(UUID) TO authenticated;


-- ── Recargar schema de PostgREST ──────────────────────────────
NOTIFY pgrst, 'reload schema';
