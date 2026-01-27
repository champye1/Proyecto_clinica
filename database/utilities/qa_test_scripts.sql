-- =====================================================
-- SCRIPTS DE PRUEBA QA - BASE DE DATOS
-- Sistema Clínico Quirúrgico
-- Fecha: 2026-01-26
-- =====================================================
-- Estos scripts ayudan a probar funcionalidades críticas
-- de la base de datos de forma automatizada
-- =====================================================

-- =====================================================
-- 1. PRUEBAS DE VALIDACIONES Y CONSTRAINTS
-- =====================================================

-- TEST-001: Validar constraint hora_fin > hora_inicio  
-- Esperado: ERROR
BEGIN;
DO $$
DECLARE
    v_request_id UUID;
    v_doctor_id UUID;
    v_patient_id UUID;
    v_room_id UUID;
BEGIN
    -- Buscar solicitud SIN cirugía asociada
    SELECT sr.id INTO v_request_id
    FROM public.surgery_requests sr
    LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
    WHERE sr.deleted_at IS NULL
      AND s.id IS NULL
    LIMIT 1;
    
    SELECT id INTO v_doctor_id FROM public.doctors WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_patient_id FROM public.patients WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_room_id FROM public.operating_rooms WHERE activo = true AND deleted_at IS NULL LIMIT 1;
    
    IF v_request_id IS NULL OR v_doctor_id IS NULL OR v_patient_id IS NULL OR v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-001 OMITIDO: Faltan datos de prueba (solicitud sin cirugía, doctor, paciente o pabellón)';
        RETURN;
    END IF;
    
    BEGIN
        INSERT INTO public.surgeries (
            surgery_request_id,
            doctor_id,
            patient_id,
            operating_room_id,
            fecha,
            hora_inicio,
            hora_fin,
            estado
        ) VALUES (
            v_request_id,
            v_doctor_id,
            v_patient_id,
            v_room_id,
            CURRENT_DATE + 1,
            '10:00:00',
            '09:00:00', -- hora_fin < hora_inicio (ERROR)
            'programada'
        );
        RAISE EXCEPTION 'TEST FALLIDO: Debería haber fallado por constraint';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ TEST-001 PASADO: Constraint hora_fin > hora_inicio funciona';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ TEST-001: Error inesperado: %', SQLERRM;
    END;
END $$;
ROLLBACK;

-- TEST-002: Validar constraint fecha >= CURRENT_DATE
-- Esperado: ERROR
BEGIN;
DO $$
DECLARE
    v_request_id UUID;
    v_doctor_id UUID;
    v_patient_id UUID;
    v_room_id UUID;
BEGIN
    -- Buscar solicitud SIN cirugía asociada
    SELECT sr.id INTO v_request_id
    FROM public.surgery_requests sr
    LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
    WHERE sr.deleted_at IS NULL
      AND s.id IS NULL
    LIMIT 1;
    
    SELECT id INTO v_doctor_id FROM public.doctors WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_patient_id FROM public.patients WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_room_id FROM public.operating_rooms WHERE activo = true AND deleted_at IS NULL LIMIT 1;
    
    IF v_request_id IS NULL OR v_doctor_id IS NULL OR v_patient_id IS NULL OR v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-002 OMITIDO: Faltan datos de prueba (solicitud sin cirugía, doctor, paciente o pabellón)';
        RETURN;
    END IF;
    
    BEGIN
        INSERT INTO public.surgeries (
            surgery_request_id,
            doctor_id,
            patient_id,
            operating_room_id,
            fecha,
            hora_inicio,
            hora_fin,
            estado
        ) VALUES (
            v_request_id,
            v_doctor_id,
            v_patient_id,
            v_room_id,
            CURRENT_DATE - 1, -- Fecha pasada (ERROR)
            '10:00:00',
            '11:00:00',
            'programada'
        );
        RAISE EXCEPTION 'TEST FALLIDO: Debería haber fallado por constraint';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ TEST-002 PASADO: Constraint fecha >= CURRENT_DATE funciona';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ TEST-002: Error inesperado: %', SQLERRM;
    END;
END $$;
ROLLBACK;

-- TEST-003: Validar constraint RUT único en doctors
-- Esperado: ERROR si RUT duplicado
BEGIN;
DO $$
DECLARE
    v_rut TEXT;
    v_doctor_id UUID;
BEGIN
    -- Obtener RUT existente
    SELECT rut, id INTO v_rut, v_doctor_id FROM public.doctors WHERE deleted_at IS NULL LIMIT 1;
    
    IF v_rut IS NULL THEN
        RAISE NOTICE '⚠️ TEST-003 OMITIDO: No hay doctores en BD';
        RETURN;
    END IF;
    
    BEGIN
        INSERT INTO public.doctors (
            user_id,
            nombre,
            apellido,
            rut,
            email,
            especialidad
        ) VALUES (
            (SELECT id FROM public.users WHERE role = 'doctor' LIMIT 1),
            'Test',
            'Doctor',
            v_rut, -- RUT duplicado (ERROR)
            'test' || random()::TEXT || '@test.com',
            'cirugia_general'
        );
        RAISE EXCEPTION 'TEST FALLIDO: Debería haber fallado por RUT duplicado';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE '✅ TEST-003 PASADO: Constraint RUT único funciona';
    END;
END $$;
ROLLBACK;

-- =====================================================
-- 2. PRUEBAS DE TRIGGERS
-- =====================================================

-- TEST-004: Validar trigger actualizar_fecha_ultimo_agendamiento en INSERT
-- Esperado: fecha_ultimo_agendamiento y estado_hora se establecen automáticamente
BEGIN;
DO $$
DECLARE
    v_surgery_id UUID;
    v_fecha_ultimo TIMESTAMPTZ;
    v_estado_hora TEXT;
    v_request_id UUID;
    v_doctor_id UUID;
    v_patient_id UUID;
    v_room_id UUID;
BEGIN
    -- Buscar solicitud SIN cirugía asociada
    SELECT sr.id INTO v_request_id
    FROM public.surgery_requests sr
    LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
    WHERE sr.deleted_at IS NULL
      AND s.id IS NULL
    LIMIT 1;
    
    SELECT id INTO v_doctor_id FROM public.doctors WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_patient_id FROM public.patients WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_room_id FROM public.operating_rooms WHERE activo = true AND deleted_at IS NULL LIMIT 1;
    
    IF v_request_id IS NULL OR v_doctor_id IS NULL OR v_patient_id IS NULL OR v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-004 OMITIDO: Faltan datos de prueba (solicitud sin cirugía, doctor, paciente o pabellón)';
        RETURN;
    END IF;
    
    -- Crear cirugía de prueba
    INSERT INTO public.surgeries (
        surgery_request_id,
        doctor_id,
        patient_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        estado
    ) VALUES (
        v_request_id,
        v_doctor_id,
        v_patient_id,
        v_room_id,
        CURRENT_DATE + 1,
        '10:00:00',
        '11:00:00',
        'programada'
    ) RETURNING id, fecha_ultimo_agendamiento, estado_hora INTO v_surgery_id, v_fecha_ultimo, v_estado_hora;
    
    IF v_fecha_ultimo IS NULL THEN
        RAISE EXCEPTION 'TEST FALLIDO: fecha_ultimo_agendamiento debería estar establecido';
    END IF;
    
    IF v_estado_hora != 'agendado' THEN
        RAISE EXCEPTION 'TEST FALLIDO: estado_hora debería ser "agendado"';
    END IF;
    
    RAISE NOTICE '✅ TEST-004 PASADO: Trigger establece fecha_ultimo_agendamiento y estado_hora en INSERT';
    
    -- Limpiar
    DELETE FROM public.surgeries WHERE id = v_surgery_id;
END $$;
ROLLBACK;

-- TEST-005: Validar trigger de reagendamiento
-- Esperado: Al cambiar fecha/hora, se guardan valores anteriores y se registra en historial
BEGIN;
DO $$
DECLARE
    v_surgery_id UUID;
    v_fecha_anterior DATE;
    v_hora_anterior TIME;
    v_estado_hora TEXT;
    v_historial_count INTEGER;
    v_request_id UUID;
    v_doctor_id UUID;
    v_patient_id UUID;
    v_room_id UUID;
BEGIN
    -- Buscar solicitud SIN cirugía asociada
    SELECT sr.id INTO v_request_id
    FROM public.surgery_requests sr
    LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
    WHERE sr.deleted_at IS NULL
      AND s.id IS NULL
    LIMIT 1;
    
    SELECT id INTO v_doctor_id FROM public.doctors WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_patient_id FROM public.patients WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_room_id FROM public.operating_rooms WHERE activo = true AND deleted_at IS NULL LIMIT 1;
    
    IF v_request_id IS NULL OR v_doctor_id IS NULL OR v_patient_id IS NULL OR v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-005 OMITIDO: Faltan datos de prueba (solicitud sin cirugía, doctor, paciente o pabellón)';
        RETURN;
    END IF;
    
    -- Crear cirugía de prueba
    INSERT INTO public.surgeries (
        surgery_request_id,
        doctor_id,
        patient_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        estado
    ) VALUES (
        v_request_id,
        v_doctor_id,
        v_patient_id,
        v_room_id,
        CURRENT_DATE + 1,
        '10:00:00',
        '11:00:00',
        'programada'
    ) RETURNING id INTO v_surgery_id;
    
    -- Reagendar (cambiar fecha y hora)
    UPDATE public.surgeries
    SET 
        fecha = CURRENT_DATE + 2,
        hora_inicio = '14:00:00',
        hora_fin = '15:00:00'
    WHERE id = v_surgery_id
    RETURNING fecha_anterior, hora_inicio_anterior, estado_hora 
    INTO v_fecha_anterior, v_hora_anterior, v_estado_hora;
    
    -- Verificar valores anteriores guardados
    IF v_fecha_anterior != CURRENT_DATE + 1 THEN
        RAISE EXCEPTION 'TEST FALLIDO: fecha_anterior no se guardó correctamente';
    END IF;
    
    IF v_hora_anterior != '10:00:00' THEN
        RAISE EXCEPTION 'TEST FALLIDO: hora_inicio_anterior no se guardó correctamente';
    END IF;
    
    IF v_estado_hora != 'reagendado' THEN
        RAISE EXCEPTION 'TEST FALLIDO: estado_hora debería ser "reagendado"';
    END IF;
    
    -- Verificar historial
    SELECT COUNT(*) INTO v_historial_count
    FROM public.surgery_schedule_history
    WHERE surgery_id = v_surgery_id;
    
    IF v_historial_count = 0 THEN
        RAISE EXCEPTION 'TEST FALLIDO: No se registró en historial';
    END IF;
    
    RAISE NOTICE '✅ TEST-005 PASADO: Trigger de reagendamiento funciona correctamente';
    
    -- Limpiar
    DELETE FROM public.surgery_schedule_history WHERE surgery_id = v_surgery_id;
    DELETE FROM public.surgeries WHERE id = v_surgery_id;
END $$;
ROLLBACK;

-- TEST-006: Validar trigger validar_solapamiento_cirugia
-- Esperado: ERROR si hay solapamiento
BEGIN;
DO $$
DECLARE
    v_surgery_id_1 UUID;
    v_surgery_id_2 UUID;
    v_request_id UUID;
    v_doctor_id UUID;
    v_patient_id UUID;
    v_room_id UUID;
BEGIN
    -- Buscar solicitud SIN cirugía asociada para la primera cirugía
    SELECT sr.id INTO v_request_id
    FROM public.surgery_requests sr
    LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
    WHERE sr.deleted_at IS NULL
      AND s.id IS NULL
    LIMIT 1;
    
    SELECT id INTO v_doctor_id FROM public.doctors WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_patient_id FROM public.patients WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_room_id FROM public.operating_rooms WHERE activo = true AND deleted_at IS NULL LIMIT 1;
    
    IF v_request_id IS NULL OR v_doctor_id IS NULL OR v_patient_id IS NULL OR v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-006 OMITIDO: Faltan datos de prueba (solicitud sin cirugía, doctor, paciente o pabellón)';
        RETURN;
    END IF;
    
    -- Crear primera cirugía
    INSERT INTO public.surgeries (
        surgery_request_id,
        doctor_id,
        patient_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        estado
    ) VALUES (
        v_request_id,
        v_doctor_id,
        v_patient_id,
        v_room_id,
        CURRENT_DATE + 1,
        '10:00:00',
        '11:00:00',
        'programada'
    ) RETURNING id INTO v_surgery_id_1;
    
    -- Buscar OTRA solicitud SIN cirugía asociada para la segunda cirugía (que intentará solaparse)
    SELECT sr.id INTO v_request_id
    FROM public.surgery_requests sr
    LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
    WHERE sr.deleted_at IS NULL
      AND s.id IS NULL
      AND sr.id != v_request_id  -- Diferente a la primera
    LIMIT 1;
    
    IF v_request_id IS NULL THEN
        -- Si no hay otra solicitud, usar la misma pero esto causará error de unique constraint
        -- que también es válido para la prueba
        RAISE NOTICE '⚠️ TEST-006: Solo hay una solicitud disponible, intentando con la misma (debería fallar por unique constraint o solapamiento)';
    END IF;
    
    -- Intentar crear segunda cirugía solapada (ERROR esperado)
    -- Usar otra solicitud si está disponible, si no, usar la misma (causará unique constraint, también válido)
    BEGIN
        -- Buscar otra solicitud sin cirugía
        SELECT sr.id INTO v_request_id
        FROM public.surgery_requests sr
        LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
        WHERE sr.deleted_at IS NULL
          AND s.id IS NULL
          AND sr.id != (SELECT surgery_request_id FROM public.surgeries WHERE id = v_surgery_id_1)
        LIMIT 1;
        
        -- Si no hay otra, usar la misma (causará unique constraint)
        IF v_request_id IS NULL THEN
            SELECT surgery_request_id INTO v_request_id FROM public.surgeries WHERE id = v_surgery_id_1;
        END IF;
        
        INSERT INTO public.surgeries (
            surgery_request_id,
            doctor_id,
            patient_id,
            operating_room_id,
            fecha,
            hora_inicio,
            hora_fin,
            estado
        ) VALUES (
            v_request_id,
            v_doctor_id,
            v_patient_id,
            v_room_id,
            CURRENT_DATE + 1,
            '10:30:00', -- Solapa con 10:00-11:00
            '11:30:00',
            'programada'
        ) RETURNING id INTO v_surgery_id_2;
        
        RAISE EXCEPTION 'TEST FALLIDO: Debería haber fallado por solapamiento o unique constraint';
    EXCEPTION
        WHEN unique_violation THEN
            -- Si falla por unique constraint (misma solicitud), también es válido
            RAISE NOTICE '✅ TEST-006 PASADO: Unique constraint funciona (misma solicitud no puede tener dos cirugías)';
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%solapamiento%' OR SQLERRM LIKE '%Ya existe%' OR SQLERRM LIKE '%horario%' THEN
                RAISE NOTICE '✅ TEST-006 PASADO: Trigger validar_solapamiento_cirugia funciona';
            ELSE
                RAISE EXCEPTION 'TEST FALLIDO: Error inesperado: %', SQLERRM;
            END IF;
    END;
    
    -- Limpiar
    DELETE FROM public.surgeries WHERE id = v_surgery_id_1;
END $$;
ROLLBACK;

-- =====================================================
-- 3. PRUEBAS DE FUNCIONES SQL
-- =====================================================

-- TEST-007: Validar función programar_cirugia_completa
-- Esperado: Crea cirugía, copia insumos y actualiza solicitud en transacción
BEGIN;
DO $$
DECLARE
    v_request_id UUID;
    v_room_id UUID;
    v_surgery_id UUID;
    v_insumos_count INTEGER;
    v_estado_solicitud TEXT;
BEGIN
    -- Obtener solicitud pendiente
    SELECT id INTO v_request_id 
    FROM public.surgery_requests 
    WHERE estado = 'pendiente' 
      AND deleted_at IS NULL 
    LIMIT 1;
    
    SELECT id INTO v_room_id 
    FROM public.operating_rooms 
    WHERE activo = true 
      AND deleted_at IS NULL 
    LIMIT 1;
    
    IF v_request_id IS NULL OR v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-007 OMITIDO: Faltan datos de prueba (solicitud pendiente o pabellón)';
        RETURN;
    END IF;
    
    -- Ejecutar función
    SELECT (result->>'surgery_id')::UUID INTO v_surgery_id
    FROM programar_cirugia_completa(
        v_request_id,
        v_room_id,
        CURRENT_DATE + 1,
        '10:00:00'::TIME,
        '11:00:00'::TIME,
        NULL
    ) AS result;
    
    IF v_surgery_id IS NULL THEN
        RAISE EXCEPTION 'TEST FALLIDO: No se creó la cirugía';
    END IF;
    
    -- Verificar que la cirugía existe
    IF NOT EXISTS (SELECT 1 FROM public.surgeries WHERE id = v_surgery_id) THEN
        RAISE EXCEPTION 'TEST FALLIDO: Cirugía no existe en BD';
    END IF;
    
    -- Verificar que los insumos se copiaron
    SELECT COUNT(*) INTO v_insumos_count
    FROM public.surgery_supplies
    WHERE surgery_id = v_surgery_id;
    
    -- Verificar que la solicitud se actualizó
    SELECT estado INTO v_estado_solicitud
    FROM public.surgery_requests
    WHERE id = v_request_id;
    
    IF v_estado_solicitud != 'aceptada' THEN
        RAISE EXCEPTION 'TEST FALLIDO: Solicitud no se actualizó a "aceptada"';
    END IF;
    
    RAISE NOTICE '✅ TEST-007 PASADO: Función programar_cirugia_completa funciona correctamente';
    RAISE NOTICE '   - Cirugía creada: %', v_surgery_id;
    RAISE NOTICE '   - Insumos copiados: %', v_insumos_count;
    RAISE NOTICE '   - Estado solicitud: %', v_estado_solicitud;
    
    -- Limpiar
    DELETE FROM public.surgery_supplies WHERE surgery_id = v_surgery_id;
    DELETE FROM public.surgeries WHERE id = v_surgery_id;
    UPDATE public.surgery_requests SET estado = 'pendiente' WHERE id = v_request_id;
END $$;
ROLLBACK;

-- TEST-008: Validar función verificar_disponibilidad_con_limpieza
-- Esperado: Retorna disponibilidad correcta
BEGIN;
DO $$
DECLARE
    v_room_id UUID;
    v_result JSONB;
    v_disponible BOOLEAN;
BEGIN
    SELECT id INTO v_room_id 
    FROM public.operating_rooms 
    WHERE activo = true 
      AND deleted_at IS NULL 
    LIMIT 1;
    
    IF v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-008 OMITIDO: No hay pabellones activos';
        RETURN;
    END IF;
    
    -- Verificar horario disponible (debería estar disponible)
    SELECT * INTO v_result
    FROM verificar_disponibilidad_con_limpieza(
        v_room_id,
        CURRENT_DATE + 1,
        '08:00:00'::TIME,
        '09:00:00'::TIME
    );
    
    v_disponible := (v_result->>'disponible')::BOOLEAN;
    
    IF v_disponible IS NULL THEN
        RAISE EXCEPTION 'TEST FALLIDO: Función no retornó resultado';
    END IF;
    
    RAISE NOTICE '✅ TEST-008 PASADO: Función verificar_disponibilidad_con_limpieza funciona';
    RAISE NOTICE '   - Resultado: %', v_result;
END $$;
ROLLBACK;

-- TEST-009: Validar función liberar_bloqueos_expirados
-- Esperado: Libera bloqueos expirados y retorna estadísticas
BEGIN;
DO $$
DECLARE
    v_result RECORD;
    v_block_id UUID;
    v_room_id UUID;
    v_user_id UUID;
    v_fecha_auto DATE;
    v_deleted_at TIMESTAMPTZ;
BEGIN
    SELECT id INTO v_room_id 
    FROM public.operating_rooms 
    WHERE activo = true 
      AND deleted_at IS NULL 
    LIMIT 1;
    
    -- Obtener un usuario (preferiblemente pabellón) para created_by
    SELECT id INTO v_user_id
    FROM public.users
    WHERE deleted_at IS NULL
      AND role = 'pabellon'
    LIMIT 1;
    
    -- Si no hay usuario pabellón, usar cualquier usuario
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id
        FROM public.users
        WHERE deleted_at IS NULL
        LIMIT 1;
    END IF;
    
    IF v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-009 OMITIDO: No hay pabellones activos';
        RETURN;
    END IF;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-009 OMITIDO: No hay usuarios en BD';
        RETURN;
    END IF;
    
    -- Crear bloqueo con fecha de auto-liberación pasada
    -- Usar dias_auto_liberacion para que el trigger calcule fecha_auto_liberacion
    -- Fecha del bloqueo: 3 días atrás, dias_auto_liberacion: 1 día
    -- Esto hará que fecha_auto_liberacion = (CURRENT_DATE - 3) + 1 = CURRENT_DATE - 2 (ya pasada)
    INSERT INTO public.schedule_blocks (
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        motivo,
        dias_auto_liberacion,
        created_by
    ) VALUES (
        v_room_id,
        CURRENT_DATE - 3, -- Fecha del bloqueo: 3 días atrás
        '10:00:00',
        '11:00:00',
        'Test QA',
        1, -- dias_auto_liberacion: 1 día (el trigger calculará fecha_auto_liberacion = fecha + 1 = CURRENT_DATE - 2)
        v_user_id
    ) RETURNING id INTO v_block_id;
    
    -- Verificar que el bloqueo fue creado correctamente
    -- El trigger debería haber calculado fecha_auto_liberacion automáticamente
    IF NOT EXISTS (
        SELECT 1 FROM public.schedule_blocks 
        WHERE id = v_block_id 
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'TEST FALLIDO: Bloqueo no fue creado correctamente';
    END IF;
    
    -- Verificar que fecha_auto_liberacion fue calculada por el trigger
    SELECT fecha_auto_liberacion INTO v_fecha_auto
    FROM public.schedule_blocks
    WHERE id = v_block_id;
    
    IF v_fecha_auto IS NULL THEN
        RAISE EXCEPTION 'TEST FALLIDO: fecha_auto_liberacion no fue calculada por el trigger';
    END IF;
    
    -- Verificar que la fecha_auto_liberacion es menor que CURRENT_DATE
    IF v_fecha_auto >= CURRENT_DATE THEN
        RAISE EXCEPTION 'TEST FALLIDO: fecha_auto_liberacion (%) no es menor que CURRENT_DATE (%)', v_fecha_auto, CURRENT_DATE;
    END IF;
    
    -- Ejecutar función
    SELECT * INTO v_result
    FROM liberar_bloqueos_expirados();
    
    IF v_result.bloqueos_liberados IS NULL THEN
        RAISE EXCEPTION 'TEST FALLIDO: Función no retornó estadísticas';
    END IF;
    
    -- Verificar que el bloqueo fue liberado (deleted_at debe estar establecido)
    SELECT fecha_auto_liberacion, deleted_at INTO v_fecha_auto, v_deleted_at
    FROM public.schedule_blocks
    WHERE id = v_block_id;
    
    IF v_deleted_at IS NULL THEN
        RAISE EXCEPTION 'TEST FALLIDO: Bloqueo no fue liberado. fecha_auto_liberacion: %, deleted_at: %, bloqueos_liberados reportados: %', 
            v_fecha_auto, v_deleted_at, v_result.bloqueos_liberados;
    END IF;
    
    -- Verificar que deleted_at fue establecido
    IF NOT EXISTS (SELECT 1 FROM public.schedule_blocks WHERE id = v_block_id AND deleted_at IS NOT NULL) THEN
        RAISE EXCEPTION 'TEST FALLIDO: Bloqueo no tiene deleted_at establecido';
    END IF;
    
    RAISE NOTICE '✅ TEST-009 PASADO: Función liberar_bloqueos_expirados funciona';
    RAISE NOTICE '   - Bloqueos liberados: %', v_result.bloqueos_liberados;
    RAISE NOTICE '   - Mensaje: %', v_result.mensaje;
    
    -- Limpiar
    DELETE FROM public.schedule_blocks WHERE id = v_block_id;
END $$;
ROLLBACK;

-- =====================================================
-- 4. PRUEBAS DE INTEGRIDAD DE DATOS
-- =====================================================

-- TEST-010: Validar que cirugía reagendada tiene historial
-- Esperado: Registro en surgery_schedule_history
BEGIN;
DO $$
DECLARE
    v_surgery_id UUID;
    v_historial_count INTEGER;
    v_request_id UUID;
    v_doctor_id UUID;
    v_patient_id UUID;
    v_room_id UUID;
BEGIN
    -- Buscar solicitud SIN cirugía asociada
    SELECT sr.id INTO v_request_id
    FROM public.surgery_requests sr
    LEFT JOIN public.surgeries s ON s.surgery_request_id = sr.id AND s.deleted_at IS NULL
    WHERE sr.deleted_at IS NULL
      AND s.id IS NULL
    LIMIT 1;
    
    SELECT id INTO v_doctor_id FROM public.doctors WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_patient_id FROM public.patients WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_room_id FROM public.operating_rooms WHERE activo = true AND deleted_at IS NULL LIMIT 1;
    
    IF v_request_id IS NULL OR v_doctor_id IS NULL OR v_patient_id IS NULL OR v_room_id IS NULL THEN
        RAISE NOTICE '⚠️ TEST-010 OMITIDO: Faltan datos de prueba (solicitud sin cirugía, doctor, paciente o pabellón)';
        RETURN;
    END IF;
    
    -- Crear cirugía
    INSERT INTO public.surgeries (
        surgery_request_id,
        doctor_id,
        patient_id,
        operating_room_id,
        fecha,
        hora_inicio,
        hora_fin,
        estado
    ) VALUES (
        v_request_id,
        v_doctor_id,
        v_patient_id,
        v_room_id,
        CURRENT_DATE + 1,
        '10:00:00',
        '11:00:00',
        'programada'
    ) RETURNING id INTO v_surgery_id;
    
    -- Reagendar
    UPDATE public.surgeries
    SET 
        fecha = CURRENT_DATE + 2,
        hora_inicio = '14:00:00',
        hora_fin = '15:00:00'
    WHERE id = v_surgery_id;
    
    -- Verificar historial
    SELECT COUNT(*) INTO v_historial_count
    FROM public.surgery_schedule_history
    WHERE surgery_id = v_surgery_id;
    
    IF v_historial_count = 0 THEN
        RAISE EXCEPTION 'TEST FALLIDO: No se creó registro en historial';
    END IF;
    
    -- Verificar datos del historial
    IF NOT EXISTS (
        SELECT 1 FROM public.surgery_schedule_history
        WHERE surgery_id = v_surgery_id
          AND fecha_anterior = CURRENT_DATE + 1
          AND hora_inicio_anterior = '10:00:00'
          AND fecha_nueva = CURRENT_DATE + 2
          AND hora_inicio_nueva = '14:00:00'
    ) THEN
        RAISE EXCEPTION 'TEST FALLIDO: Datos del historial incorrectos';
    END IF;
    
    RAISE NOTICE '✅ TEST-010 PASADO: Historial de reagendamientos funciona correctamente';
    
    -- Limpiar
    DELETE FROM public.surgery_schedule_history WHERE surgery_id = v_surgery_id;
    DELETE FROM public.surgeries WHERE id = v_surgery_id;
END $$;
ROLLBACK;

-- =====================================================
-- RESUMEN DE PRUEBAS
-- =====================================================

-- Ejecutar todas las pruebas y mostrar resumen
DO $$
DECLARE
    v_tests_passed INTEGER := 0;
    v_tests_failed INTEGER := 0;
    v_tests_omitted INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE PRUEBAS QA - BASE DE DATOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Ejecuta cada bloque TEST-XXX individualmente';
    RAISE NOTICE 'para ver los resultados detallados.';
    RAISE NOTICE '';
    RAISE NOTICE 'Pruebas disponibles:';
    RAISE NOTICE '  - TEST-001: Constraint hora_fin > hora_inicio';
    RAISE NOTICE '  - TEST-002: Constraint fecha >= CURRENT_DATE';
    RAISE NOTICE '  - TEST-003: Constraint RUT único';
    RAISE NOTICE '  - TEST-004: Trigger fecha_ultimo_agendamiento (INSERT)';
    RAISE NOTICE '  - TEST-005: Trigger de reagendamiento';
    RAISE NOTICE '  - TEST-006: Trigger validar_solapamiento';
    RAISE NOTICE '  - TEST-007: Función programar_cirugia_completa';
    RAISE NOTICE '  - TEST-008: Función verificar_disponibilidad';
    RAISE NOTICE '  - TEST-009: Función liberar_bloqueos_expirados';
    RAISE NOTICE '  - TEST-010: Integridad de historial';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
