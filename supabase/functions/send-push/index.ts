import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

// =====================================================
// EDGE FUNCTION: send-push
// Envía notificaciones Web Push a uno o más usuarios.
//
// Body esperado (JSON):
//   { user_id?, clinica_id?, title, body, url? }
//   - user_id: enviar a un usuario específico
//   - clinica_id: enviar a todos los usuarios de una clínica
//   - title: título de la notificación
//   - body: texto del mensaje
//   - url: URL a abrir al hacer clic (default: '/')
//
// Secrets requeridos en Supabase Edge Functions:
//   VAPID_PUBLIC_KEY   → clave pública VAPID (Base64url)
//   VAPID_PRIVATE_KEY  → clave privada VAPID (Base64url)
//   VAPID_EMAIL        → mailto:tu@email.com
//
// Generar claves VAPID: npx web-push generate-vapid-keys
// =====================================================

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidEmail      = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@surgicalhub.cl'

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('send-push: faltan VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY')
    return new Response(JSON.stringify({ error: 'VAPID keys no configuradas' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  let body: { user_id?: string; clinica_id?: string; title: string; body: string; url?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { user_id, clinica_id, title, body: message, url = '/' } = body

  if (!title || !message) {
    return new Response(JSON.stringify({ error: 'title y body son requeridos' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Obtener suscripciones del/los usuarios objetivo
  let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth')
  if (user_id) {
    query = query.eq('user_id', user_id)
  } else if (clinica_id) {
    query = query.eq('clinica_id', clinica_id)
  } else {
    return new Response(JSON.stringify({ error: 'Requiere user_id o clinica_id' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: subscriptions, error: fetchError } = await query
  if (fetchError) {
    console.error('send-push: error obteniendo suscripciones', fetchError.message)
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'Sin suscripciones activas' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = JSON.stringify({ title, body: message, url })
  const staleIds: string[] = []
  let sent = 0

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 * 60 * 24 }, // 24 horas de TTL
      )
      sent++
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 410 || status === 404) {
        // Suscripción expirada o inválida → borrar
        staleIds.push(sub.id)
      } else {
        console.error('send-push: error enviando a', sub.endpoint, err)
      }
    }
  }

  // Limpiar suscripciones caducadas
  if (staleIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds)
    console.log(`send-push: eliminadas ${staleIds.length} suscripciones caducadas`)
  }

  return new Response(JSON.stringify({ sent, stale_removed: staleIds.length }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})
