-- Función de debug temporal — para borrar luego
DROP FUNCTION IF EXISTS debug_auth_uid();

CREATE OR REPLACE FUNCTION debug_auth_uid()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'auth_uid',       auth.uid(),
    'is_super_admin', is_super_admin(),
    'super_admin_exists', EXISTS(
      SELECT 1 FROM public.users
      WHERE role = 'super_admin' AND deleted_at IS NULL
    ),
    'caller_in_users', EXISTS(
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
    ),
    'caller_role', (
      SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1
    )
  );
$$;

GRANT EXECUTE ON FUNCTION debug_auth_uid() TO authenticated, anon;
NOTIFY pgrst, 'reload schema';
