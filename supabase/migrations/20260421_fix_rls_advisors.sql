-- ============================================================
-- FIX: Corregir advertencias del Security Advisor de Supabase
-- 1. Habilitar RLS en broadcast_notifications
-- 2. Eliminar políticas INSERT permisivas (WITH CHECK true)
-- 3. Optimizar evaluación de auth.uid() en políticas (select auth.uid())
-- ============================================================


-- ── 1. BROADCAST_NOTIFICATIONS: habilitar RLS + política ─────
--    Esta tabla no tiene clinica_id: son notificaciones globales
--    dirigidas por rol (dirigido_a: 'pabellon', 'doctor', etc.)
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver broadcasts activos" ON public.broadcast_notifications;
DROP POLICY IF EXISTS "Super admin puede gestionar broadcasts"               ON public.broadcast_notifications;

CREATE POLICY "Usuarios autenticados pueden ver broadcasts activos"
  ON public.broadcast_notifications FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Super admin puede gestionar broadcasts"
  ON public.broadcast_notifications FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ── 2. Eliminar políticas INSERT con WITH CHECK (true) ────────
--    Las funciones/triggers SECURITY DEFINER y service_role
--    bypasean RLS de todas formas — estas políticas no protegen nada.

-- audit_logs
DROP POLICY IF EXISTS "Sistema puede crear logs de auditoría" ON public.audit_logs;
CREATE POLICY "Sistema puede crear logs de auditoría"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- external_messages: eliminar la vieja política duplicada
DROP POLICY IF EXISTS "external_messages_public_insert" ON public.external_messages;
-- La política "Sistema puede insertar mensajes externos" la manejamos con service_role
-- que bypasea RLS, así que la eliminamos y no necesitamos reemplazarla.
DROP POLICY IF EXISTS "Sistema puede insertar mensajes externos" ON public.external_messages;

-- notifications
DROP POLICY IF EXISTS "Sistema puede crear notificaciones" ON public.notifications;
CREATE POLICY "Sistema puede crear notificaciones"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (clinica_id = get_my_clinica_id());


-- ── 3. Optimizar auth.uid() con (select auth.uid()) ──────────
--    Reemplaza las políticas que llaman auth.uid() sin subquery,
--    lo que hace que Postgres re-evalúe la función fila a fila.

-- USERS
DROP POLICY IF EXISTS "Pabellón puede ver usuarios de su clínica"       ON public.users;
DROP POLICY IF EXISTS "Pabellón puede crear usuarios en su clínica"     ON public.users;
DROP POLICY IF EXISTS "Pabellón puede actualizar usuarios de su clínica" ON public.users;

CREATE POLICY "Pabellón puede ver usuarios de su clínica"
  ON public.users FOR SELECT
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
    OR (select auth.uid()) = id
  );

CREATE POLICY "Pabellón puede crear usuarios en su clínica"
  ON public.users FOR INSERT
  WITH CHECK (
    is_pabellon() AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Pabellón puede actualizar usuarios de su clínica"
  ON public.users FOR UPDATE
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR (select auth.uid()) = id
  )
  WITH CHECK (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR (select auth.uid()) = id
  );


-- DOCTORS
DROP POLICY IF EXISTS "Doctor puede ver su propio registro"       ON public.doctors;
DROP POLICY IF EXISTS "Doctor puede actualizar su propio registro" ON public.doctors;

CREATE POLICY "Doctor puede ver su propio registro"
  ON public.doctors FOR SELECT
  USING (
    user_id = (select auth.uid())
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede actualizar su propio registro"
  ON public.doctors FOR UPDATE
  USING (
    user_id = (select auth.uid())
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  )
  WITH CHECK (
    user_id = (select auth.uid())
    AND clinica_id = get_my_clinica_id()
  );


-- NOTIFICATIONS
DROP POLICY IF EXISTS "Usuarios pueden ver sus notificaciones de su clínica"   ON public.notifications;
DROP POLICY IF EXISTS "Usuarios pueden marcar sus notificaciones como vistas"   ON public.notifications;

CREATE POLICY "Usuarios pueden ver sus notificaciones de su clínica"
  ON public.notifications FOR SELECT
  USING (
    user_id = (select auth.uid())
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Usuarios pueden marcar sus notificaciones como vistas"
  ON public.notifications FOR UPDATE
  USING (user_id = (select auth.uid()) AND clinica_id = get_my_clinica_id())
  WITH CHECK (user_id = (select auth.uid()));


-- REMINDERS
DROP POLICY IF EXISTS "Usuarios pueden ver sus recordatorios de su clínica" ON public.reminders;
DROP POLICY IF EXISTS "Usuarios pueden crear recordatorios en su clínica"   ON public.reminders;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus recordatorios"         ON public.reminders;

CREATE POLICY "Usuarios pueden ver sus recordatorios de su clínica"
  ON public.reminders FOR SELECT
  USING (
    user_id = (select auth.uid())
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Usuarios pueden crear recordatorios en su clínica"
  ON public.reminders FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Usuarios pueden actualizar sus recordatorios"
  ON public.reminders FOR UPDATE
  USING (user_id = (select auth.uid()) AND clinica_id = get_my_clinica_id())
  WITH CHECK (user_id = (select auth.uid()));
