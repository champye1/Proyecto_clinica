import { supabase } from '@/config/supabase'
import { logger } from '@/utils/logger'

/**
 * Envía un mensaje WhatsApp via Edge Function → Twilio Sandbox.
 * Falla silenciosamente para no interrumpir el flujo principal.
 *
 * @param {string} telefono - Número destino (ej: "+56989380973")
 * @param {string} type     - Tipo de mensaje (ver send-whatsapp/index.ts)
 * @param {object} data     - Datos para la plantilla del mensaje
 */
export async function sendWhatsApp(telefono, type, data = {}) {
  if (!telefono) return

  try {
    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: { to: telefono, type, data },
    })

    if (error) {
      logger.warn('WhatsApp no enviado:', error.message)
    } else {
      logger.info(`WhatsApp enviado → ${telefono} [${type}]`)
    }
  } catch (err) {
    logger.warn('Error al enviar WhatsApp (no crítico):', err.message)
  }
}

/**
 * Notifica al médico que su solicitud fue aceptada.
 */
export async function notifyDoctorSolicitudAceptada({ telefono, nombreDoctor, nombrePaciente, procedimiento, nombreClinica }) {
  return sendWhatsApp(telefono, 'solicitud_aceptada', { nombreDoctor, nombrePaciente, procedimiento, nombreClinica })
}

/**
 * Notifica al médico que su solicitud fue rechazada.
 */
export async function notifyDoctorSolicitudRechazada({ telefono, nombreDoctor, nombrePaciente, procedimiento, motivo, nombreClinica }) {
  return sendWhatsApp(telefono, 'solicitud_rechazada', { nombreDoctor, nombrePaciente, procedimiento, motivo, nombreClinica })
}

/**
 * Notifica al médico que su cirugía fue programada.
 */
export async function notifyDoctorCirugiaProgramada({ telefono, nombreDoctor, nombrePaciente, procedimiento, fecha, hora, sala, nombreClinica }) {
  return sendWhatsApp(telefono, 'cirugia_programada', { nombreDoctor, nombrePaciente, procedimiento, fecha, hora, sala, nombreClinica })
}

/**
 * Notifica al médico que su cirugía necesita reagendarse.
 */
export async function notifyDoctorReagendamiento({ telefono, nombreDoctor, nombrePaciente, procedimiento, motivo, nombreClinica }) {
  return sendWhatsApp(telefono, 'reagendamiento', { nombreDoctor, nombrePaciente, procedimiento, motivo, nombreClinica })
}

/**
 * Notifica al pabellón que llegó una nueva solicitud.
 */
export async function notifyPabellonNuevaSolicitud({ telefono, nombreDoctor, nombrePaciente, procedimiento, nombreClinica }) {
  return sendWhatsApp(telefono, 'solicitud_recibida', { nombreDoctor, nombrePaciente, procedimiento, nombreClinica })
}
