-- =====================================================
-- SISTEMA CLÍNICO QUIRÚRGICO - MODELO DE BASE DE DATOS
-- Clínica Privada Viña del Mar
-- PostgreSQL + Supabase
-- =====================================================

-- =====================================================
-- EXTENSIONES NECESARIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas de texto

-- =====================================================
-- ENUMS (TIPOS PERSONALIZADOS)
-- =====================================================

-- Estado del médico
CREATE TYPE doctor_status AS ENUM ('activo', 'vacaciones');

-- Estado de la solicitud quirúrgica
CREATE TYPE request_status AS ENUM ('pendiente', 'aceptada', 'rechazada', 'cancelada');

-- Estado de la cirugía
CREATE TYPE surgery_status AS ENUM ('programada', 'en_proceso', 'completada', 'cancelada');

-- Especialidades médicas
CREATE TYPE medical_specialty AS ENUM (
    'cirugia_general',
    'cirugia_cardiovascular',
    'cirugia_plastica',
    'cirugia_ortopedica',
    'neurocirugia',
    'cirugia_oncologica',
    'urologia',
    'ginecologia',
    'otorrinolaringologia',
    'oftalmologia',
    'otra'
);

-- =====================================================
-- TABLA: USUARIOS (Vinculada a Supabase Auth)
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('pabellon', 'doctor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_role ON public.users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON public.users(email) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: DOCTORES
-- =====================================================
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    rut TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    especialidad medical_specialty NOT NULL,
    estado doctor_status NOT NULL DEFAULT 'activo',
    acceso_web_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    
    CONSTRAINT rut_format CHECK (rut ~ '^[0-9]{7,8}-[0-9kK]{1}$')
);

CREATE INDEX idx_doctors_user_id ON public.doctors(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_doctors_rut ON public.doctors(rut) WHERE deleted_at IS NULL;
CREATE INDEX idx_doctors_estado ON public.doctors(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_doctors_especialidad ON public.doctors(especialidad) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: PABELLONES QUIRÚRGICOS
-- =====================================================
CREATE TABLE public.operating_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL UNIQUE,
    camillas_disponibles INTEGER NOT NULL DEFAULT 1 CHECK (camillas_disponibles > 0),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_operating_rooms_activo ON public.operating_rooms(activo) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: PACIENTES
-- =====================================================
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    rut TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    
    UNIQUE(doctor_id, rut)
);

CREATE INDEX idx_patients_doctor_id ON public.patients(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_rut ON public.patients(rut) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: INSUMOS
-- =====================================================
CREATE TABLE public.supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    grupo_prestacion TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_supplies_codigo ON public.supplies(codigo) WHERE deleted_at IS NULL;
CREATE INDEX idx_supplies_nombre_trgm ON public.supplies USING gin(nombre gin_trgm_ops);
CREATE INDEX idx_supplies_activo ON public.supplies(activo) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: SOLICITUDES QUIRÚRGICAS
-- =====================================================
CREATE TABLE public.surgery_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    codigo_operacion TEXT NOT NULL,
    hora_recomendada TIME NULL,
    observaciones TEXT,
    estado request_status NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_surgery_requests_doctor_id ON public.surgery_requests(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgery_requests_estado ON public.surgery_requests(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgery_requests_created_at ON public.surgery_requests(created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: INSUMOS POR SOLICITUD
-- =====================================================
CREATE TABLE public.surgery_request_supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_request_id UUID NOT NULL REFERENCES public.surgery_requests(id) ON DELETE CASCADE,
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(surgery_request_id, supply_id)
);

CREATE INDEX idx_srs_surgery_request_id ON public.surgery_request_supplies(surgery_request_id);
CREATE INDEX idx_srs_supply_id ON public.surgery_request_supplies(supply_id);

-- =====================================================
-- TABLA: CIRUGÍAS PROGRAMADAS
-- =====================================================
CREATE TABLE public.surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_request_id UUID NOT NULL UNIQUE REFERENCES public.surgery_requests(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    operating_room_id UUID NOT NULL REFERENCES public.operating_rooms(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado surgery_status NOT NULL DEFAULT 'programada',
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    
    CONSTRAINT hora_valida CHECK (hora_fin > hora_inicio),
    CONSTRAINT fecha_futura CHECK (fecha >= CURRENT_DATE),
    CONSTRAINT no_solapamiento UNIQUE(operating_room_id, fecha, hora_inicio)
);

CREATE INDEX idx_surgeries_doctor_id ON public.surgeries(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_operating_room_id ON public.surgeries(operating_room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_fecha ON public.surgeries(fecha) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_fecha_hora ON public.surgeries(fecha, hora_inicio) WHERE deleted_at IS NULL;
CREATE INDEX idx_surgeries_estado ON public.surgeries(estado) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: INSUMOS POR CIRUGÍA
-- =====================================================
CREATE TABLE public.surgery_supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(surgery_id, supply_id)
);

CREATE INDEX idx_ss_surgery_id ON public.surgery_supplies(surgery_id);
CREATE INDEX idx_ss_supply_id ON public.surgery_supplies(supply_id);

-- =====================================================
-- TABLA: BLOQUEOS DE HORARIO
-- =====================================================
CREATE TABLE public.schedule_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    operating_room_id UUID NOT NULL REFERENCES public.operating_rooms(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo TEXT,
    vigencia_hasta DATE NULL, -- NULL = bloqueo permanente hasta liberación manual
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    
    CONSTRAINT hora_valida_block CHECK (hora_fin > hora_inicio),
    CONSTRAINT vigencia_valida CHECK (vigencia_hasta IS NULL OR vigencia_hasta >= fecha)
);

CREATE INDEX idx_schedule_blocks_doctor_id ON public.schedule_blocks(doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedule_blocks_operating_room_id ON public.schedule_blocks(operating_room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedule_blocks_fecha ON public.schedule_blocks(fecha) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedule_blocks_vigencia ON public.schedule_blocks(vigencia_hasta) WHERE deleted_at IS NULL AND vigencia_hasta IS NOT NULL;

-- =====================================================
-- TABLA: RECORDATORIOS
-- =====================================================
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('aviso', 'operacion_aceptada', 'recordatorio_general')),
    relacionado_con UUID NULL, -- Puede referenciar surgery_id, surgery_request_id, etc.
    visto BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_reminders_user_id ON public.reminders(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_visto ON public.reminders(visto) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_created_at ON public.reminders(created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: NOTIFICACIONES
-- =====================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('solicitud_aceptada', 'solicitud_rechazada', 'operacion_programada', 'bloqueo_creado', 'recordatorio')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    relacionado_con UUID NULL,
    vista BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_vista ON public.notifications(vista) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLA: AUDITORÍA
-- =====================================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,
    tabla_afectada TEXT NOT NULL,
    registro_id UUID NULL,
    datos_anteriores JSONB NULL,
    datos_nuevos JSONB NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_tabla_afectada ON public.audit_logs(tabla_afectada);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operating_rooms_updated_at BEFORE UPDATE ON public.operating_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplies_updated_at BEFORE UPDATE ON public.supplies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surgery_requests_updated_at BEFORE UPDATE ON public.surgery_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surgeries_updated_at BEFORE UPDATE ON public.surgeries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_blocks_updated_at BEFORE UPDATE ON public.schedule_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para liberar bloqueos expirados automáticamente
CREATE OR REPLACE FUNCTION liberar_bloqueos_expirados()
RETURNS void AS $$
BEGIN
    UPDATE public.schedule_blocks
    SET deleted_at = NOW()
    WHERE vigencia_hasta IS NOT NULL
      AND vigencia_hasta < CURRENT_DATE
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para crear notificación al aceptar solicitud
CREATE OR REPLACE FUNCTION notificar_solicitud_aceptada()
RETURNS TRIGGER AS $$
DECLARE
    doctor_user_id UUID;
BEGIN
    -- Solo si cambió de pendiente a aceptada
    IF OLD.estado = 'pendiente' AND NEW.estado = 'aceptada' THEN
        -- Obtener user_id del doctor
        SELECT user_id INTO doctor_user_id
        FROM public.doctors
        WHERE id = NEW.doctor_id;
        
        -- Crear notificación
        INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, relacionado_con)
        VALUES (
            doctor_user_id,
            'solicitud_aceptada',
            'Solicitud Quirúrgica Aceptada',
            'Su solicitud quirúrgica ha sido aceptada y está siendo programada.',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_solicitud_aceptada
    AFTER UPDATE ON public.surgery_requests
    FOR EACH ROW
    WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
    EXECUTE FUNCTION notificar_solicitud_aceptada();

-- Función para validar que el doctor esté activo al crear solicitud
CREATE OR REPLACE FUNCTION validar_doctor_activo()
RETURNS TRIGGER AS $$
DECLARE
    doctor_estado doctor_status;
BEGIN
    -- Verificar que el doctor esté activo
    SELECT estado INTO doctor_estado
    FROM public.doctors
    WHERE id = NEW.doctor_id;
    
    IF doctor_estado != 'activo' THEN
        RAISE EXCEPTION 'El doctor debe estar activo para crear solicitudes quirúrgicas';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_doctor_activo
    BEFORE INSERT ON public.surgery_requests
    FOR EACH ROW
    EXECUTE FUNCTION validar_doctor_activo();

-- Función para crear notificación cuando se programa una cirugía
CREATE OR REPLACE FUNCTION notificar_cirugia_programada()
RETURNS TRIGGER AS $$
DECLARE
    doctor_user_id UUID;
BEGIN
    -- Obtener user_id del doctor
    SELECT user_id INTO doctor_user_id
    FROM public.doctors
    WHERE id = NEW.doctor_id;
    
    -- Crear notificación
    INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, relacionado_con)
    VALUES (
        doctor_user_id,
        'operacion_programada',
        'Cirugía Programada',
        format('Su cirugía ha sido programada para el %s a las %s en el pabellón %s',
               NEW.fecha::text,
               NEW.hora_inicio::text,
               (SELECT nombre FROM public.operating_rooms WHERE id = NEW.operating_room_id)
        ),
        NEW.id
    );
    
    -- Crear recordatorio para el doctor
    INSERT INTO public.reminders (user_id, titulo, contenido, tipo, relacionado_con)
    VALUES (
        doctor_user_id,
        'Cirugía Programada',
        format('Cirugía programada para el %s a las %s', NEW.fecha::text, NEW.hora_inicio::text),
        'operacion_aceptada',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_cirugia_programada
    AFTER INSERT ON public.surgeries
    FOR EACH ROW
    EXECUTE FUNCTION notificar_cirugia_programada();

-- Función para validar que no haya solapamiento de cirugías
CREATE OR REPLACE FUNCTION validar_solapamiento_cirugia()
RETURNS TRIGGER AS $$
DECLARE
    solapamiento_count INTEGER;
BEGIN
    -- Verificar solapamiento en el mismo pabellón, fecha y rango horario
    SELECT COUNT(*) INTO solapamiento_count
    FROM public.surgeries
    WHERE operating_room_id = NEW.operating_room_id
      AND fecha = NEW.fecha
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND (
          (hora_inicio <= NEW.hora_inicio AND hora_fin > NEW.hora_inicio) OR
          (hora_inicio < NEW.hora_fin AND hora_fin >= NEW.hora_fin) OR
          (hora_inicio >= NEW.hora_inicio AND hora_fin <= NEW.hora_fin)
      );
    
    IF solapamiento_count > 0 THEN
        RAISE EXCEPTION 'Ya existe una cirugía programada en este pabellón en el mismo horario';
    END IF;
    
    -- Verificar que no haya bloqueos activos
    SELECT COUNT(*) INTO solapamiento_count
    FROM public.schedule_blocks
    WHERE operating_room_id = NEW.operating_room_id
      AND fecha = NEW.fecha
      AND deleted_at IS NULL
      AND (vigencia_hasta IS NULL OR vigencia_hasta >= NEW.fecha)
      AND (
          (hora_inicio <= NEW.hora_inicio AND hora_fin > NEW.hora_inicio) OR
          (hora_inicio < NEW.hora_fin AND hora_fin >= NEW.hora_fin) OR
          (hora_inicio >= NEW.hora_inicio AND hora_fin <= NEW.hora_fin)
      );
    
    IF solapamiento_count > 0 THEN
        RAISE EXCEPTION 'El horario seleccionado está bloqueado';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_solapamiento_cirugia
    BEFORE INSERT OR UPDATE ON public.surgeries
    FOR EACH ROW
    EXECUTE FUNCTION validar_solapamiento_cirugia();

-- Función para registrar auditoría
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, accion, tabla_afectada, registro_id, datos_anteriores)
        VALUES (
            auth.uid(),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
        VALUES (
            auth.uid(),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, accion, tabla_afectada, registro_id, datos_nuevos)
        VALUES (
            auth.uid(),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar auditoría a tablas críticas
CREATE TRIGGER audit_surgeries
    AFTER INSERT OR UPDATE OR DELETE ON public.surgeries
    FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

CREATE TRIGGER audit_surgery_requests
    AFTER INSERT OR UPDATE OR DELETE ON public.surgery_requests
    FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

CREATE TRIGGER audit_doctors
    AFTER INSERT OR UPDATE OR DELETE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Cirugías del día actual
CREATE OR REPLACE VIEW v_cirugias_hoy AS
SELECT 
    s.id,
    s.fecha,
    s.hora_inicio,
    s.hora_fin,
    s.estado,
    d.nombre || ' ' || d.apellido AS doctor_nombre,
    p.nombre || ' ' || p.apellido AS paciente_nombre,
    or_nombre.nombre AS pabellon_nombre,
    sr.codigo_operacion
FROM public.surgeries s
JOIN public.doctors d ON s.doctor_id = d.id
JOIN public.patients p ON s.patient_id = p.id
JOIN public.operating_rooms or_nombre ON s.operating_room_id = or_nombre.id
JOIN public.surgery_requests sr ON s.surgery_request_id = sr.id
WHERE s.fecha = CURRENT_DATE
  AND s.deleted_at IS NULL
ORDER BY s.hora_inicio;

-- Vista: Ocupación por hora
CREATE OR REPLACE VIEW v_ocupacion_hora AS
SELECT 
    fecha,
    hora_inicio,
    COUNT(*) as cirugias_programadas,
    COUNT(DISTINCT operating_room_id) as pabellones_ocupados,
    (SELECT COUNT(*) FROM public.operating_rooms WHERE activo = true AND deleted_at IS NULL) as total_pabellones
FROM public.surgeries
WHERE deleted_at IS NULL
  AND estado IN ('programada', 'en_proceso')
GROUP BY fecha, hora_inicio
ORDER BY fecha, hora_inicio;

-- Vista: Solicitudes pendientes
CREATE OR REPLACE VIEW v_solicitudes_pendientes AS
SELECT 
    sr.id,
    sr.codigo_operacion,
    sr.hora_recomendada,
    sr.observaciones,
    sr.created_at,
    d.nombre || ' ' || d.apellido AS doctor_nombre,
    d.especialidad,
    p.nombre || ' ' || p.apellido AS paciente_nombre,
    p.rut AS paciente_rut
FROM public.surgery_requests sr
JOIN public.doctors d ON sr.doctor_id = d.id
JOIN public.patients p ON sr.patient_id = p.id
WHERE sr.estado = 'pendiente'
  AND sr.deleted_at IS NULL
ORDER BY sr.created_at DESC;

-- =====================================================
-- COMENTARIOS EN TABLAS (DOCUMENTACIÓN)
-- =====================================================

COMMENT ON TABLE public.users IS 'Usuarios del sistema vinculados a Supabase Auth';
COMMENT ON TABLE public.doctors IS 'Información de médicos del sistema';
COMMENT ON TABLE public.operating_rooms IS 'Pabellones quirúrgicos disponibles';
COMMENT ON TABLE public.patients IS 'Pacientes registrados por médicos';
COMMENT ON TABLE public.supplies IS 'Insumos médicos disponibles';
COMMENT ON TABLE public.surgery_requests IS 'Solicitudes quirúrgicas creadas por médicos';
COMMENT ON TABLE public.surgeries IS 'Cirugías programadas y confirmadas';
COMMENT ON TABLE public.schedule_blocks IS 'Bloqueos de horarios en pabellones';
COMMENT ON TABLE public.reminders IS 'Recordatorios y avisos para usuarios';
COMMENT ON TABLE public.notifications IS 'Notificaciones del sistema';
COMMENT ON TABLE public.audit_logs IS 'Registro de auditoría de acciones críticas';
