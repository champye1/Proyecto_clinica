-- =====================================================
-- Permitir tipo 'solicitud_reagendamiento' en notifications
-- Para notificar a pabellón cuando el doctor/paciente solicita reagendar
-- =====================================================

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
      'solicitud_reagendamiento'
    )
  );

-- =====================================================
-- Columna para saber si ya se notificó sobre reagendamiento
-- =====================================================
ALTER TABLE public.surgery_requests
  ADD COLUMN IF NOT EXISTS reagendamiento_notificado_at TIMESTAMPTZ NULL DEFAULT NULL;

COMMENT ON COLUMN public.surgery_requests.reagendamiento_notificado_at IS 'Fecha/hora en que se notificó a pabellón sobre la solicitud de reagendamiento.';

-- =====================================================
-- Función RPC: notificar a pabellón que el doctor solicitó reagendamiento
-- El doctor solo puede invocarla para sus propias solicitudes.
-- =====================================================
CREATE OR REPLACE FUNCTION public.notificar_reagendamiento_a_pabellon(p_surgery_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_user_id UUID;
  v_doctor_nombre TEXT;
  v_paciente_nombre TEXT;
  v_titulo TEXT := 'Solicitud de reagendamiento';
  v_mensaje TEXT;
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Verificar que la solicitud existe y pertenece al doctor logueado
  SELECT d.user_id, d.nombre || ' ' || d.apellido
  INTO v_doctor_user_id, v_doctor_nombre
  FROM public.surgery_requests sr
  JOIN public.doctors d ON d.id = sr.doctor_id
  WHERE sr.id = p_surgery_request_id
    AND sr.deleted_at IS NULL;

  IF v_doctor_user_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada o no autorizado';
  END IF;

  IF v_doctor_user_id != auth.uid() THEN
    RAISE EXCEPTION 'No puede solicitar reagendamiento de una solicitud que no es suya';
  END IF;

  -- Nombre del paciente
  SELECT p.nombre || ' ' || p.apellido INTO v_paciente_nombre
  FROM public.surgery_requests sr
  JOIN public.patients p ON p.id = sr.patient_id
  WHERE sr.id = p_surgery_request_id;

  v_paciente_nombre := COALESCE(v_paciente_nombre, 'Paciente');
  v_mensaje := 'El paciente ' || v_paciente_nombre || ' (Dr. ' || COALESCE(v_doctor_nombre, '') || ') solicitó reagendar esta cirugía. Por favor revise en Solicitudes o Calendario.';

  -- Insertar notificación para cada usuario con rol pabellón
  FOR v_user IN
    SELECT id FROM public.users
    WHERE role = 'pabellon'
      AND deleted_at IS NULL
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, relacionado_con)
    VALUES (v_user.id, 'solicitud_reagendamiento', v_titulo, v_mensaje, p_surgery_request_id);
    v_count := v_count + 1;
  END LOOP;

  -- Marcar que ya se notificó sobre el reagendamiento
  UPDATE public.surgery_requests
  SET reagendamiento_notificado_at = now(), updated_at = now()
  WHERE id = p_surgery_request_id;

  RETURN jsonb_build_object('success', true, 'notificaciones_enviadas', v_count);
END;
$$;

COMMENT ON FUNCTION public.notificar_reagendamiento_a_pabellon(UUID) IS 'Notifica a todos los usuarios pabellón que el doctor solicitó reagendamiento para la solicitud dada. Solo el doctor dueño de la solicitud puede invocarla.';

GRANT EXECUTE ON FUNCTION public.notificar_reagendamiento_a_pabellon(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notificar_reagendamiento_a_pabellon(UUID) TO service_role;
