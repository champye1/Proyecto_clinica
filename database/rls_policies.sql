-- =====================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURIDAD
-- Sistema Clínico Quirúrgico
-- =====================================================

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_request_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIONES AUXILIARES PARA RLS
-- =====================================================

-- Función para verificar si el usuario es Pabellón
CREATE OR REPLACE FUNCTION is_pabellon()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'pabellon'
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es Doctor
CREATE OR REPLACE FUNCTION is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'doctor'
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el doctor_id del usuario actual (si es doctor)
CREATE OR REPLACE FUNCTION current_doctor_id()
RETURNS UUID AS $$
DECLARE
    doctor_uuid UUID;
BEGIN
    SELECT id INTO doctor_uuid
    FROM public.doctors
    WHERE user_id = auth.uid()
    AND deleted_at IS NULL;
    
    RETURN doctor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS: USERS
-- =====================================================

-- Pabellón: Puede ver todos los usuarios
CREATE POLICY "Pabellón puede ver todos los usuarios"
    ON public.users FOR SELECT
    USING (is_pabellon());

-- Pabellón: Puede insertar usuarios (para crear doctores)
CREATE POLICY "Pabellón puede crear usuarios"
    ON public.users FOR INSERT
    WITH CHECK (is_pabellon());

-- Pabellón: Puede actualizar usuarios
CREATE POLICY "Pabellón puede actualizar usuarios"
    ON public.users FOR UPDATE
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Usuarios pueden ver su propio registro
CREATE POLICY "Usuarios pueden ver su propio registro"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio registro (limitado)
CREATE POLICY "Usuarios pueden actualizar su propio registro"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLÍTICAS: DOCTORS
-- =====================================================

-- Pabellón: Acceso total a doctores
CREATE POLICY "Pabellón acceso total a doctores"
    ON public.doctors FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Puede ver solo su propio registro
CREATE POLICY "Doctor puede ver su propio registro"
    ON public.doctors FOR SELECT
    USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Doctor: Puede actualizar solo su propio registro (limitado)
CREATE POLICY "Doctor puede actualizar su propio registro"
    ON public.doctors FOR UPDATE
    USING (user_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (
        user_id = auth.uid() 
        AND deleted_at IS NULL
        -- No puede cambiar estado ni acceso_web_enabled
        AND estado = OLD.estado
        AND acceso_web_enabled = OLD.acceso_web_enabled
    );

-- =====================================================
-- POLÍTICAS: OPERATING_ROOMS
-- =====================================================

-- Pabellón: Acceso total
CREATE POLICY "Pabellón acceso total a pabellones"
    ON public.operating_rooms FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Solo lectura de pabellones activos
CREATE POLICY "Doctor puede ver pabellones activos"
    ON public.operating_rooms FOR SELECT
    USING (activo = true AND deleted_at IS NULL);

-- =====================================================
-- POLÍTICAS: PATIENTS
-- =====================================================

-- Pabellón: Puede ver todos los pacientes
CREATE POLICY "Pabellón puede ver todos los pacientes"
    ON public.patients FOR SELECT
    USING (is_pabellon());

-- Doctor: Solo puede ver sus propios pacientes
CREATE POLICY "Doctor puede ver sus propios pacientes"
    ON public.patients FOR SELECT
    USING (
        doctor_id = current_doctor_id() 
        AND deleted_at IS NULL
    );

-- Doctor: Puede crear pacientes (solo asociados a él)
CREATE POLICY "Doctor puede crear sus propios pacientes"
    ON public.patients FOR INSERT
    WITH CHECK (
        doctor_id = current_doctor_id()
        AND deleted_at IS NULL
    );

-- Doctor: Puede actualizar sus propios pacientes
CREATE POLICY "Doctor puede actualizar sus propios pacientes"
    ON public.patients FOR UPDATE
    USING (
        doctor_id = current_doctor_id() 
        AND deleted_at IS NULL
    )
    WITH CHECK (
        doctor_id = current_doctor_id()
        AND deleted_at IS NULL
    );

-- Pabellón: Puede crear y actualizar pacientes
CREATE POLICY "Pabellón puede gestionar pacientes"
    ON public.patients FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- =====================================================
-- POLÍTICAS: SUPPLIES
-- =====================================================

-- Pabellón: Acceso total a insumos
CREATE POLICY "Pabellón acceso total a insumos"
    ON public.supplies FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Solo lectura de insumos activos
CREATE POLICY "Doctor puede ver insumos activos"
    ON public.supplies FOR SELECT
    USING (activo = true AND deleted_at IS NULL);

-- =====================================================
-- POLÍTICAS: SURGERY_REQUESTS
-- =====================================================

-- Pabellón: Puede ver todas las solicitudes
CREATE POLICY "Pabellón puede ver todas las solicitudes"
    ON public.surgery_requests FOR SELECT
    USING (is_pabellon());

-- Pabellón: Puede actualizar solicitudes (aceptar/rechazar)
CREATE POLICY "Pabellón puede gestionar solicitudes"
    ON public.surgery_requests FOR UPDATE
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Puede ver solo sus propias solicitudes
CREATE POLICY "Doctor puede ver sus propias solicitudes"
    ON public.surgery_requests FOR SELECT
    USING (
        doctor_id = current_doctor_id() 
        AND deleted_at IS NULL
    );

-- Doctor: Puede crear solicitudes (solo propias)
CREATE POLICY "Doctor puede crear solicitudes propias"
    ON public.surgery_requests FOR INSERT
    WITH CHECK (
        doctor_id = current_doctor_id()
        AND deleted_at IS NULL
        -- Verificar que el doctor esté activo
        AND EXISTS (
            SELECT 1 FROM public.doctors
            WHERE id = current_doctor_id()
            AND estado = 'activo'
            AND deleted_at IS NULL
        )
    );

-- Doctor: Puede actualizar sus solicitudes pendientes (solo algunas cosas)
CREATE POLICY "Doctor puede actualizar sus solicitudes pendientes"
    ON public.surgery_requests FOR UPDATE
    USING (
        doctor_id = current_doctor_id() 
        AND estado = 'pendiente'
        AND deleted_at IS NULL
    )
    WITH CHECK (
        doctor_id = current_doctor_id()
        AND estado = 'pendiente'
        AND deleted_at IS NULL
        -- No puede cambiar el estado si ya fue aceptada/rechazada
        AND (OLD.estado = 'pendiente' OR NEW.estado = 'pendiente')
    );

-- =====================================================
-- POLÍTICAS: SURGERY_REQUEST_SUPPLIES
-- =====================================================

-- Pabellón: Acceso total
CREATE POLICY "Pabellón acceso total a insumos de solicitudes"
    ON public.surgery_request_supplies FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Puede ver insumos de sus solicitudes
CREATE POLICY "Doctor puede ver insumos de sus solicitudes"
    ON public.surgery_request_supplies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.surgery_requests
            WHERE id = surgery_request_id
            AND doctor_id = current_doctor_id()
            AND deleted_at IS NULL
        )
    );

-- Doctor: Puede gestionar insumos de sus solicitudes pendientes
CREATE POLICY "Doctor puede gestionar insumos de solicitudes pendientes"
    ON public.surgery_request_supplies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.surgery_requests
            WHERE id = surgery_request_id
            AND doctor_id = current_doctor_id()
            AND estado = 'pendiente'
            AND deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.surgery_requests
            WHERE id = surgery_request_id
            AND doctor_id = current_doctor_id()
            AND estado = 'pendiente'
            AND deleted_at IS NULL
        )
    );

-- =====================================================
-- POLÍTICAS: SURGERIES
-- =====================================================

-- Pabellón: Acceso total a cirugías
CREATE POLICY "Pabellón acceso total a cirugías"
    ON public.surgeries FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Puede ver solo sus propias cirugías
CREATE POLICY "Doctor puede ver sus propias cirugías"
    ON public.surgeries FOR SELECT
    USING (
        doctor_id = current_doctor_id() 
        AND deleted_at IS NULL
    );

-- =====================================================
-- POLÍTICAS: SURGERY_SUPPLIES
-- =====================================================

-- Pabellón: Acceso total
CREATE POLICY "Pabellón acceso total a insumos de cirugías"
    ON public.surgery_supplies FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Puede ver insumos de sus cirugías
CREATE POLICY "Doctor puede ver insumos de sus cirugías"
    ON public.surgery_supplies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.surgeries
            WHERE id = surgery_id
            AND doctor_id = current_doctor_id()
            AND deleted_at IS NULL
        )
    );

-- =====================================================
-- POLÍTICAS: SCHEDULE_BLOCKS
-- =====================================================

-- Pabellón: Acceso total a bloqueos
CREATE POLICY "Pabellón acceso total a bloqueos"
    ON public.schedule_blocks FOR ALL
    USING (is_pabellon())
    WITH CHECK (is_pabellon());

-- Doctor: Puede ver bloqueos (para saber qué horarios están ocupados)
CREATE POLICY "Doctor puede ver bloqueos"
    ON public.schedule_blocks FOR SELECT
    USING (deleted_at IS NULL);

-- =====================================================
-- POLÍTICAS: REMINDERS
-- =====================================================

-- Usuarios pueden ver solo sus propios recordatorios
CREATE POLICY "Usuarios pueden ver sus propios recordatorios"
    ON public.reminders FOR SELECT
    USING (
        user_id = auth.uid() 
        AND deleted_at IS NULL
    );

-- Usuarios pueden crear sus propios recordatorios
CREATE POLICY "Usuarios pueden crear sus propios recordatorios"
    ON public.reminders FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Usuarios pueden actualizar sus propios recordatorios
CREATE POLICY "Usuarios pueden actualizar sus propios recordatorios"
    ON public.reminders FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Pabellón: Puede crear recordatorios para cualquier usuario
CREATE POLICY "Pabellón puede crear recordatorios"
    ON public.reminders FOR INSERT
    WITH CHECK (is_pabellon());

-- =====================================================
-- POLÍTICAS: NOTIFICATIONS
-- =====================================================

-- Usuarios pueden ver solo sus propias notificaciones
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
    ON public.notifications FOR SELECT
    USING (
        user_id = auth.uid() 
        AND deleted_at IS NULL
    );

-- Usuarios pueden actualizar sus propias notificaciones (marcar como vista)
CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Sistema puede crear notificaciones (vía triggers)
CREATE POLICY "Sistema puede crear notificaciones"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- POLÍTICAS: AUDIT_LOGS
-- =====================================================

-- Pabellón: Puede ver todos los logs de auditoría
CREATE POLICY "Pabellón puede ver logs de auditoría"
    ON public.audit_logs FOR SELECT
    USING (is_pabellon());

-- Sistema puede insertar logs (vía triggers)
CREATE POLICY "Sistema puede crear logs de auditoría"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- POLÍTICAS ADICIONALES DE SEGURIDAD
-- =====================================================

-- Asegurar que los usuarios solo puedan eliminar lógicamente (soft delete)
-- Las eliminaciones físicas solo las puede hacer Pabellón o el sistema

-- Función para verificar que un usuario autenticado existe
CREATE OR REPLACE FUNCTION require_auth()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
