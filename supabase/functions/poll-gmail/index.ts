import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================================
// EDGE FUNCTION: poll-gmail
// Itera sobre todas las clínicas con gmail_polling_enabled=true
// y sus propios refresh_tokens, e inserta los correos
// no leídos en external_messages con clinica_id correcto.
//
// Secrets requeridos:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   GMAIL_CLIENT_ID
//   GMAIL_CLIENT_SECRET
//
// Invocar vía cron (pg_cron) cada 5 min:
//   SELECT cron.schedule('poll-gmail', '*/5 * * * *',
//     $$SELECT net.http_post(
//       url := '<SUPABASE_URL>/functions/v1/poll-gmail',
//       headers := '{"Authorization":"Bearer <SUPABASE_ANON_KEY>"}'
//     )$$
//   );
// =====================================================

const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API_BASE  = 'https://gmail.googleapis.com/gmail/v1/users/me'

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Error obteniendo access_token: ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

async function getUnreadMessageIds(accessToken: string): Promise<string[]> {
  const url = `${GMAIL_API_BASE}/messages?q=is:unread in:inbox&maxResults=20`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`Error listando mensajes: ${await res.text()}`)
  const data = await res.json()
  return (data.messages || []).map((m: { id: string }) => m.id)
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

interface GmailPayload {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailPayload[]
}

function extractBody(payload: GmailPayload): string {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }
  if (payload.body?.data) return decodeBase64Url(payload.body.data)
  return ''
}

function extractClinicalData(body: string) {
  const b = body
  const rutMatch      = b.match(/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/)
  const nombreMatch   = b.match(/(?:paciente|nombre del paciente|nombre)\s*[:\-]\s*([A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)+)/i)
  const cirugiaMatch  = b.match(/(?:cirug[ií]a|procedimiento|intervenci[oó]n|operaci[oó]n)\s*[:\-]\s*([^\n\r,\.]{5,80})/i)
  const fechaMatch    = b.match(/(?:fecha|fecha solicitada|fecha preferida|disponible el|para el)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const telefonoMatch = b.match(/(?:\+?56\s?)?(?:9\s?\d{4}\s?\d{4}|\d{8,9})/)
  const bodyLower     = b.toLowerCase()
  const urgencia: 'urgente' | 'normal' | 'electiva' =
    bodyLower.includes('urgente') || bodyLower.includes('urgencia alta')
      ? 'urgente'
      : bodyLower.includes('electiv') ? 'electiva' : 'normal'
  return {
    rutPaciente:    rutMatch    ? rutMatch[0].replace(/\./g, '') : null,
    nombrePaciente: nombreMatch ? nombreMatch[1].trim()          : null,
    tipoCirugia:    cirugiaMatch ? cirugiaMatch[1].trim()        : null,
    fechaSolicitada: fechaMatch ? fechaMatch[1]                  : null,
    telefono:       telefonoMatch ? telefonoMatch[0].trim()      : null,
    urgencia,
  }
}

async function parseMessage(accessToken: string, messageId: string) {
  const url = `${GMAIL_API_BASE}/messages/${messageId}?format=full`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`Error obteniendo mensaje ${messageId}: ${await res.text()}`)
  const msg = await res.json()

  const headers: { name: string; value: string }[] = msg.payload?.headers || []
  const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
  const fromRaw  = getHeader('From')
  const emailMatch = fromRaw.match(/<([^>]+)>/)
  const fromEmail  = emailMatch ? emailMatch[1] : fromRaw.trim()
  const fromName   = emailMatch ? fromRaw.replace(/<[^>]+>/, '').trim().replace(/^"|"$/g, '') : fromEmail

  const body     = extractBody(msg.payload as GmailPayload)
  const clinical = extractClinicalData(body)

  return {
    gmailMessageId: messageId,
    from:      fromName || fromEmail,
    fromEmail,
    subject:   getHeader('Subject') || '(Sin asunto)',
    body,
    ...clinical,
  }
}

async function markAsRead(accessToken: string, messageId: string): Promise<void> {
  await fetch(`${GMAIL_API_BASE}/messages/${messageId}/modify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  })
}

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean)

function getCors(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? null
  return {
    'Access-Control-Allow-Origin': allowedOrigin ?? "null",
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  const cors = getCors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL') || ''
    const serviceKey     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const gmailClientId  = Deno.env.get('GMAIL_CLIENT_ID') || ''
    const gmailSecret    = Deno.env.get('GMAIL_CLIENT_SECRET') || ''

    if (!supabaseUrl || !serviceKey || !gmailClientId || !gmailSecret) {
      return json({ error: 'Faltan variables de entorno (SUPABASE_URL, SERVICE_ROLE_KEY, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET)' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Obtener todas las clínicas con Gmail polling activo
    const { data: clinicas, error: clinicasErr } = await supabase
      .from('clinicas')
      .select('id, gmail_refresh_token')
      .eq('gmail_polling_enabled', true)
      .not('gmail_refresh_token', 'is', null)
      .neq('gmail_refresh_token', '')

    if (clinicasErr) throw clinicasErr

    if (!clinicas || clinicas.length === 0) {
      return json({ success: true, message: 'No hay clínicas con Gmail activo', processed: 0 })
    }

    const results: unknown[] = []

    for (const clinica of clinicas) {
      try {
        const accessToken = await getAccessToken(gmailClientId, gmailSecret, clinica.gmail_refresh_token)
        const messageIds  = await getUnreadMessageIds(accessToken)

        if (messageIds.length === 0) {
          results.push({ clinica_id: clinica.id, inserted: 0, skipped: 0 })
          continue
        }

        // Filtrar IDs ya procesados para esta clínica
        const { data: existing } = await supabase
          .from('external_messages')
          .select('gmail_message_id')
          .in('gmail_message_id', messageIds)
          .eq('clinica_id', clinica.id)
          .is('deleted_at', null)

        const existingIds = new Set((existing || []).map((r: { gmail_message_id: string }) => r.gmail_message_id))
        const newIds = messageIds.filter((id: string) => !existingIds.has(id))

        let inserted = 0
        const errors: string[] = []

        for (const msgId of newIds) {
          try {
            const parsed = await parseMessage(accessToken, msgId)
            const { error: insertError } = await supabase
              .from('external_messages')
              .insert({
                gmail_message_id:  parsed.gmailMessageId,
                clinica_id:        clinica.id,
                fuente:            'gmail',
                nombre_remitente:  parsed.from,
                email_remitente:   parsed.fromEmail,
                telefono_remitente: parsed.telefono,
                asunto:            parsed.subject,
                mensaje:           parsed.body.substring(0, 2000),
                nombre_paciente:   parsed.nombrePaciente,
                rut_paciente:      parsed.rutPaciente,
                tipo_cirugia:      parsed.tipoCirugia,
                urgencia:          parsed.urgencia,
                leido:             false,
              })

            if (insertError) {
              if (insertError.code !== '23505') errors.push(`${msgId}: ${insertError.message}`)
            } else {
              inserted++
              await markAsRead(accessToken, msgId)
            }
          } catch (e) {
            errors.push(`${msgId}: ${e instanceof Error ? e.message : String(e)}`)
          }
        }

        results.push({
          clinica_id: clinica.id,
          inserted,
          skipped: messageIds.length - newIds.length,
          ...(errors.length > 0 ? { errors } : {}),
        })
      } catch (e) {
        results.push({ clinica_id: clinica.id, error: e instanceof Error ? e.message : String(e) })
      }
    }

    return json({ success: true, results })

  } catch (error) {
    console.error('Error en poll-gmail:', error)
    return json({ error: error instanceof Error ? error.message : 'Error desconocido' }, 500)
  }
})
