import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LIMITS = {
  NOMBRE_MIN: 2, NOMBRE_MAX: 80,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8, PASSWORD_MAX: 128,
} as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES_PERMITIDOS = ['pabellon', 'admin_clinica'] as const
type RolPermitido = typeof ROLES_PERMITIDOS[number]

function jsonResponse(body: Record<string, unknown>, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
    status,
  })
}

function asString(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v.trim()
  return null
}

function stripForStorage(s: string): string {
  return s.replace(/[\x00-\x1F\x7F]/g, '').replace(/<[^>]+>/g, '').trim()
}

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean)

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? null
  return {
    'Access-Control-Allow-Origin': allowedOrigin ?? "null",
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Método no permitido.' }, 405, cors)

  try {
    const contentType = req.headers.get('Content-Type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      return jsonResponse({ success: false, error: 'Content-Type debe ser application/json.' }, 400, cors)
    }

    let body: Record<string, unknown>
    try { body = await req.json() } catch {
      return jsonResponse({ success: false, error: 'JSON inválido.' }, 400, cors)
    }

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ success: false, error: 'Token requerido.' }, 401, cors)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ success: false, error: 'Variables de entorno no configuradas.' }, 500, cors)
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ success: false, error: 'Token inválido o expirado.' }, 401, cors)

    // Solo admin_clinica o pabellon pueden crear usuarios de su clínica
    const { data: caller, error: callerError } = await admin
      .from('users')
      .select('role, clinica_id')
      .eq('id', user.id)
      .single()

    if (callerError || !caller) return jsonResponse({ success: false, error: 'Usuario no encontrado.' }, 403, cors)
    if (caller.role !== 'pabellon' && caller.role !== 'admin_clinica') {
      return jsonResponse({ success: false, error: 'No autorizado para crear usuarios.' }, 403, cors)
    }

    const clinicaId = caller.clinica_id

    // Parsear campos
    let nombre = asString(body.nombre)
    let apellido = asString(body.apellido)
    const emailRaw = asString(body.email)
    const password = asString(body.password) || ''
    const rolRaw = asString(body.rol) || 'pabellon'

    if (nombre) nombre = stripForStorage(nombre)
    if (apellido) apellido = stripForStorage(apellido)

    // Validaciones
    if (!nombre || nombre.length < LIMITS.NOMBRE_MIN || nombre.length > LIMITS.NOMBRE_MAX) {
      return jsonResponse({ success: false, error: 'Nombre inválido (2-80 caracteres).' }, 400, cors)
    }
    if (!apellido || apellido.length < LIMITS.NOMBRE_MIN || apellido.length > LIMITS.NOMBRE_MAX) {
      return jsonResponse({ success: false, error: 'Apellido inválido (2-80 caracteres).' }, 400, cors)
    }
    if (!emailRaw || !EMAIL_REGEX.test(emailRaw) || emailRaw.length > LIMITS.EMAIL_MAX) {
      return jsonResponse({ success: false, error: 'Email inválido.' }, 400, cors)
    }
    if (password.length < LIMITS.PASSWORD_MIN || password.length > LIMITS.PASSWORD_MAX) {
      return jsonResponse({ success: false, error: `La contraseña debe tener entre ${LIMITS.PASSWORD_MIN} y ${LIMITS.PASSWORD_MAX} caracteres.` }, 400, cors)
    }
    if (!ROLES_PERMITIDOS.includes(rolRaw as RolPermitido)) {
      return jsonResponse({ success: false, error: `Rol inválido. Valores: ${ROLES_PERMITIDOS.join(', ')}.` }, 400, cors)
    }

    const email = emailRaw.toLowerCase()
    const rol = rolRaw as RolPermitido

    // Crear usuario en Auth (confirmado directamente — el admin lo crea)
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    let userId: string

    if (createError) {
      const isDuplicate = createError.message?.toLowerCase().includes('already') ||
        createError.message?.toLowerCase().includes('registered')

      if (isDuplicate) {
        return jsonResponse({ success: false, error: 'El email ya está registrado. Usa otro.' }, 409, cors)
      }
      return jsonResponse({ success: false, error: `Error al crear usuario: ${createError.message}` }, 400, cors)
    }

    if (!authData?.user) return jsonResponse({ success: false, error: 'No se pudo crear el usuario.' }, 500, cors)
    userId = authData.user.id

    // Crear en public.users
    const { error: insertError } = await admin.from('users').insert({
      id: userId,
      email,
      role: rol,
      clinica_id: clinicaId,
      nombre: `${nombre} ${apellido}`,
    })

    if (insertError) {
      await admin.auth.admin.deleteUser(userId)
      if (insertError.code === '23505') {
        return jsonResponse({ success: false, error: 'El email ya está en uso.' }, 409, cors)
      }
      return jsonResponse({ success: false, error: `Error al registrar usuario: ${insertError.message}` }, 400, cors)
    }

    return jsonResponse({
      success: true,
      message: 'Usuario creado exitosamente.',
      usuario: { id: userId, email, nombre, apellido, rol, clinica_id: clinicaId },
    }, 200, cors)

  } catch (err) {
    const e = err instanceof Error ? err : new Error('Error desconocido')
    return jsonResponse({ success: false, error: e.message }, 500, getCorsHeaders(req.headers.get('origin')))
  }
})
