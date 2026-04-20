-- ============================================================
-- Migración: Funciones para crear el Super Administrador
-- de la plataforma SurgicalHUB.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Ejecutar UNA sola vez.
-- ============================================================

-- ── 1. Asegurar que el role 'super_admin' y 'admin_clinica'
--       sean válidos en la columna users.role ────────────────

-- Eliminar constraint anterior si existía con nombre conocido
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_fkey;

-- Agregar constraint actualizado con todos los roles
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'admin_clinica', 'pabellon', 'doctor'));

-- ── 2. Función pública: verificar si ya existe un super admin ─

DROP FUNCTION IF EXISTS public.check_super_admin_exists();

CREATE OR REPLACE FUNCTION public.check_super_admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.users
    WHERE role = 'super_admin'
      AND deleted_at IS NULL
  );
$$;

-- Permitir llamado anónimo (para la página /setup-admin)
GRANT EXECUTE ON FUNCTION public.check_super_admin_exists() TO anon, authenticated;

-- ── 3. Función segura: crear el registro del super admin ──────
--   Solo funciona si NO existe ningún super_admin aún.
--   El usuario en auth.users debe crearse primero desde el
--   cliente (supabase.auth.signUp), luego se llama esta función.

DROP FUNCTION IF EXISTS public.setup_super_admin_record(uuid, text);

CREATE OR REPLACE FUNCTION public.setup_super_admin_record(
  p_user_id uuid,
  p_email   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bloqueo de seguridad: solo procede si aún no hay super_admin
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE role = 'super_admin' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Ya existe un super administrador en la plataforma.';
  END IF;

  -- Insertar o actualizar el registro del super admin
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (p_user_id, p_email, 'super_admin', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET role       = 'super_admin',
        updated_at = NOW();
END;
$$;

-- Solo usuarios autenticados pueden llamar esta función
GRANT EXECUTE ON FUNCTION public.setup_super_admin_record(uuid, text) TO authenticated;

-- ── 4. Comentarios ────────────────────────────────────────────
COMMENT ON FUNCTION public.check_super_admin_exists() IS
  'Devuelve true si ya existe al menos un super_admin activo en la plataforma.';

COMMENT ON FUNCTION public.setup_super_admin_record(uuid, text) IS
  'Registra el primer super administrador. Falla si ya existe uno.';
