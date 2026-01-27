-- =====================================================
-- MIGRACIÓN: Sistema de Estados por Hora
-- Fecha: 2026-01-25
-- Descripción: Implementa 4 estados para cada hora: vacio, agendado, reagendado, bloqueado
-- =====================================================

-- =====================================================
-- 1. CREAR ENUM PARA ESTADOS DE HORA
-- =====================================================
CREATE TYPE hour_state AS ENUM ('vacio', 'agendado', 'reagendado', 'bloqueado');

-- =====================================================
-- 2. MODIFICAR TABLA SURGERIES PARA SOPORTAR REAGENDAMIENTO
-- =====================================================

-- Agregar campo de estado de hora
ALTER TABLE public.surgeries
ADD COLUMN IF NOT EXISTS estado_hora hour_state NOT NULL DEFAULT 'agendado';

-- Agregar campos para reagendamiento
ALTER TABLE public.surgeries
ADD COLUMN IF NOT EXISTS fecha_anterior DATE NULL,
ADD COLUMN IF NOT EXISTS hora_inicio_anterior TIME NULL,
ADD COLUMN IF NOT EXISTS hora_fin_anterior TIME NULL,
ADD COLUMN IF NOT EXISTS fecha_ultimo_agendamiento TIMESTAMPTZ NULL;

-- Agregar comentarios para documentación
COMMENT ON COLUMN public.surgeries.estado_hora IS 'Estado de la hora: vacio, agendado, reagendado, bloqueado';
COMMENT ON COLUMN public.surgeries.fecha_anterior IS 'Fecha anterior cuando fue reagendada (solo para estado reagendado)';
COMMENT ON COLUMN public.surgeries.hora_inicio_anterior IS 'Hora de inicio anterior cuando fue reagendada';
COMMENT ON COLUMN public.surgeries.hora_fin_anterior IS 'Hora de fin anterior cuando fue reagendada';
COMMENT ON COLUMN public.surgeries.fecha_ultimo_agendamiento IS 'Fecha y hora en que se agendó por última vez (para reagendamientos)';

-- Crear índice para búsquedas por estado de hora
CREATE INDEX IF NOT EXISTS idx_surgeries_estado_hora ON public.surgeries(estado_hora) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_surgeries_fecha_anterior ON public.surgeries(fecha_anterior) WHERE deleted_at IS NULL AND fecha_anterior IS NOT NULL;

-- Agregar constraint: si estado_hora es 'reagendado', debe tener fecha_anterior
ALTER TABLE public.surgeries
ADD CONSTRAINT check_reagendado_tiene_fecha_anterior 
CHECK (
    (estado_hora != 'reagendado') OR 
    (estado_hora = 'reagendado' AND fecha_anterior IS NOT NULL AND hora_inicio_anterior IS NOT NULL AND hora_fin_anterior IS NOT NULL)
);

-- =====================================================
-- 3. MODIFICAR TABLA SCHEDULE_BLOCKS PARA AUTO-LIBERACIÓN
-- =====================================================

-- Agregar campo de días hacia adelante para auto-liberación
ALTER TABLE public.schedule_blocks
ADD COLUMN IF NOT EXISTS dias_auto_liberacion INTEGER NULL CHECK (dias_auto_liberacion IS NULL OR dias_auto_liberacion > 0);

-- Agregar campo de fecha de auto-liberación calculada
ALTER TABLE public.schedule_blocks
ADD COLUMN IF NOT EXISTS fecha_auto_liberacion DATE NULL;

-- Agregar comentarios
COMMENT ON COLUMN public.schedule_blocks.dias_auto_liberacion IS 'Cantidad de días hacia adelante para auto-liberación. NULL = sin auto-liberación';
COMMENT ON COLUMN public.schedule_blocks.fecha_auto_liberacion IS 'Fecha calculada de auto-liberación (fecha + dias_auto_liberacion). Se actualiza automáticamente';

-- Crear índice para auto-liberación
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_fecha_auto_liberacion 
ON public.schedule_blocks(fecha_auto_liberacion) 
WHERE deleted_at IS NULL AND fecha_auto_liberacion IS NOT NULL;

-- Actualizar fecha_auto_liberacion para bloqueos existentes que tengan vigencia_hasta
UPDATE public.schedule_blocks
SET fecha_auto_liberacion = vigencia_hasta
WHERE vigencia_hasta IS NOT NULL 
  AND dias_auto_liberacion IS NULL
  AND deleted_at IS NULL;

-- =====================================================
-- 4. FUNCIÓN PARA CALCULAR FECHA DE AUTO-LIBERACIÓN
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_fecha_auto_liberacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se especifican días de auto-liberación, calcular la fecha
    IF NEW.dias_auto_liberacion IS NOT NULL THEN
        NEW.fecha_auto_liberacion := NEW.fecha + (NEW.dias_auto_liberacion || ' days')::INTERVAL;
    ELSE
        -- Si no hay días de auto-liberación pero hay vigencia_hasta, usar esa
        IF NEW.vigencia_hasta IS NOT NULL THEN
            NEW.fecha_auto_liberacion := NEW.vigencia_hasta;
        ELSE
            NEW.fecha_auto_liberacion := NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular fecha_auto_liberacion automáticamente
DROP TRIGGER IF EXISTS trigger_calcular_fecha_auto_liberacion ON public.schedule_blocks;
CREATE TRIGGER trigger_calcular_fecha_auto_liberacion
    BEFORE INSERT OR UPDATE ON public.schedule_blocks
    FOR EACH ROW
    EXECUTE FUNCTION calcular_fecha_auto_liberacion();

-- =====================================================
-- 5. FUNCIÓN PARA AUTO-LIBERAR BLOQUEOS EXPIRADOS
-- =====================================================
CREATE OR REPLACE FUNCTION liberar_bloqueos_auto_expirados()
RETURNS void AS $$
BEGIN
    -- Liberar bloqueos cuya fecha_auto_liberacion ya pasó
    UPDATE public.schedule_blocks
    SET deleted_at = NOW()
    WHERE fecha_auto_liberacion IS NOT NULL
      AND fecha_auto_liberacion < CURRENT_DATE
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCIÓN PARA ACTUALIZAR FECHA_ULTIMO_AGENDAMIENTO AL CREAR/ACTUALIZAR CIRUGÍA
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_fecha_ultimo_agendamiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es una inserción nueva, establecer fecha_ultimo_agendamiento
    IF TG_OP = 'INSERT' THEN
        NEW.fecha_ultimo_agendamiento := NOW();
        NEW.estado_hora := 'agendado';
    END IF;
    
    -- Si es una actualización y cambió la fecha/hora, es un reagendamiento
    IF TG_OP = 'UPDATE' THEN
        IF (OLD.fecha != NEW.fecha OR OLD.hora_inicio != NEW.hora_inicio OR OLD.hora_fin != NEW.hora_fin) THEN
            -- Guardar fecha/hora anterior
            NEW.fecha_anterior := OLD.fecha;
            NEW.hora_inicio_anterior := OLD.hora_inicio;
            NEW.hora_fin_anterior := OLD.hora_fin;
            NEW.estado_hora := 'reagendado';
            NEW.fecha_ultimo_agendamiento := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_ultimo_agendamiento
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_ultimo_agendamiento ON public.surgeries;
CREATE TRIGGER trigger_actualizar_fecha_ultimo_agendamiento
    BEFORE INSERT OR UPDATE ON public.surgeries
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_ultimo_agendamiento();

-- =====================================================
-- 7. ACTUALIZAR FUNCIÓN DE VALIDACIÓN DE SOLAPAMIENTO
-- =====================================================
-- La función existente ya valida solapamientos, pero debemos asegurarnos
-- de que considere el nuevo estado_hora

CREATE OR REPLACE FUNCTION validar_solapamiento_cirugia()
RETURNS TRIGGER AS $$
DECLARE
    solapamiento_count INTEGER;
BEGIN
    -- Verificar solapamiento en el mismo pabellón, fecha y rango horario
    -- Solo considerar cirugías que NO estén canceladas y que tengan estado 'agendado' o 'reagendado'
    SELECT COUNT(*) INTO solapamiento_count
    FROM public.surgeries
    WHERE operating_room_id = NEW.operating_room_id
      AND fecha = NEW.fecha
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND deleted_at IS NULL
      AND estado != 'cancelada'
      AND estado_hora IN ('agendado', 'reagendado') -- Solo considerar horas ocupadas
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

-- =====================================================
-- 8. ACTUALIZAR FUNCIÓN DE LIBERAR BLOQUEOS EXPIRADOS EXISTENTE
-- =====================================================
CREATE OR REPLACE FUNCTION liberar_bloqueos_expirados()
RETURNS void AS $$
BEGIN
    -- Liberar bloqueos con vigencia_hasta expirada
    UPDATE public.schedule_blocks
    SET deleted_at = NOW()
    WHERE vigencia_hasta IS NOT NULL
      AND vigencia_hasta < CURRENT_DATE
      AND deleted_at IS NULL;
    
    -- También liberar bloqueos con auto-liberación expirada
    UPDATE public.schedule_blocks
    SET deleted_at = NOW()
    WHERE fecha_auto_liberacion IS NOT NULL
      AND fecha_auto_liberacion < CURRENT_DATE
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. VISTA PARA ESTADOS DE HORAS POR PABELLÓN Y FECHA
-- =====================================================
CREATE OR REPLACE VIEW v_estados_horas AS
SELECT 
    or_nombre.id AS operating_room_id,
    or_nombre.nombre AS pabellon_nombre,
    fecha_calendario.fecha,
    hora_calendario.hora,
    COALESCE(
        CASE 
            -- Si hay cirugía agendada o reagendada
            WHEN cirugia.id IS NOT NULL THEN 
                CASE 
                    WHEN cirugia.estado_hora = 'reagendado' THEN 'reagendado'
                    ELSE 'agendado'
                END
            -- Si hay bloqueo activo
            WHEN bloqueo.id IS NOT NULL THEN 'bloqueado'
            -- Si no hay nada
            ELSE 'vacio'
        END,
        'vacio'
    ) AS estado_hora,
    cirugia.id AS surgery_id,
    cirugia.patient_id,
    cirugia.doctor_id,
    cirugia.fecha_anterior,
    cirugia.hora_inicio_anterior,
    cirugia.fecha_ultimo_agendamiento,
    bloqueo.id AS block_id,
    bloqueo.motivo AS motivo_bloqueo,
    bloqueo.fecha_auto_liberacion
FROM public.operating_rooms or_nombre
CROSS JOIN (
    SELECT DISTINCT fecha::DATE AS fecha
    FROM generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '90 days',
        INTERVAL '1 day'
    ) AS fecha
) fecha_calendario
CROSS JOIN (
    SELECT make_time(hora_num, 0, 0)::TIME AS hora
    FROM generate_series(8, 19) AS hora_num
) hora_calendario
LEFT JOIN public.surgeries cirugia ON 
    cirugia.operating_room_id = or_nombre.id
    AND cirugia.fecha = fecha_calendario.fecha
    AND cirugia.hora_inicio <= hora_calendario.hora
    AND cirugia.hora_fin > hora_calendario.hora
    AND cirugia.deleted_at IS NULL
    AND cirugia.estado != 'cancelada'
    AND cirugia.estado_hora IN ('agendado', 'reagendado')
LEFT JOIN public.schedule_blocks bloqueo ON
    bloqueo.operating_room_id = or_nombre.id
    AND bloqueo.fecha = fecha_calendario.fecha
    AND bloqueo.hora_inicio <= hora_calendario.hora
    AND bloqueo.hora_fin > hora_calendario.hora
    AND bloqueo.deleted_at IS NULL
    AND (
        bloqueo.fecha_auto_liberacion IS NULL OR 
        bloqueo.fecha_auto_liberacion >= fecha_calendario.fecha
    )
WHERE or_nombre.activo = true
  AND or_nombre.deleted_at IS NULL
ORDER BY or_nombre.nombre, fecha_calendario.fecha, hora_calendario.hora;

COMMENT ON VIEW v_estados_horas IS 'Vista que muestra el estado de cada hora para cada pabellón: vacio, agendado, reagendado, bloqueado';
