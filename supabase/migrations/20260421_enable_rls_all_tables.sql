-- ============================================================
-- CRÍTICO: Habilitar Row-Level Security en todas las tablas
-- y agregar políticas para las tablas que carecían de ellas.
-- ============================================================

-- ── 1. Habilitar RLS (tolerante a tablas inexistentes) ────────
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'users', 'doctors', 'patients', 'operating_rooms',
    'surgeries', 'surgery_requests', 'surgery_request_supplies',
    'surgery_supplies', 'schedule_blocks', 'supplies',
    'notifications', 'reminders', 'audit_logs',
    'external_messages', 'invitaciones', 'clinica_actividad',
    'clinicas', 'planes', 'pabellon_users'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END;
$$;


-- ── 2. EXTERNAL_MESSAGES ──────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='external_messages') THEN
    DROP POLICY IF EXISTS "Pabellón acceso total a mensajes de su clínica" ON public.external_messages;
    DROP POLICY IF EXISTS "Sistema puede insertar mensajes externos"        ON public.external_messages;

    CREATE POLICY "Pabellón acceso total a mensajes de su clínica"
      ON public.external_messages FOR ALL
      USING (
        (is_pabellon() AND clinica_id = get_my_clinica_id())
        OR is_super_admin()
      )
      WITH CHECK (is_pabellon() AND clinica_id = get_my_clinica_id());

    CREATE POLICY "Sistema puede insertar mensajes externos"
      ON public.external_messages FOR INSERT
      WITH CHECK (true);
  END IF;
END;
$$;


-- ── 3. INVITACIONES ───────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invitaciones') THEN
    DROP POLICY IF EXISTS "Pabellón acceso total a invitaciones de su clínica" ON public.invitaciones;
    DROP POLICY IF EXISTS "Invitado puede leer su propia invitación"            ON public.invitaciones;

    CREATE POLICY "Pabellón acceso total a invitaciones de su clínica"
      ON public.invitaciones FOR ALL
      USING (
        (is_pabellon() AND clinica_id = get_my_clinica_id())
        OR is_super_admin()
      )
      WITH CHECK (is_pabellon() AND clinica_id = get_my_clinica_id());

    CREATE POLICY "Invitado puede leer su propia invitación"
      ON public.invitaciones FOR SELECT
      USING (true);
  END IF;
END;
$$;


-- ── 4. CLINICAS ───────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clinicas') THEN
    DROP POLICY IF EXISTS "Super admin acceso total a clínicas"          ON public.clinicas;
    DROP POLICY IF EXISTS "Usuarios autenticados pueden ver su clínica"  ON public.clinicas;

    CREATE POLICY "Super admin acceso total a clínicas"
      ON public.clinicas FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());

    CREATE POLICY "Usuarios autenticados pueden ver su clínica"
      ON public.clinicas FOR SELECT
      USING (id = get_my_clinica_id());
  END IF;
END;
$$;


-- ── 5. PLANES ─────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='planes') THEN
    DROP POLICY IF EXISTS "Usuarios autenticados pueden ver planes" ON public.planes;
    DROP POLICY IF EXISTS "Super admin puede gestionar planes"      ON public.planes;

    CREATE POLICY "Usuarios autenticados pueden ver planes"
      ON public.planes FOR SELECT TO authenticated
      USING (true);

    CREATE POLICY "Super admin puede gestionar planes"
      ON public.planes FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;
END;
$$;


-- ── 6. PABELLON_USERS ─────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pabellon_users') THEN
    DROP POLICY IF EXISTS "Pabellón acceso a pabellon_users de su clínica" ON public.pabellon_users;
    DROP POLICY IF EXISTS "Usuario pabellón puede ver su propio registro"  ON public.pabellon_users;

    CREATE POLICY "Pabellón acceso a pabellon_users de su clínica"
      ON public.pabellon_users FOR ALL
      USING (
        (is_pabellon() AND clinica_id = get_my_clinica_id())
        OR is_super_admin()
      )
      WITH CHECK (is_pabellon() AND clinica_id = get_my_clinica_id());

    CREATE POLICY "Usuario pabellón puede ver su propio registro"
      ON public.pabellon_users FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END;
$$;
