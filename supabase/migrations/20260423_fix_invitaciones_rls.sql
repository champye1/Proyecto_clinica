-- ============================================================
-- FIX: Cerrar política SELECT permisiva en invitaciones.
-- Antes: USING (true) — cualquier autenticado podía leer todas.
-- Después:
--   • Anon/no autenticado: no puede hacer SELECT directo.
--   • Autenticado: solo ve sus propias invitaciones (email coincide).
--   • Pabellón/super admin: acceso total a las de su clínica (política existente).
-- La lectura por código para el flujo de registro usa la función
-- check_invitation_code (SECURITY DEFINER), que no expone otros registros.
-- ============================================================

-- ── 1. Reemplazar la política permisiva ───────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invitaciones'
  ) THEN
    DROP POLICY IF EXISTS "Invitado puede leer su propia invitación" ON public.invitaciones;

    CREATE POLICY "Invitado puede leer su propia invitación"
      ON public.invitaciones FOR SELECT
      TO authenticated
      USING (email = auth.email());
  END IF;
END;
$$;


-- ── 2. Función para validar código sin exponer la tabla ───────
CREATE OR REPLACE FUNCTION public.check_invitation_code(p_codigo text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv record;
BEGIN
  SELECT id, rol, clinica_id, email, usado, activo, expires_at
  INTO v_inv
  FROM public.invitaciones
  WHERE codigo = upper(trim(p_codigo))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('valido', false, 'error', 'Código no encontrado. Verifica que esté bien escrito.');
  END IF;

  IF v_inv.usado THEN
    RETURN json_build_object('valido', false, 'error', 'Este código ya fue utilizado.');
  END IF;

  IF v_inv.activo = false THEN
    RETURN json_build_object('valido', false, 'error', 'Esta invitación ha sido desactivada. Solicita una nueva al administrador.');
  END IF;

  IF v_inv.expires_at < now() THEN
    RETURN json_build_object('valido', false, 'error', 'El código expiró. Solicita uno nuevo al administrador.');
  END IF;

  RETURN json_build_object(
    'valido', true,
    'invitacion', json_build_object(
      'id',         v_inv.id,
      'rol',        v_inv.rol,
      'clinica_id', v_inv.clinica_id,
      'email',      v_inv.email,
      'usado',      v_inv.usado,
      'activo',     v_inv.activo,
      'expires_at', v_inv.expires_at
    )
  );
END;
$$;

-- Permitir que roles anon y authenticated llamen a la función
GRANT EXECUTE ON FUNCTION public.check_invitation_code(text) TO anon, authenticated;
