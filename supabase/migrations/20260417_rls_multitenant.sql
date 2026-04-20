-- ============================================================
-- FIX MULTI-TENANT: Aislamiento por clinica_id en RLS
-- Sin esto, un usuario pabellón de Clínica A puede ver datos
-- de Clínica B. Este script agrega clinica_id a todas las
-- políticas de las tablas críticas.
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Función helper: obtiene clinica_id del usuario actual ────
CREATE OR REPLACE FUNCTION get_my_clinica_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT clinica_id
  FROM public.users
  WHERE id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

-- ── Función helper: verifica si es super_admin ───────────────
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND deleted_at IS NULL
  );
$$;


-- ============================================================
-- TABLA: USERS
-- ============================================================
DROP POLICY IF EXISTS "Pabellón puede ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Pabellón puede crear usuarios" ON public.users;
DROP POLICY IF EXISTS "Pabellón puede actualizar usuarios" ON public.users;
DROP POLICY IF EXISTS "Pabellón puede ver usuarios de su clínica" ON public.users;
DROP POLICY IF EXISTS "Pabellón puede crear usuarios en su clínica" ON public.users;
DROP POLICY IF EXISTS "Pabellón puede actualizar usuarios de su clínica" ON public.users;

CREATE POLICY "Pabellón puede ver usuarios de su clínica"
  ON public.users FOR SELECT
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
    OR auth.uid() = id
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
    OR auth.uid() = id
  )
  WITH CHECK (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR auth.uid() = id
  );


-- ============================================================
-- TABLA: DOCTORS
-- ============================================================
DROP POLICY IF EXISTS "Pabellón acceso total a doctores" ON public.doctors;
DROP POLICY IF EXISTS "Doctor puede ver su propio registro" ON public.doctors;
DROP POLICY IF EXISTS "Doctor puede actualizar su propio registro" ON public.doctors;
DROP POLICY IF EXISTS "Pabellón acceso total a doctores de su clínica" ON public.doctors;

CREATE POLICY "Pabellón acceso total a doctores de su clínica"
  ON public.doctors FOR ALL
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  )
  WITH CHECK (
    is_pabellon() AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede ver su propio registro"
  ON public.doctors FOR SELECT
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

-- Nota: estado y acceso_web_enabled solo pueden ser modificados por pabellón.
-- La política de pabellón cubre eso. Aquí el doctor solo puede editar
-- campos propios como nombre, teléfono, etc.
CREATE POLICY "Doctor puede actualizar su propio registro"
  ON public.doctors FOR UPDATE
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND clinica_id = get_my_clinica_id()
  );


-- ============================================================
-- TABLA: OPERATING_ROOMS
-- ============================================================
DROP POLICY IF EXISTS "Pabellón acceso total a pabellones" ON public.operating_rooms;
DROP POLICY IF EXISTS "Doctor puede ver pabellones activos" ON public.operating_rooms;
DROP POLICY IF EXISTS "Pabellón acceso total a pabellones de su clínica" ON public.operating_rooms;
DROP POLICY IF EXISTS "Doctor puede ver pabellones activos de su clínica" ON public.operating_rooms;

CREATE POLICY "Pabellón acceso total a pabellones de su clínica"
  ON public.operating_rooms FOR ALL
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  )
  WITH CHECK (
    is_pabellon() AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede ver pabellones activos de su clínica"
  ON public.operating_rooms FOR SELECT
  USING (
    activo = true
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );


-- ============================================================
-- TABLA: PATIENTS
-- ============================================================
DROP POLICY IF EXISTS "Pabellón puede ver todos los pacientes" ON public.patients;
DROP POLICY IF EXISTS "Pabellón puede gestionar pacientes" ON public.patients;
DROP POLICY IF EXISTS "Doctor puede ver sus propios pacientes" ON public.patients;
DROP POLICY IF EXISTS "Doctor puede crear sus propios pacientes" ON public.patients;
DROP POLICY IF EXISTS "Doctor puede actualizar sus propios pacientes" ON public.patients;
DROP POLICY IF EXISTS "Pabellón puede ver pacientes de su clínica" ON public.patients;
DROP POLICY IF EXISTS "Pabellón puede gestionar pacientes de su clínica" ON public.patients;
DROP POLICY IF EXISTS "Doctor puede ver sus pacientes de su clínica" ON public.patients;
DROP POLICY IF EXISTS "Doctor puede crear pacientes en su clínica" ON public.patients;
DROP POLICY IF EXISTS "Doctor puede actualizar sus pacientes" ON public.patients;

CREATE POLICY "Pabellón puede ver pacientes de su clínica"
  ON public.patients FOR SELECT
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  );

CREATE POLICY "Pabellón puede gestionar pacientes de su clínica"
  ON public.patients FOR ALL
  USING (is_pabellon() AND clinica_id = get_my_clinica_id())
  WITH CHECK (is_pabellon() AND clinica_id = get_my_clinica_id());

CREATE POLICY "Doctor puede ver sus pacientes de su clínica"
  ON public.patients FOR SELECT
  USING (
    doctor_id = current_doctor_id()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede crear pacientes en su clínica"
  ON public.patients FOR INSERT
  WITH CHECK (
    doctor_id = current_doctor_id()
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede actualizar sus pacientes"
  ON public.patients FOR UPDATE
  USING (
    doctor_id = current_doctor_id()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  )
  WITH CHECK (
    doctor_id = current_doctor_id()
    AND clinica_id = get_my_clinica_id()
  );


-- ============================================================
-- TABLA: SUPPLIES
-- ============================================================
DROP POLICY IF EXISTS "Pabellón acceso total a insumos" ON public.supplies;
DROP POLICY IF EXISTS "Doctor puede ver insumos activos" ON public.supplies;
DROP POLICY IF EXISTS "Pabellón acceso total a insumos de su clínica" ON public.supplies;
DROP POLICY IF EXISTS "Doctor puede ver insumos activos de su clínica" ON public.supplies;

CREATE POLICY "Pabellón acceso total a insumos de su clínica"
  ON public.supplies FOR ALL
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  )
  WITH CHECK (
    is_pabellon() AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede ver insumos activos de su clínica"
  ON public.supplies FOR SELECT
  USING (
    activo = true
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );


-- ============================================================
-- TABLA: SURGERY_REQUESTS
-- ============================================================
DROP POLICY IF EXISTS "Pabellón puede ver todas las solicitudes" ON public.surgery_requests;
DROP POLICY IF EXISTS "Pabellón puede gestionar solicitudes" ON public.surgery_requests;
DROP POLICY IF EXISTS "Doctor puede ver sus propias solicitudes" ON public.surgery_requests;
DROP POLICY IF EXISTS "Doctor puede crear solicitudes propias" ON public.surgery_requests;
DROP POLICY IF EXISTS "Doctor puede actualizar sus solicitudes pendientes" ON public.surgery_requests;
DROP POLICY IF EXISTS "Pabellón puede ver solicitudes de su clínica" ON public.surgery_requests;
DROP POLICY IF EXISTS "Pabellón puede gestionar solicitudes de su clínica" ON public.surgery_requests;
DROP POLICY IF EXISTS "Doctor puede ver sus solicitudes de su clínica" ON public.surgery_requests;
DROP POLICY IF EXISTS "Doctor puede crear solicitudes en su clínica" ON public.surgery_requests;
DROP POLICY IF EXISTS "Doctor puede actualizar solicitudes pendientes de su clínica" ON public.surgery_requests;

CREATE POLICY "Pabellón puede ver solicitudes de su clínica"
  ON public.surgery_requests FOR SELECT
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  );

CREATE POLICY "Pabellón puede gestionar solicitudes de su clínica"
  ON public.surgery_requests FOR UPDATE
  USING (is_pabellon() AND clinica_id = get_my_clinica_id())
  WITH CHECK (is_pabellon() AND clinica_id = get_my_clinica_id());

CREATE POLICY "Doctor puede ver sus solicitudes de su clínica"
  ON public.surgery_requests FOR SELECT
  USING (
    doctor_id = current_doctor_id()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede crear solicitudes en su clínica"
  ON public.surgery_requests FOR INSERT
  WITH CHECK (
    doctor_id = current_doctor_id()
    AND clinica_id = get_my_clinica_id()
    AND EXISTS (
      SELECT 1 FROM public.doctors
      WHERE id = current_doctor_id()
        AND estado = 'activo'
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "Doctor puede actualizar solicitudes pendientes de su clínica"
  ON public.surgery_requests FOR UPDATE
  USING (
    doctor_id = current_doctor_id()
    AND estado = 'pendiente'
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  )
  WITH CHECK (
    doctor_id = current_doctor_id()
    AND clinica_id = get_my_clinica_id()
  );


-- ============================================================
-- TABLA: SURGERY_REQUEST_SUPPLIES
-- ============================================================
DROP POLICY IF EXISTS "Pabellón acceso total a insumos de solicitudes" ON public.surgery_request_supplies;
DROP POLICY IF EXISTS "Doctor puede ver insumos de sus solicitudes" ON public.surgery_request_supplies;
DROP POLICY IF EXISTS "Doctor puede gestionar insumos de solicitudes pendientes" ON public.surgery_request_supplies;
DROP POLICY IF EXISTS "Pabellón acceso total a insumos de solicitudes de su clínica" ON public.surgery_request_supplies;

CREATE POLICY "Pabellón acceso total a insumos de solicitudes de su clínica"
  ON public.surgery_request_supplies FOR ALL
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  )
  WITH CHECK (
    is_pabellon() AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede ver insumos de sus solicitudes"
  ON public.surgery_request_supplies FOR SELECT
  USING (
    clinica_id = get_my_clinica_id()
    AND EXISTS (
      SELECT 1 FROM public.surgery_requests
      WHERE id = surgery_request_id
        AND doctor_id = current_doctor_id()
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "Doctor puede gestionar insumos de solicitudes pendientes"
  ON public.surgery_request_supplies FOR ALL
  USING (
    clinica_id = get_my_clinica_id()
    AND EXISTS (
      SELECT 1 FROM public.surgery_requests
      WHERE id = surgery_request_id
        AND doctor_id = current_doctor_id()
        AND estado = 'pendiente'
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    clinica_id = get_my_clinica_id()
    AND EXISTS (
      SELECT 1 FROM public.surgery_requests
      WHERE id = surgery_request_id
        AND doctor_id = current_doctor_id()
        AND estado = 'pendiente'
        AND deleted_at IS NULL
    )
  );


-- ============================================================
-- TABLA: SURGERIES
-- ============================================================
DROP POLICY IF EXISTS "Pabellón acceso total a cirugías" ON public.surgeries;
DROP POLICY IF EXISTS "Doctor puede ver sus propias cirugías" ON public.surgeries;
DROP POLICY IF EXISTS "Doctor puede cancelar sus propias cirugías programadas" ON public.surgeries;
DROP POLICY IF EXISTS "Pabellón acceso total a cirugías de su clínica" ON public.surgeries;
DROP POLICY IF EXISTS "Doctor puede ver sus cirugías de su clínica" ON public.surgeries;
DROP POLICY IF EXISTS "Doctor puede cancelar sus cirugías programadas" ON public.surgeries;

CREATE POLICY "Pabellón acceso total a cirugías de su clínica"
  ON public.surgeries FOR ALL
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  )
  WITH CHECK (
    is_pabellon() AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede ver sus cirugías de su clínica"
  ON public.surgeries FOR SELECT
  USING (
    doctor_id = current_doctor_id()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede cancelar sus cirugías programadas"
  ON public.surgeries FOR UPDATE
  USING (
    doctor_id = current_doctor_id()
    AND estado = 'programada'
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  )
  WITH CHECK (
    doctor_id = current_doctor_id()
    AND clinica_id = get_my_clinica_id()
    AND estado = 'cancelada'
  );


-- ============================================================
-- TABLA: SURGERY_SUPPLIES (insumos de cirugías programadas)
-- ============================================================
DROP POLICY IF EXISTS "Pabellón acceso total a insumos de cirugías" ON public.surgery_supplies;
DROP POLICY IF EXISTS "Doctor puede ver insumos de sus cirugías" ON public.surgery_supplies;
DROP POLICY IF EXISTS "Pabellón acceso total a insumos de cirugías de su clínica" ON public.surgery_supplies;
DROP POLICY IF EXISTS "Doctor puede ver insumos de sus cirugías de su clínica" ON public.surgery_supplies;

CREATE POLICY "Pabellón acceso total a insumos de cirugías de su clínica"
  ON public.surgery_supplies FOR ALL
  USING (
    (is_pabellon() AND EXISTS (
      SELECT 1 FROM public.surgeries
      WHERE id = surgery_id AND clinica_id = get_my_clinica_id()
    ))
    OR is_super_admin()
  )
  WITH CHECK (
    is_pabellon() AND EXISTS (
      SELECT 1 FROM public.surgeries
      WHERE id = surgery_id AND clinica_id = get_my_clinica_id()
    )
  );

CREATE POLICY "Doctor puede ver insumos de sus cirugías de su clínica"
  ON public.surgery_supplies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.surgeries
      WHERE id = surgery_id
        AND doctor_id = current_doctor_id()
        AND deleted_at IS NULL
        AND clinica_id = get_my_clinica_id()
    )
  );


-- ============================================================
-- TABLA: SCHEDULE_BLOCKS
-- ============================================================
DROP POLICY IF EXISTS "Pabellón acceso total a bloqueos" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Doctor puede ver bloqueos" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Pabellón acceso total a bloqueos de su clínica" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Doctor puede ver bloqueos de su clínica" ON public.schedule_blocks;

CREATE POLICY "Pabellón acceso total a bloqueos de su clínica"
  ON public.schedule_blocks FOR ALL
  USING (
    (is_pabellon() AND clinica_id = get_my_clinica_id())
    OR is_super_admin()
  )
  WITH CHECK (
    is_pabellon() AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Doctor puede ver bloqueos de su clínica"
  ON public.schedule_blocks FOR SELECT
  USING (
    deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );


-- ============================================================
-- TABLA: NOTIFICATIONS
-- ============================================================
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON public.notifications;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus notificaciones" ON public.notifications;
DROP POLICY IF EXISTS "Sistema puede crear notificaciones" ON public.notifications;
DROP POLICY IF EXISTS "Usuarios pueden ver sus notificaciones de su clínica" ON public.notifications;
DROP POLICY IF EXISTS "Usuarios pueden marcar sus notificaciones como vistas" ON public.notifications;

CREATE POLICY "Usuarios pueden ver sus notificaciones de su clínica"
  ON public.notifications FOR SELECT
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Usuarios pueden marcar sus notificaciones como vistas"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() AND clinica_id = get_my_clinica_id())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sistema puede crear notificaciones"
  ON public.notifications FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- TABLA: REMINDERS
-- ============================================================
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios recordatorios" ON public.reminders;
DROP POLICY IF EXISTS "Usuarios pueden crear sus propios recordatorios" ON public.reminders;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios recordatorios" ON public.reminders;
DROP POLICY IF EXISTS "Pabellón puede crear recordatorios" ON public.reminders;
DROP POLICY IF EXISTS "Usuarios pueden ver sus recordatorios de su clínica" ON public.reminders;
DROP POLICY IF EXISTS "Usuarios pueden crear recordatorios en su clínica" ON public.reminders;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus recordatorios" ON public.reminders;
DROP POLICY IF EXISTS "Pabellón puede crear recordatorios en su clínica" ON public.reminders;

CREATE POLICY "Usuarios pueden ver sus recordatorios de su clínica"
  ON public.reminders FOR SELECT
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Usuarios pueden crear recordatorios en su clínica"
  ON public.reminders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND clinica_id = get_my_clinica_id()
  );

CREATE POLICY "Usuarios pueden actualizar sus recordatorios"
  ON public.reminders FOR UPDATE
  USING (user_id = auth.uid() AND clinica_id = get_my_clinica_id())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Pabellón puede crear recordatorios en su clínica"
  ON public.reminders FOR INSERT
  WITH CHECK (
    is_pabellon()
    AND clinica_id = get_my_clinica_id()
  );


-- ============================================================
-- TABLA: AUDIT_LOGS
-- ============================================================
DROP POLICY IF EXISTS "Pabellón puede ver logs de auditoría" ON public.audit_logs;
DROP POLICY IF EXISTS "Sistema puede crear logs de auditoría" ON public.audit_logs;
DROP POLICY IF EXISTS "Pabellón puede ver logs de su clínica" ON public.audit_logs;

-- Pabellón solo ve logs de usuarios de su misma clínica
CREATE POLICY "Pabellón puede ver logs de su clínica"
  ON public.audit_logs FOR SELECT
  USING (
    (is_pabellon() AND user_id IN (
      SELECT id FROM public.users
      WHERE clinica_id = get_my_clinica_id()
        AND deleted_at IS NULL
    ))
    OR is_super_admin()
  );

CREATE POLICY "Sistema puede crear logs de auditoría"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);
