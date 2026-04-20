import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES_VALIDOS = ['doctor', 'pabellon', 'admin_clinica'] as const

function jsonResponse(body: Record<string, unknown>, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
    status,
  })
}

function getCors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

/** Genera código alfanumérico legible: ej. "A3K9-X2M7" */
function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = () => chars[Math.floor(Math.random() * chars.length)]
  return `${rand()}${rand()}${rand()}${rand()}-${rand()}${rand()}${rand()}${rand()}`
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = getCors(origin)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Método no permitido.' }, 405, cors)

  try {
    const contentType = req.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      return jsonResponse({ success: false, error: 'Content-Type debe ser application/json.' }, 400, cors)
    }

    let body: Record<string, unknown>
    try { body = await req.json() } catch {
      return jsonResponse({ success: false, error: 'JSON inválido.' }, 400, cors)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ success: false, error: 'Token requerido.' }, 401, cors)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ success: false, error: 'Variables de entorno no configuradas.' }, 500, cors)
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verificar identidad del llamante
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ success: false, error: 'Token inválido.' }, 401, cors)

    const { data: caller } = await admin
      .from('users')
      .select('role, clinica_id')
      .eq('id', user.id)
      .single()

    if (!caller || (caller.role !== 'pabellon' && caller.role !== 'admin_clinica')) {
      return jsonResponse({ success: false, error: 'No autorizado.' }, 403, cors)
    }

    // Validar parámetros
    const email = (typeof body.email === 'string' ? body.email.trim().toLowerCase() : '')
    const rol = typeof body.rol === 'string' ? body.rol.trim() : ''

    if (!email || !EMAIL_REGEX.test(email)) {
      return jsonResponse({ success: false, error: 'Email inválido.' }, 400, cors)
    }
    if (!ROLES_VALIDOS.includes(rol as typeof ROLES_VALIDOS[number])) {
      return jsonResponse({ success: false, error: `Rol inválido. Opciones: ${ROLES_VALIDOS.join(', ')}.` }, 400, cors)
    }

    const clinicaId = caller.clinica_id
    const codigo = generarCodigo()
    const redirectTo = `${siteUrl}/registro/invitacion?codigo=${encodeURIComponent(codigo)}`

    // Guardar invitación en DB
    const { error: insertError } = await admin.from('invitaciones').insert({
      codigo,
      email,
      rol,
      clinica_id: clinicaId,
      creado_por: user.id,
    })

    if (insertError) {
      console.error('Error al insertar invitación:', insertError)
      return jsonResponse({ success: false, error: `Error al crear invitación: ${insertError.message}` }, 400, cors)
    }

    // Enviar email de invitación via Supabase Auth
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { rol, clinica_id: clinicaId, codigo },
    })

    if (inviteError) {
      // Rollback: borrar la invitación si el email falló
      await admin.from('invitaciones').delete().eq('codigo', codigo)

      // Si el usuario ya existe en auth, igual guardamos la invitación sin enviar el invite
      if (inviteError.message?.toLowerCase().includes('already')) {
        // Re-insertar y devolver código (el admin puede compartirlo manualmente)
        await admin.from('invitaciones').insert({ codigo, email, rol, clinica_id: clinicaId, creado_por: user.id })
        return jsonResponse({
          success: true,
          codigo,
          advertencia: 'El email ya tiene cuenta. Comparte el código manualmente con el usuario.',
          link: redirectTo,
        }, 200, cors)
      }

      return jsonResponse({ success: false, error: `Error al enviar email: ${inviteError.message}` }, 400, cors)
    }

    return jsonResponse({
      success: true,
      codigo,
      link: redirectTo,
      message: `Invitación enviada a ${email}. El código expira en 3 meses.`,
    }, 200, cors)

  } catch (err) {
    const e = err instanceof Error ? err : new Error('Error desconocido')
    return jsonResponse({ success: false, error: e.message }, 500, getCors(req.headers.get('origin')))
  }
})
