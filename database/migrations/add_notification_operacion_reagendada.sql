-- =====================================================
-- Notificación cuando se reagendó el día de la operación
-- Aviso al doctor y a pabellón
-- =====================================================

-- Permitir tipo 'operacion_reagendada' en notifications
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_tipo_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_tipo_check CHECK (
    tipo IN (
      'solicitud_aceptada',
      'solicitud_rechazada',
      'operacion_programada',
      'bloqueo_creado',
      'recordatorio',
      'solicitud_reagendamiento',
      'operacion_reagendada'
    )
  );

-- =====================================================
-- Función: insertar notificaciones cuando se reagenda una cirugía
-- Se llama desde trigger AFTER UPDATE ON surgeries
-- =====================================================
CREATE OR REPLACE FUNCTION public.notificar_operacion_reagendada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_user_id UUID;
  v_paciente_nombre TEXT;
  v_doctor_nombre TEXT;
  v_titulo TEXT := 'Operación reagendada';
  v_mensaje_doctor TEXT;
  v_mensaje_pabellon TEXT;
  v_user RECORD;
BEGIN
  -- Solo notificar si cambió fecha u horario
  IF OLD.fecha IS NOT DISTINCT FROM NEW.fecha
     AND OLD.hora_inicio IS NOT DISTINCT FROM NEW.hora_inicio
     AND OLD.hora_fin IS NOT DISTINCT FROM NEW.hora_fin
     AND OLD.operating_room_id IS NOT DISTINCT FROM NEW.operating_room_id THEN
    RETURN NEW;
  END IF;

  -- Obtener user_id del doctor y nombres
  SELECT d.user_id, d.nombre || ' ' || d.apellido
  INTO v_doctor_user_id, v_doctor_nombre
  FROM public.doctors d
  WHERE d.id = NEW.doctor_id;

  SELECT p.nombre || ' ' || p.apellido INTO v_paciente_nombre
  FROM public.patients p
  WHERE p.id = NEW.patient_id;

  v_paciente_nombre := COALESCE(v_paciente_nombre, 'Paciente');
  v_doctor_nombre := COALESCE(v_doctor_nombre, 'Doctor');

  -- Incluir fecha/hora original (la que ya no aplica) y la nueva
  v_mensaje_doctor := 'La cirugía de ' || v_paciente_nombre
    || ' estaba programada para el ' || to_char(OLD.fecha, 'DD/MM/YYYY') || ' a las '
    || to_char(OLD.hora_inicio, 'HH24:MI') || ' - ' || to_char(OLD.hora_fin, 'HH24:MI')
    || ' (fecha que ya no aplica). Fue reagendada para el '
    || to_char(NEW.fecha, 'DD/MM/YYYY') || ' a las '
    || to_char(NEW.hora_inicio, 'HH24:MI') || ' - ' || to_char(NEW.hora_fin, 'HH24:MI') || '.';

  v_mensaje_pabellon := 'Cirugía de ' || v_paciente_nombre || ' (Dr. ' || v_doctor_nombre
    || ') estaba programada para el ' || to_char(OLD.fecha, 'DD/MM/YYYY') || ' a las '
    || to_char(OLD.hora_inicio, 'HH24:MI') || ' - ' || to_char(OLD.hora_fin, 'HH24:MI')
    || ' (fecha que ya no aplica). Reagendada para el '
    || to_char(NEW.fecha, 'DD/MM/YYYY') || ' a las '
    || to_char(NEW.hora_inicio, 'HH24:MI') || ' - ' || to_char(NEW.hora_fin, 'HH24:MI') || '.';

  -- Notificación al doctor
  IF v_doctor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, relacionado_con)
    VALUES (v_doctor_user_id, 'operacion_reagendada', v_titulo, v_mensaje_doctor, NEW.id);
  END IF;

  -- Notificaciones a todos los usuarios pabellón
  FOR v_user IN
    SELECT id FROM public.users
    WHERE role = 'pabellon'
      AND deleted_at IS NULL
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, relacionado_con)
    VALUES (v_user.id, 'operacion_reagendada', v_titulo, v_mensaje_pabellon, NEW.id);
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notificar_operacion_reagendada() IS 'Trigger: inserta notificaciones al doctor y a pabellón cuando se reagenda una cirugía (cambio de fecha/hora).';

-- Trigger AFTER UPDATE en surgeries (solo cuando cambian fecha/hora/pabellón)
DROP TRIGGER IF EXISTS trigger_notificar_operacion_reagendada ON public.surgeries;
CREATE TRIGGER trigger_notificar_operacion_reagendada
  AFTER UPDATE ON public.surgeries
  FOR EACH ROW
  WHEN (
    OLD.fecha IS DISTINCT FROM NEW.fecha
    OR OLD.hora_inicio IS DISTINCT FROM NEW.hora_inicio
    OR OLD.hora_fin IS DISTINCT FROM NEW.hora_fin
    OR OLD.operating_room_id IS DISTINCT FROM NEW.operating_room_id
  )
  EXECUTE FUNCTION notificar_operacion_reagendada();
