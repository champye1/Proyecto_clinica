/**
 * Servicio de emails transaccionales.
 * Invoca la Edge Function `send-email` que usa Resend internamente.
 *
 * Tipos soportados:
 *   solicitud_recibida   — al pabellón cuando doctor crea solicitud
 *   solicitud_aceptada   — al doctor cuando pabellón acepta
 *   solicitud_rechazada  — al doctor cuando pabellón rechaza
 *   cirugia_programada   — al doctor cuando se agenda la cirugía
 *   cirugia_cancelada    — al doctor cuando se cancela la cirugía
 *   reagendamiento       — al doctor cuando se requiere reagendar
 */
import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

/**
 * Envía un email transaccional.
 * @param {'solicitud_recibida'|'solicitud_aceptada'|'solicitud_rechazada'|'cirugia_programada'|'cirugia_cancelada'|'reagendamiento'} type
 * @param {object} opts
 * @param {string} [opts.to]       Email directo del destinatario
 * @param {string} [opts.userId]   user_id de Supabase Auth (la función resolverá el email)
 * @param {object} opts.data       Datos para rellenar la plantilla
 */
export async function sendEmail(type, { to, userId, data = {} }) {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, userId, type, data },
    })

    if (error) {
      logger.errorWithContext('emailService.sendEmail', error, { type, userId, to })
    }
  } catch (err) {
    // Los errores de email nunca deben bloquear el flujo principal
    logger.errorWithContext('emailService.sendEmail unexpected', err, { type })
  }
}

/**
 * Notifica al doctor que su solicitud fue rechazada.
 * @param {object} solicitud  Objeto solicitud con doctors, patients, fecha_preferida
 */
export function emailSolicitudRechazada(solicitud) {
  return sendEmail('solicitud_rechazada', {
    userId: solicitud.doctors?.user_id,
    data: {
      doctorNombre:   `${solicitud.doctors?.nombre ?? ''} ${solicitud.doctors?.apellido ?? ''}`.trim(),
      pacienteNombre: `${solicitud.patients?.nombre ?? ''} ${solicitud.patients?.apellido ?? ''}`.trim(),
      fecha:          solicitud.fecha_preferida ?? '—',
    },
  })
}

/**
 * Notifica al doctor que su cirugía fue programada.
 * @param {object} solicitud    Objeto solicitud con datos del doctor y paciente
 * @param {object} formData     { fecha, hora_inicio, hora_fin }
 * @param {string} pabellonNombre
 */
export function emailCirugiaProgramada(solicitud, formData, pabellonNombre) {
  return sendEmail('cirugia_programada', {
    userId: solicitud.doctors?.user_id,
    data: {
      doctorNombre:   `${solicitud.doctors?.nombre ?? ''} ${solicitud.doctors?.apellido ?? ''}`.trim(),
      pacienteNombre: `${solicitud.patients?.nombre ?? ''} ${solicitud.patients?.apellido ?? ''}`.trim(),
      fecha:          formData?.fecha ?? '—',
      horaInicio:     (formData?.hora_inicio ?? '').substring(0, 5),
      horaFin:        (formData?.hora_fin ?? '').substring(0, 5),
      pabellon:       pabellonNombre ?? '—',
    },
  })
}

/**
 * Notifica al doctor que se requiere reagendar.
 * @param {object} solicitud
 */
export function emailReagendamiento(solicitud) {
  return sendEmail('reagendamiento', {
    userId: solicitud.doctors?.user_id,
    data: {
      doctorNombre:   `${solicitud.doctors?.nombre ?? ''} ${solicitud.doctors?.apellido ?? ''}`.trim(),
      pacienteNombre: `${solicitud.patients?.nombre ?? ''} ${solicitud.patients?.apellido ?? ''}`.trim(),
      fecha:          solicitud.fecha_preferida ?? '—',
    },
  })
}
