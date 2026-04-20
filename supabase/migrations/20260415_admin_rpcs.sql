-- ============================================================
-- RPCs requeridas por el panel Super Admin
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── get_all_usuarios ─────────────────────────────────────────
-- Devuelve todos los usuarios del sistema con su rol y clínica.
-- Solo accesible por super_admin (verificado por RLS o invoker).
CREATE OR REPLACE FUNCTION get_all_usuarios()
RETURNS TABLE (
  user_id       UUID,
  email         TEXT,
  nombre        TEXT,
  rol           TEXT,
  activo        BOOLEAN,
  clinica_id    UUID,
  clinica_nombre TEXT,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el llamante es super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.rol = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    au.email::TEXT,
    COALESCE(d.nombre || ' ' || d.apellido, p.nombre, 'Sin nombre')::TEXT AS nombre,
    ur.rol::TEXT,
    COALESCE(d.estado = 'activo', true) AS activo,
    ur.clinica_id,
    c.nombre::TEXT AS clinica_nombre,
    ur.created_at
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN doctors d ON d.user_id = ur.user_id
  LEFT JOIN pabellon_users p ON p.user_id = ur.user_id
  LEFT JOIN clinicas c ON c.id = ur.clinica_id
  ORDER BY ur.created_at DESC;
END;
$$;

-- ── admin_crear_clinica ───────────────────────────────────────
-- Crea una nueva clínica con trial y opcionalmente asigna un plan.
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
  -- Verificar super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND rol = 'super_admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado');
  END IF;

  -- Generar código de acceso único
  v_codigo := upper(substring(md5(random()::TEXT) FROM 1 FOR 4)) || '-' ||
              upper(substring(md5(random()::TEXT) FROM 1 FOR 4));

  -- Insertar clínica
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
    'success',        true,
    'clinica_id',     v_clinica_id,
    'codigo_acceso',  v_codigo
  );
END;
$$;

-- ── admin_desactivar_usuario ──────────────────────────────────
-- Desactiva (soft) un usuario del sistema.
CREATE OR REPLACE FUNCTION admin_desactivar_usuario(p_user_id UUID)
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

  -- Marcar doctor como inactivo si aplica
  UPDATE doctors SET estado = 'inactivo', updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Marcar pabellon_user como inactivo si aplica
  UPDATE pabellon_users SET activo = false, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;
