-- =====================================================
-- CORRECCIÓN: Error de Columna Ambigua
-- Fecha: 2026-01-26
-- Problema: Error 42702 - column reference "tiempo_limpieza_minutos" is ambiguous
-- Solución: Usar alias de tabla explícito en SELECT
-- =====================================================

-- =====================================================
-- 1. CORREGIR FUNCIÓN validar_solapamiento_cirugia()
-- =====================================================

CREATE OR REPLACE FUNCTION validar_solapamiento_cirugia()
RETURNS TRIGGER AS $$
DECLARE
    solapamiento_count INTEGER;
    tiempo_limpieza_minutos INTEGER;
    cirugia_anterior RECORD;
    tiempo_disponible_minutos INTEGER;
BEGIN
    -- Obtener tiempo de limpieza del pabellón (CORREGIDO: usando alias de tabla)
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

COMMENT ON FUNCTION validar_solapamiento_cirugia IS 'Valida solapamientos de cirugías considerando rangos completos de tiempo y tiempo de limpieza entre cirugías. También valida bloqueos activos. CORREGIDO: uso de alias de tabla para evitar ambigüedad.';

-- =====================================================
-- 2. CORREGIR FUNCIÓN verificar_disponibilidad_con_limpieza()
-- =====================================================

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
    -- Obtener tiempo de limpieza del pabellón (CORREGIDO: usando alias de tabla)
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

COMMENT ON FUNCTION verificar_disponibilidad_con_limpieza IS 'Verifica disponibilidad de un horario considerando solapamientos, bloqueos y tiempo de limpieza. Útil para el frontend al mostrar horarios disponibles. CORREGIDO: uso de alias de tabla para evitar ambigüedad.';

-- =====================================================
-- RESUMEN
-- =====================================================
-- ✅ Función validar_solapamiento_cirugia() corregida
-- ✅ Función verificar_disponibilidad_con_limpieza() corregida
-- 
-- Cambio realizado: Uso de alias de tabla explícito (or_table)
-- para evitar ambigüedad entre variable y columna con el mismo nombre.
-- =====================================================
