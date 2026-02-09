-- =====================================================
-- Función para login doctor: resolver username -> email
-- Sin esta función, anon no puede leer public.users (RLS)
-- y el login por nombre de usuario fallaba siempre.
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_doctor_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_username IS NULL OR trim(p_username) = '' THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.users
  WHERE role = 'doctor'
    AND deleted_at IS NULL
    AND username IS NOT NULL
    AND lower(trim(username)) = lower(trim(p_username))
  LIMIT 1;

  RETURN v_email;
END;
$$;

COMMENT ON FUNCTION public.get_doctor_email_by_username(TEXT) IS
  'Devuelve el email del doctor para el username dado. Usado en login sin exponer la tabla users a anon.';

-- Permitir que anon llame esta función (solo devuelve un email si el username existe)
GRANT EXECUTE ON FUNCTION public.get_doctor_email_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_doctor_email_by_username(TEXT) TO authenticated;

-- =====================================================
-- BACKFILL: Rellenar username en users para doctores existentes
-- (cuentas creadas antes de guardar el username en create-doctor)
-- Fórmula: primera letra del nombre + apellido en minúsculas
-- =====================================================
UPDATE public.users u
SET username = sub.nick
FROM (
  SELECT d.user_id,
         lower(left(trim(d.nombre), 1)) || lower(replace(trim(d.apellido), ' ', '')) AS nick
  FROM public.doctors d
  WHERE d.deleted_at IS NULL
    AND d.acceso_web_enabled = true
    AND d.user_id IS NOT NULL
) sub
WHERE u.id = sub.user_id
  AND u.role = 'doctor'
  AND (u.username IS NULL OR u.username = '')
  AND NOT EXISTS (SELECT 1 FROM public.users u2 WHERE u2.username = sub.nick AND u2.id <> u.id AND u2.deleted_at IS NULL);
