import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// EDGE FUNCTION: send-whatsapp
// Resuelve credenciales Twilio por clínica (desde DB) usando el JWT del usuario,
// con fallback a secrets globales TWILIO_* para compatibilidad con scripts internos.

const TWILIO_API = (accountSid: string) =>
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean)

function getCors(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? null
  return {
    'Access-Control-Allow-Origin': allowedOrigin ?? "null",
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

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
    case 'test':
      return `🔔 *${clinica}*\n\nMensaje de prueba enviado correctamente desde SurgicalHUB.`
    default:
      return `📱 *${clinica}*\n\nTienes una nueva notificación. Revisa tu portal SurgicalHUB.`
  }
}

serve(async (req) => {
  const cors = getCors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const body = await req.json()
    const { to, type, data, clinicaId } = body

    if (!to)   return json({ success: false, error: 'Campo "to" requerido' }, 400)
    if (!type) return json({ success: false, error: 'Campo "type" requerido' }, 400)

    // ── Resolver credenciales Twilio ──────────────────────────────────────
    let accountSid: string | undefined
    let authToken:  string | undefined
    let fromNumber: string | undefined

    // 1. clinicaId explícito en el body (test desde el panel de integraciones)
    let resolvedClinicaId: string | undefined = clinicaId

    // 2. Si no hay clinicaId, intentar resolver desde el JWT del usuario
    if (!resolvedClinicaId && supabaseUrl && anonKey && serviceKey) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const userClient = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: authHeader } },
        })
        const { data: { user } } = await userClient.auth.getUser()
        if (user) {
          const admin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
          const { data: userRecord } = await admin
            .from('users')
            .select('clinica_id')
            .eq('id', user.id)
            .single()
          resolvedClinicaId = userRecord?.clinica_id
        }
      }
    }

    // 3. Buscar credenciales de la clínica
    if (resolvedClinicaId && supabaseUrl && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data: clinica } = await admin
        .from('clinicas')
        .select('twilio_account_sid, twilio_auth_token, twilio_whatsapp_from, whatsapp_enabled')
        .eq('id', resolvedClinicaId)
        .single()

      if (clinica?.whatsapp_enabled && clinica?.twilio_account_sid && clinica?.twilio_auth_token) {
        accountSid = clinica.twilio_account_sid
        authToken  = clinica.twilio_auth_token
        fromNumber = clinica.twilio_whatsapp_from || undefined
      }
    }

    // 4. Fallback a secrets globales (scripts internos / entorno sin per-clinic config)
    if (!accountSid || !authToken) {
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      authToken  = Deno.env.get('TWILIO_AUTH_TOKEN')
      fromNumber = fromNumber ?? Deno.env.get('TWILIO_WHATSAPP_FROM')
    }

    if (!accountSid || !authToken) {
      return json({ success: false, error: 'No hay credenciales Twilio configuradas para esta clínica.' }, 400)
    }

    fromNumber = fromNumber || 'whatsapp:+14155238886'

    // ── Enviar mensaje ─────────────────────────────────────────────────────
    const toFormatted  = to.startsWith('whatsapp:') ? to : `whatsapp:${to.startsWith('+') ? to : '+' + to}`
    const messageBody  = buildMessage(type, data || {})
    const credentials  = btoa(`${accountSid}:${authToken}`)

    const twilioRes = await fetch(TWILIO_API(accountSid), {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: toFormatted, From: fromNumber, Body: messageBody }).toString(),
    })

    const twilioData = await twilioRes.json()

    if (!twilioRes.ok) {
      console.error('Twilio error:', twilioData)
      return json({ success: false, error: twilioData.message || 'Error al enviar WhatsApp' }, 400)
    }

    console.log(`WhatsApp enviado → ${toFormatted} | tipo: ${type} | SID: ${twilioData.sid}`)
    return json({ success: true, sid: twilioData.sid })

  } catch (err) {
    console.error('send-whatsapp error:', err)
    return json({ success: false, error: err instanceof Error ? err.message : 'Error desconocido' }, 400)
  }
})
