import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// EDGE FUNCTION: send-whatsapp
// Secrets requeridos: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM

const TWILIO_API = (accountSid: string) =>
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

// ── Plantillas de mensajes ─────────────────────────────────────────────────

function buildMessage(type: string, data: Record<string, string>): string {
  const { nombreDoctor, nombrePaciente, procedimiento, fecha, hora, sala, motivo, nombreClinica } = data
  const clinica = nombreClinica || 'SurgicalHUB'

  switch (type) {
    case 'solicitud_recibida':
      return `🏥 *${clinica}*\n\n📋 *Nueva solicitud de cirugía*\n\nMédico: ${nombreDoctor}\nPaciente: ${nombrePaciente}\nProcedimiento: ${procedimiento}\n\nRevisa el panel para aceptar o rechazar.`

    case 'solicitud_aceptada':
      return `✅ *${clinica}*\n\n¡Tu solicitud fue *aceptada*!\n\nPaciente: ${nombrePaciente}\nProcedimiento: ${procedimiento}\n\nEl pabellón confirmará la fecha y hora a la brevedad.`

    case 'cirugia_programada':
      return `🗓️ *${clinica}*\n\n¡Cirugía *programada*!\n\nPaciente: ${nombrePaciente}\nProcedimiento: ${procedimiento}\nFecha: *${fecha}*\nHora: *${hora}*\nSala: ${sala || 'Por confirmar'}\n\nRecuerda presentarte 30 min antes.`

    case 'solicitud_rechazada':
      return `❌ *${clinica}*\n\nTu solicitud fue *rechazada*.\n\nPaciente: ${nombrePaciente}\nProcedimiento: ${procedimiento}\n${motivo ? `\nMotivo: ${motivo}` : ''}\n\nPuedes crear una nueva solicitud desde el portal.`

    case 'reagendamiento':
      return `🔄 *${clinica}*\n\nTu cirugía necesita *reagendarse*.\n\nPaciente: ${nombrePaciente}\nProcedimiento: ${procedimiento}\n${motivo ? `\nMotivo: ${motivo}` : ''}\n\nEl pabellón coordinará una nueva fecha contigo.`

    default:
      return `📱 *${clinica}*\n\nTienes una nueva notificación. Revisa tu portal SurgicalHUB.`
  }
}

// ── Handler principal ──────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const accountSid  = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken   = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber  = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886'

    if (!accountSid || !authToken) {
      throw new Error('Faltan credenciales de Twilio (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)')
    }

    const body = await req.json()
    const { to, type, data } = body

    if (!to) throw new Error('Campo "to" requerido (número de teléfono)')
    if (!type) throw new Error('Campo "type" requerido')

    // Normalizar número: asegurar formato whatsapp:+569XXXXXXXX
    const toFormatted = to.startsWith('whatsapp:')
      ? to
      : `whatsapp:${to.startsWith('+') ? to : '+' + to}`

    const messageBody = buildMessage(type, data || {})

    // Llamar API de Twilio
    const credentials = btoa(`${accountSid}:${authToken}`)
    const formData = new URLSearchParams({
      To:   toFormatted,
      From: fromNumber,
      Body: messageBody,
    })

    const twilioRes = await fetch(TWILIO_API(accountSid), {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const twilioData = await twilioRes.json()

    if (!twilioRes.ok) {
      console.error('Twilio error:', twilioData)
      throw new Error(twilioData.message || 'Error al enviar WhatsApp')
    }

    console.log(`WhatsApp enviado → ${toFormatted} | tipo: ${type} | SID: ${twilioData.sid}`)

    return new Response(
      JSON.stringify({ success: true, sid: twilioData.sid }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (err) {
    console.error('send-whatsapp error:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
