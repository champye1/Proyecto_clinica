import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================================
// EDGE FUNCTION: gmail-exchange-token
// Intercambia el código OAuth de Google por tokens y
// guarda el refresh_token en la clínica del usuario.
//
// Secrets requeridos:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY
//   GMAIL_CLIENT_ID
//   GMAIL_CLIENT_SECRET
//
// Frontend debe enviar en el body:
//   { code, redirectUri }
// Con el JWT del usuario en el header Authorization.
// =====================================================

const GMAIL_TOKEN_URL  = 'https://oauth2.googleapis.com/token'
const GMAIL_USERINFO   = 'https://www.googleapis.com/oauth2/v1/userinfo'

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean)

function getCors(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? null
  return {
    'Access-Control-Allow-Origin': allowedOrigin ?? "null",
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(body: unknown, cors: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  const cors = getCors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, cors, 405)

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey        = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const clientId       = Deno.env.get('GMAIL_CLIENT_ID') ?? ''
    const clientSecret   = Deno.env.get('GMAIL_CLIENT_SECRET') ?? ''

    if (!supabaseUrl || !serviceKey || !clientId || !clientSecret) {
      return json({ error: 'Variables de entorno no configuradas.' }, cors, 500)
    }

    // Verificar identidad del llamante
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Token requerido.' }, cors, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Token inválido.' }, cors, 401)

    // Obtener clinica_id del usuario (service role para bypasear RLS)
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: userRecord } = await admin
      .from('users')
      .select('clinica_id, role')
      .eq('id', user.id)
      .single()

    if (!userRecord?.clinica_id) {
      return json({ error: 'Sin clínica asociada.' }, cors, 403)
    }
    if (!['pabellon', 'admin_clinica'].includes(userRecord.role)) {
      return json({ error: 'No autorizado.' }, cors, 403)
    }

    const { code, redirectUri } = await req.json()
    if (!code || !redirectUri) {
      return json({ error: 'Faltan campos: code, redirectUri.' }, cors, 400)
    }

    // Intercambiar código por tokens
    const tokenRes = await fetch(GMAIL_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[gmail-exchange-token] Token exchange error:', err)
      return json({ error: 'Error al obtener tokens de Google.' }, cors, 502)
    }

    const tokens = await tokenRes.json()
    const { access_token, refresh_token } = tokens

    if (!refresh_token) {
      return json({ error: 'Google no retornó refresh_token. Asegúrate de autorizar con prompt=consent.' }, cors, 400)
    }

    // Obtener email de la cuenta Gmail conectada
    const userInfoRes = await fetch(`${GMAIL_USERINFO}?access_token=${access_token}`)
    const userInfo = userInfoRes.ok ? await userInfoRes.json() : {}
    const gmailEmail = userInfo.email ?? ''

    // Guardar en DB via RPC SECURITY DEFINER (service_role)
    const { error: saveErr } = await admin.rpc('save_gmail_tokens', {
      p_clinica_id:    userRecord.clinica_id,
      p_gmail_email:   gmailEmail,
      p_refresh_token: refresh_token,
      p_enabled:       true,
    })

    if (saveErr) {
      console.error('[gmail-exchange-token] Save error:', saveErr)
      return json({ error: 'Error al guardar credenciales.' }, cors, 500)
    }

    return json({ success: true, gmail_email: gmailEmail }, cors)

  } catch (err) {
    const e = err instanceof Error ? err : new Error('Error desconocido')
    console.error('[gmail-exchange-token] Error:', e.message)
    return json({ error: e.message }, cors, 500)
  }
})
