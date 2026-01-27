-- =====================================================
-- MIGRACIÓN: Correcciones Críticas y Mejoras Importantes
-- Fecha: 2026-01-25
-- Descripción: Implementa correcciones críticas identificadas en análisis técnico
-- Prioridad: CRÍTICA - Debe ejecutarse antes de producción
-- =====================================================

-- =====================================================
-- 1. ELIMINAR CONSTRAINT INCORRECTO DE SOLAPAMIENTO
-- =====================================================
-- El constraint UNIQUE(operating_room_id, fecha, hora_inicio) solo valida hora_inicio,
-- no el rango completo, permitiendo solapamientos incorrectos.
-- El trigger validar_solapamiento_cirugia() ya valida correctamente los rangos completos.

ALTER TABLE public.surgeries
DROP CONSTRAINT IF EXISTS no_solapamiento;

COMMENT ON TABLE public.surgeries IS 'Cirugías programadas y confirmadas. La validación de solapamientos se realiza mediante trigger, no mediante constraint UNIQUE.';

-- =====================================================
-- 2. CREAR TABLA DE HISTORIAL DE REAGENDAMIENTOS
-- =====================================================
-- Permite mantener historial completo de todos los reagendamientos,
-- no solo la fecha anterior inmediata.

CREATE TABLE IF NOT EXISTS public.surgery_schedule_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
    fecha_anterior DATE NOT NULL,
    hora_inicio_anterior TIME NOT NULL,
    hora_fin_anterior TIME NOT NULL,
    fecha_nueva DATE NOT NULL,
    hora_inicio_nueva TIME NOT NULL,
    hora_fin_nueva TIME NOT NULL,
    motivo TEXT NULL,
    created_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surgery_schedule_history_surgery_id 
ON public.surgery_schedule_history(surgery_id);

CREATE INDEX idx_surgery_schedule_history_created_at 
ON public.surgery_schedule_history(created_at DESC);

COMMENT ON TABLE public.surgery_schedule_history IS 'Historial completo de todos los reagendamientos de cirugías. Permite rastrear todos los cambios de fecha/hora, no solo el último.';

-- =====================================================
-- 3. FUNCIÓN PARA PROGRAMAR CIRUGÍA COMPLETA (ATÓMICA)
-- =====================================================
-- Esta función realiza todas las operaciones en una transacción implícita:
-- 1. Crear cirugía
-- 2. Copiar insumos de la solicitud
-- 3. Actualizar estado de la solicitud
-- Si cualquier paso falla, se hace rollback automático.

CREATE OR REPLACE FUNCTION programar_cirugia_completa(
    p_surgery_request_id UUID,
    p_operating_room_id UUID,
    p_fecha DATE,
    p_hora_inicio TIME,
    p_hora_fin TIME,
    p_observaciones TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_surgery_id UUID;
    v_surgery_request RECORD;
    v_operating_room RECORD;
    v_supply_record RECORD;
    v_result JSONB;
BEGIN
    -- Validar que la solicitud existe y está en estado pendiente
    SELECT * INTO v_surgery_request
    FROM public.surgery_requests
    WHERE id = p_surgery_request_id
      AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La solicitud quirúrgica no existe o ha sido eliminada';
    END IF;
    
    IF v_surgery_request.estado != 'pendiente' THEN
        RAISE EXCEPTION 'La solicitud debe estar en estado pendiente para ser programada. Estado actual: %', v_surgery_request.estado;
    END IF;
    
    -- Validar que el pabellón existe y está activo
    SELECT * INTO v_operating_room
    FROM public.operating_rooms
    WHERE id = p_operating_room_id
      AND activo = true
      AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pabellón no existe, no está activo o ha sido eliminado';
    END IF;
    
    -- Validar que hora_fin > hora_inicio
    IF p_hora_fin <= p_hora_inicio THEN
        RAISE EXCEPTION 'La hora de fin debe ser mayor que la hora de inicio';
    END IF;
    
    -- Validar que la fecha no sea del pasado
    IF p_fecha < CURRENT_DATE THEN
        RAISE EXCEPTION 'No se puede programar una cirugía en una fecha pasada';
    END IF;
    
    -- Crear la cirugía (el trigger validará solapamientos y tiempo de limpieza)
    INSERT INTO public.surgeries (
        surgery_request_id,
        doctor_id,
        patient_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        observaciones,
        estado
    ) VALUES (
        p_surgery_request_id,
        v_surgery_request.doctor_id,
        v_surgery_request.patient_id,
        p_operating_room_id,
        p_fecha,
        p_hora_inicio,
        p_hora_fin,
        p_observaciones,
        'programada'
    ) RETURNING id INTO v_surgery_id;
    
    -- Copiar insumos de la solicitud a la cirugía
    FOR v_supply_record IN
        SELECT supply_id, cantidad
        FROM public.surgery_request_supplies
        WHERE surgery_request_id = p_surgery_request_id
    LOOP
        INSERT INTO public.surgery_supplies (
            surgery_id,
            supply_id,
            cantidad
        ) VALUES (
            v_surgery_id,
            v_supply_record.supply_id,
            v_supply_record.cantidad
        );
    END LOOP;
    
    -- Actualizar estado de la solicitud a aceptada
    UPDATE public.surgery_requests
    SET estado = 'aceptada',
        updated_at = NOW()
    WHERE id = p_surgery_request_id;
    
    -- Construir respuesta con información de la cirugía creada
    SELECT jsonb_build_object(
        'success', true,
        'surgery_id', v_surgery_id,
        'surgery_request_id', p_surgery_request_id,
        'message', 'Cirugía programada exitosamente'
    ) INTO v_result;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Cualquier error hace rollback automático de toda la transacción
        RAISE EXCEPTION 'Error al programar cirugía: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION programar_cirugia_completa IS 'Función atómica para programar una cirugía completa. Crea la cirugía, copia insumos y actualiza la solicitud en una sola transacción. Si algo falla, se hace rollback automático.';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION programar_cirugia_completa(UUID, UUID, DATE, TIME, TIME, TEXT) TO authenticated;

-- =====================================================
-- 4. ACTUALIZAR FUNCIÓN DE VALIDACIÓN DE SOLAPAMIENTO
-- =====================================================
-- Agregar validación de tiempo de limpieza entre cirugías

CREATE OR REPLACE FUNCTION validar_solapamiento_cirugia()
RETURNS TRIGGER AS $$
DECLARE
    solapamiento_count INTEGER;
    tiempo_limpieza_minutos INTEGER;
    cirugia_anterior RECORD;
    tiempo_disponible_minutos INTEGER;
BEGIN
    -- Obtener tiempo de limpieza del pabellón
    SELECT or_table.tiempo_limpieza_minutos INTO tiempo_limpieza_minutos
    FROM public.operating_rooms or_table
    WHERE or_table.id = NEW.operating_room_id;
    
    -- Si no se encuentra, usar valor por defecto de 30 minutos
    IF tiempo_limpieza_minutos IS NULL THEN
        tiempo_limpieza_minutos := 30;
    END IF;
    
    -- Verificar solapamiento en el mismo pabellón, fecha y rango horario
    -- Solo considerar cirugías que NO estén canceladas y que tengan estado 'agendado' o 'reagendado'
    SELECT COUNT(*) INTO solapamiento_count
    FROM public.surgeries
    WHERE operating_room_id = NEW.operating_room_id
      AND fecha = NEW.fecha
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND estado_hora IN ('agendado', 'reagendado')
      AND (
          (hora_inicio <= NEW.hora_inicio AND hora_fin > NEW.hora_inicio) OR
          (hora_inicio < NEW.hora_fin AND hora_fin >= NEW.hora_fin) OR
          (hora_inicio >= NEW.hora_inicio AND hora_fin <= NEW.hora_fin)
      );
    
    IF solapamiento_count > 0 THEN
        RAISE EXCEPTION 'Ya existe una cirugía programada en este pabellón en el mismo horario';
    END IF;
    
    -- Validar tiempo de limpieza: verificar que haya suficiente tiempo entre cirugías
    -- Buscar cirugía anterior en el mismo día
    SELECT * INTO cirugia_anterior
    FROM public.surgeries
    WHERE operating_room_id = NEW.operating_room_id
      AND fecha = NEW.fecha
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND estado_hora IN ('agendado', 'reagendado')
      AND hora_fin <= NEW.hora_inicio
    ORDER BY hora_fin DESC
    LIMIT 1;
    
    -- Si hay cirugía anterior, verificar tiempo de limpieza
    IF FOUND THEN
        -- Calcular minutos disponibles entre cirugías
        tiempo_disponible_minutos := EXTRACT(EPOCH FROM (NEW.hora_inicio - cirugia_anterior.hora_fin)) / 60;
        
        IF tiempo_disponible_minutos < tiempo_limpieza_minutos THEN
            RAISE EXCEPTION 'Debe haber al menos % minutos de tiempo de limpieza entre cirugías. Tiempo disponible: % minutos', 
                tiempo_limpieza_minutos, 
                tiempo_disponible_minutos;
        END IF;
    END IF;
    
    -- Buscar cirugía siguiente en el mismo día
    SELECT * INTO cirugia_anterior
    FROM public.surgeries
    WHERE operating_room_id = NEW.operating_room_id
      AND fecha = NEW.fecha
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND estado_hora IN ('agendado', 'reagendado')
      AND hora_inicio >= NEW.hora_fin
    ORDER BY hora_inicio ASC
    LIMIT 1;
    
    -- Si hay cirugía siguiente, verificar tiempo de limpieza
    IF FOUND THEN
        -- Calcular minutos disponibles entre cirugías
        tiempo_disponible_minutos := EXTRACT(EPOCH FROM (cirugia_anterior.hora_inicio - NEW.hora_fin)) / 60;
        
        IF tiempo_disponible_minutos < tiempo_limpieza_minutos THEN
            RAISE EXCEPTION 'Debe haber al menos % minutos de tiempo de limpieza entre cirugías. Tiempo disponible: % minutos', 
                tiempo_limpieza_minutos, 
                tiempo_disponible_minutos;
        END IF;
    END IF;
    
    -- Verificar que no haya bloqueos activos
    SELECT COUNT(*) INTO solapamiento_count
    FROM public.schedule_blocks
    WHERE operating_room_id = NEW.operating_room_id
      AND fecha = NEW.fecha
      AND deleted_at IS NULL
      AND (
          -- Bloqueo permanente (sin auto-liberación)
          (fecha_auto_liberacion IS NULL AND vigencia_hasta IS NULL) OR
          -- Bloqueo con vigencia aún activa
          (vigencia_hasta IS NOT NULL AND vigencia_hasta >= NEW.fecha) OR
          -- Bloqueo con auto-liberación aún activa
          (fecha_auto_liberacion IS NOT NULL AND fecha_auto_liberacion >= NEW.fecha)
      )
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

COMMENT ON FUNCTION validar_solapamiento_cirugia IS 'Valida solapamientos de cirugías considerando rangos completos de tiempo y tiempo de limpieza entre cirugías. También valida bloqueos activos.';

-- =====================================================
-- 5. ACTUALIZAR FUNCIÓN DE REAGENDAMIENTO
-- =====================================================
-- Agregar validación de estado y registro en historial completo

CREATE OR REPLACE FUNCTION actualizar_fecha_ultimo_agendamiento()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Obtener usuario actual (si está disponible)
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION
        WHEN OTHERS THEN
            v_user_id := NULL;
    END;
    
    -- Si es una inserción nueva, establecer fecha_ultimo_agendamiento
    IF TG_OP = 'INSERT' THEN
        NEW.fecha_ultimo_agendamiento := NOW();
        NEW.estado_hora := 'agendado';
    END IF;
    
    -- Si es una actualización y cambió la fecha/hora, es un reagendamiento
    IF TG_OP = 'UPDATE' THEN
        -- VALIDAR ESTADO: Solo permitir reagendar si está en estado 'programada'
        IF OLD.estado != 'programada' THEN
            RAISE EXCEPTION 'Solo se pueden reagendar cirugías en estado "programada". Estado actual: %', OLD.estado;
        END IF;
        
        -- Validar que la nueva fecha no sea del pasado
        IF NEW.fecha < CURRENT_DATE THEN
            RAISE EXCEPTION 'No se puede reagendar una cirugía a una fecha pasada';
        END IF;
        
        IF (OLD.fecha != NEW.fecha OR OLD.hora_inicio != NEW.hora_inicio OR OLD.hora_fin != NEW.hora_fin) THEN
            -- Guardar fecha/hora anterior en campos de la cirugía
            NEW.fecha_anterior := OLD.fecha;
            NEW.hora_inicio_anterior := OLD.hora_inicio;
            NEW.hora_fin_anterior := OLD.hora_fin;
            NEW.estado_hora := 'reagendado';
            NEW.fecha_ultimo_agendamiento := NOW();
            
            -- Registrar en historial completo
            INSERT INTO public.surgery_schedule_history (
                surgery_id,
                fecha_anterior,
                hora_inicio_anterior,
                hora_fin_anterior,
                fecha_nueva,
                hora_inicio_nueva,
                hora_fin_nueva,
                created_by
            ) VALUES (
                NEW.id,
                OLD.fecha,
                OLD.hora_inicio,
                OLD.hora_fin,
                NEW.fecha,
                NEW.hora_inicio,
                NEW.hora_fin,
                v_user_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_fecha_ultimo_agendamiento IS 'Actualiza fecha_ultimo_agendamiento y estado_hora. Valida que solo se pueda reagendar si estado = programada. Registra historial completo en surgery_schedule_history.';

-- =====================================================
-- 6. FUNCIÓN MEJORADA PARA AUTO-LIBERAR BLOQUEOS
-- =====================================================
-- Esta función puede ser llamada por cron job o Edge Function diariamente
-- NOTA: Eliminamos la función existente porque cambia el tipo de retorno de void a TABLE

DROP FUNCTION IF EXISTS liberar_bloqueos_expirados();

CREATE OR REPLACE FUNCTION liberar_bloqueos_expirados()
RETURNS TABLE(
    bloqueos_liberados INTEGER,
    mensaje TEXT
) AS $$
DECLARE
    v_count INTEGER := 0;
    v_temp INTEGER;
BEGIN
    -- Liberar bloqueos con vigencia_hasta expirada
    UPDATE public.schedule_blocks
    SET deleted_at = NOW()
    WHERE vigencia_hasta IS NOT NULL
      AND vigencia_hasta < CURRENT_DATE
      AND deleted_at IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- También liberar bloqueos con auto-liberación expirada
    UPDATE public.schedule_blocks
    SET deleted_at = NOW()
    WHERE fecha_auto_liberacion IS NOT NULL
      AND fecha_auto_liberacion < CURRENT_DATE
      AND deleted_at IS NULL;
    
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;
    
    RETURN QUERY SELECT 
        v_count,
        format('Se liberaron %s bloqueos expirados', v_count)::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION liberar_bloqueos_expirados IS 'Libera bloqueos expirados (por vigencia_hasta o fecha_auto_liberacion). Debe ejecutarse diariamente mediante cron job o Edge Function. Retorna cantidad de bloqueos liberados.';

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION liberar_bloqueos_expirados() TO authenticated;

-- =====================================================
-- 7. FUNCIÓN AUXILIAR PARA VALIDAR DISPONIBILIDAD CON TIEMPO DE LIMPIEZA
-- =====================================================
-- Útil para el frontend al mostrar horarios disponibles

CREATE OR REPLACE FUNCTION verificar_disponibilidad_con_limpieza(
    p_operating_room_id UUID,
    p_fecha DATE,
    p_hora_inicio TIME,
    p_hora_fin TIME
)
RETURNS JSONB AS $$
DECLARE
    v_tiempo_limpieza_minutos INTEGER;
    v_disponible BOOLEAN := true;
    v_mensaje TEXT;
    v_cirugia_anterior RECORD;
    v_cirugia_siguiente RECORD;
    v_tiempo_disponible_minutos INTEGER;
BEGIN
    -- Obtener tiempo de limpieza del pabellón
    SELECT or_table.tiempo_limpieza_minutos INTO v_tiempo_limpieza_minutos
    FROM public.operating_rooms or_table
    WHERE or_table.id = p_operating_room_id;
    
    IF v_tiempo_limpieza_minutos IS NULL THEN
        v_tiempo_limpieza_minutos := 30;
    END IF;
    
    -- Verificar solapamientos
    SELECT * INTO v_cirugia_anterior
    FROM public.surgeries
    WHERE operating_room_id = p_operating_room_id
      AND fecha = p_fecha
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND estado_hora IN ('agendado', 'reagendado')
      AND (
          (hora_inicio <= p_hora_inicio AND hora_fin > p_hora_inicio) OR
          (hora_inicio < p_hora_fin AND hora_fin >= p_hora_fin) OR
          (hora_inicio >= p_hora_inicio AND hora_fin <= p_hora_fin)
      )
    LIMIT 1;
    
    IF FOUND THEN
        v_disponible := false;
        v_mensaje := 'El horario se solapa con otra cirugía programada';
        RETURN jsonb_build_object('disponible', false, 'mensaje', v_mensaje);
    END IF;
    
    -- Verificar tiempo de limpieza con cirugía anterior
    SELECT * INTO v_cirugia_anterior
    FROM public.surgeries
    WHERE operating_room_id = p_operating_room_id
      AND fecha = p_fecha
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND estado_hora IN ('agendado', 'reagendado')
      AND hora_fin <= p_hora_inicio
    ORDER BY hora_fin DESC
    LIMIT 1;
    
    IF FOUND THEN
        v_tiempo_disponible_minutos := EXTRACT(EPOCH FROM (p_hora_inicio - v_cirugia_anterior.hora_fin)) / 60;
        IF v_tiempo_disponible_minutos < v_tiempo_limpieza_minutos THEN
            v_disponible := false;
            v_mensaje := format('No hay suficiente tiempo de limpieza. Se requieren %s minutos, disponibles: %s minutos', 
                v_tiempo_limpieza_minutos, v_tiempo_disponible_minutos);
            RETURN jsonb_build_object('disponible', false, 'mensaje', v_mensaje, 'tiempo_requerido', v_tiempo_limpieza_minutos, 'tiempo_disponible', v_tiempo_disponible_minutos);
        END IF;
    END IF;
    
    -- Verificar tiempo de limpieza con cirugía siguiente
    SELECT * INTO v_cirugia_siguiente
    FROM public.surgeries
    WHERE operating_room_id = p_operating_room_id
      AND fecha = p_fecha
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND estado_hora IN ('agendado', 'reagendado')
      AND hora_inicio >= p_hora_fin
    ORDER BY hora_inicio ASC
    LIMIT 1;
    
    IF FOUND THEN
        v_tiempo_disponible_minutos := EXTRACT(EPOCH FROM (v_cirugia_siguiente.hora_inicio - p_hora_fin)) / 60;
        IF v_tiempo_disponible_minutos < v_tiempo_limpieza_minutos THEN
            v_disponible := false;
            v_mensaje := format('No hay suficiente tiempo de limpieza. Se requieren %s minutos, disponibles: %s minutos', 
                v_tiempo_limpieza_minutos, v_tiempo_disponible_minutos);
            RETURN jsonb_build_object('disponible', false, 'mensaje', v_mensaje, 'tiempo_requerido', v_tiempo_limpieza_minutos, 'tiempo_disponible', v_tiempo_disponible_minutos);
        END IF;
    END IF;
    
    -- Verificar bloqueos
    SELECT COUNT(*) INTO v_tiempo_disponible_minutos
    FROM public.schedule_blocks
    WHERE operating_room_id = p_operating_room_id
      AND fecha = p_fecha
      AND deleted_at IS NULL
      AND (
          (fecha_auto_liberacion IS NULL AND vigencia_hasta IS NULL) OR
          (vigencia_hasta IS NOT NULL AND vigencia_hasta >= p_fecha) OR
          (fecha_auto_liberacion IS NOT NULL AND fecha_auto_liberacion >= p_fecha)
      )
      AND (
          (hora_inicio <= p_hora_inicio AND hora_fin > p_hora_inicio) OR
          (hora_inicio < p_hora_fin AND hora_fin >= p_hora_fin) OR
          (hora_inicio >= p_hora_inicio AND hora_fin <= p_hora_fin)
      );
    
    IF v_tiempo_disponible_minutos > 0 THEN
        v_disponible := false;
        v_mensaje := 'El horario está bloqueado';
        RETURN jsonb_build_object('disponible', false, 'mensaje', v_mensaje);
    END IF;
    
    RETURN jsonb_build_object(
        'disponible', true, 
        'mensaje', 'Horario disponible',
        'tiempo_limpieza_minutos', v_tiempo_limpieza_minutos
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verificar_disponibilidad_con_limpieza IS 'Verifica disponibilidad de un horario considerando solapamientos, bloqueos y tiempo de limpieza. Útil para el frontend al mostrar horarios disponibles.';

GRANT EXECUTE ON FUNCTION verificar_disponibilidad_con_limpieza(UUID, DATE, TIME, TIME) TO authenticated;

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
-- ✅ 1. Eliminado constraint incorrecto no_solapamiento
-- ✅ 2. Creada tabla surgery_schedule_history para historial completo
-- ✅ 3. Creada función programar_cirugia_completa() para transacciones atómicas
-- ✅ 4. Actualizada función validar_solapamiento_cirugia() con validación de tiempo de limpieza
-- ✅ 5. Actualizada función actualizar_fecha_ultimo_agendamiento() con validación de estado
-- ✅ 6. Mejorada función liberar_bloqueos_expirados() con retorno de estadísticas
-- ✅ 7. Creada función verificar_disponibilidad_con_limpieza() para frontend
