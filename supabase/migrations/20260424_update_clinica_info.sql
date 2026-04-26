-- ============================================================
-- Permite a un usuario pabellón/admin_clinica actualizar la
-- información de contacto de su propia clínica.
-- Cada clínica edita solo sus propios datos (SECURITY DEFINER).
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_clinica_info(
  p_nombre         TEXT DEFAULT NULL,
  p_ciudad         TEXT DEFAULT NULL,
  p_telefono       TEXT DEFAULT NULL,
  p_email_contacto TEXT DEFAULT NULL
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

  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'Sin clínica asociada';
  END IF;

  IF v_role NOT IN ('pabellon', 'admin_clinica') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Solo sobreescribe el campo si el valor enviado no es NULL ni cadena vacía.
  -- Así el frontend puede enviar solo los campos que cambiaron.
  UPDATE public.clinicas SET
    nombre         = CASE WHEN p_nombre         IS NOT NULL AND trim(p_nombre)         <> '' THEN trim(p_nombre)         ELSE nombre         END,
    ciudad         = CASE WHEN p_ciudad         IS NOT NULL AND trim(p_ciudad)         <> '' THEN trim(p_ciudad)         ELSE ciudad         END,
    telefono       = CASE WHEN p_telefono       IS NOT NULL                                   THEN trim(p_telefono)       ELSE telefono       END,
    email_contacto = CASE WHEN p_email_contacto IS NOT NULL                                   THEN trim(p_email_contacto) ELSE email_contacto END,
    updated_at     = now()
  WHERE id = v_clinica_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_clinica_info(TEXT, TEXT, TEXT, TEXT) TO authenticated;
