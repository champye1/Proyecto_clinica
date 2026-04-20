-- ============================================================
-- FIX CRÍTICO: Triggers de notificaciones sin clinica_id
-- Los triggers notificar_cirugia_programada y notificar_solicitud_aceptada
-- insertaban en notifications/reminders sin clinica_id, que es NOT NULL.
-- Esto bloqueaba programar cirugías y aceptar solicitudes en producción.
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Fix: notificar_cirugia_programada ────────────────────────
CREATE OR REPLACE FUNCTION notificar_cirugia_programada()
RETURNS TRIGGER AS $$
DECLARE
  doctor_user_id UUID;
  v_clinica_id   UUID;
BEGIN
  SELECT user_id INTO doctor_user_id
  FROM public.doctors
  WHERE id = NEW.doctor_id;

  -- Obtener clinica_id de la cirugía (fue agregado por migración)
  v_clinica_id := NEW.clinica_id;

  -- Crear notificación al doctor
  INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, relacionado_con, clinica_id)
  VALUES (
    doctor_user_id,
    'operacion_programada',
    'Cirugía Programada',
    format('Su cirugía ha sido programada para el %s a las %s en el pabellón %s',
           NEW.fecha::text,
           NEW.hora_inicio::text,
           (SELECT nombre FROM public.operating_rooms WHERE id = NEW.operating_room_id)
    ),
    NEW.id,
    v_clinica_id
  );

  -- Crear recordatorio para el doctor
  INSERT INTO public.reminders (user_id, titulo, contenido, tipo, relacionado_con, clinica_id)
  VALUES (
    doctor_user_id,
    'Cirugía Programada',
    format('Cirugía programada para el %s a las %s', NEW.fecha::text, NEW.hora_inicio::text),
    'operacion_aceptada',
    NEW.id,
    v_clinica_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── Fix: notificar_solicitud_aceptada ────────────────────────
CREATE OR REPLACE FUNCTION notificar_solicitud_aceptada()
RETURNS TRIGGER AS $$
DECLARE
  doctor_user_id UUID;
  v_clinica_id   UUID;
BEGIN
  IF OLD.estado = 'pendiente' AND NEW.estado = 'aceptada' THEN
    SELECT user_id INTO doctor_user_id
    FROM public.doctors
    WHERE id = NEW.doctor_id;

    v_clinica_id := NEW.clinica_id;

    INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, relacionado_con, clinica_id)
    VALUES (
      doctor_user_id,
      'solicitud_aceptada',
      'Solicitud Quirúrgica Aceptada',
      'Su solicitud quirúrgica ha sido aceptada y está siendo programada.',
      NEW.id,
      v_clinica_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
