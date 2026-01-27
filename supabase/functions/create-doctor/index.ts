import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Obtener origen permitido desde variables de entorno o usar wildcard en desarrollo
const getAllowedOrigin = () => {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || []
  // En desarrollo, permitir cualquier origen. En producción, usar solo orígenes específicos
  if (allowedOrigins.length === 0) {
    return '*' // ⚠️ Cambiar en producción a orígenes específicos
  }
  return allowedOrigins
}

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigin()
  const originHeader = origin && allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*')
  
  return {
    'Access-Control-Allow-Origin': originHeader,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // VALIDACIÓN DE AUTENTICACIÓN Y PERMISOS
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No autorizado. Token de autenticación requerido.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    // Obtener variables de entorno
    // Opción 1: Variables configuradas manualmente en Dashboard → Edge Functions → Settings → Secrets
    let supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    let supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Opción 2: Si no están configuradas, usar las que Supabase inyecta automáticamente
    // Estas están disponibles en el contexto de la función
    if (!supabaseUrl) {
      // Intentar obtener de variables automáticas de Supabase
      supabaseUrl = Deno.env.get('SUPABASE_PROJECT_URL') || ''
    }
    
    // Si aún no tenemos las variables, mostrar error con instrucciones claras
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Variables de entorno no configuradas. Ve a Supabase Dashboard → Edge Functions → Settings → Secrets y agrega: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Validar token y obtener usuario
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token de autenticación inválido o expirado.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    // Verificar que el usuario tiene rol de pabellon
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Usuario no encontrado en el sistema.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      )
    }

    if (userData.role !== 'pabellon') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No autorizado. Solo usuarios de Pabellón pueden crear médicos.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      )
    }

    const { nombre, apellido, rut, email, especialidad, estado, acceso_web_enabled, username, password } = await req.json()

    if (!nombre || !apellido || !rut || !email || !especialidad) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Faltan datos requeridos'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Si acceso_web_enabled está activo, validar que username y password estén presentes
    if (acceso_web_enabled) {
      if (!username || !password) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Si habilitas el acceso web, debes proporcionar un nombre de usuario y contraseña'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    // Usar la contraseña proporcionada o generar una aleatoria
    const tempPassword = password || (Math.random().toString(36).slice(-12) + 'A1!')
    
    // Usar el email proporcionado (el username se usa solo para referencia, el email es el login)
    const userEmail = email.toLowerCase().trim()

    // Crear usuario en Auth
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: tempPassword,
      email_confirm: true,
    })

    if (createUserError || !authData?.user) {
      console.error('Error al crear usuario en Auth:', createUserError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error al crear usuario en Auth: ${createUserError?.message || 'Error desconocido'}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const userId = authData.user.id

    // Crear registro en users (incluir username si se proporciona)
    const { error: insertUserError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase().trim(),
        role: 'doctor',
        username: acceso_web_enabled && username ? username.toLowerCase().trim() : null,
      })

    if (insertUserError && insertUserError.code !== '23505') {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Error al crear registro en users:', insertUserError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error al crear registro en users: ${insertUserError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Crear registro en doctors
    const { data: doctorData, error: insertDoctorError } = await supabaseAdmin
      .from('doctors')
      .insert({
        user_id: userId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rut: rut,
        email: email.toLowerCase().trim(),
        especialidad: especialidad,
        estado: estado || 'activo',
        acceso_web_enabled: acceso_web_enabled || false,
      })
      .select()
      .single()

    if (insertDoctorError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('users').delete().eq('id', userId)
      console.error('Error al crear médico:', insertDoctorError)

      if (insertDoctorError.code === '23505') {
        if (insertDoctorError.message.includes('rut') || insertDoctorError.details?.includes('rut')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `El RUT ${rut} ya está registrado. Usa un RUT diferente.`
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }
        if (insertDoctorError.message.includes('email') || insertDoctorError.details?.includes('email')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `El correo electrónico ${email} ya está registrado. Usa un email diferente.`
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ya existe un médico con estos datos'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: `Error al crear médico: ${insertDoctorError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        doctor: doctorData,
        tempPassword: acceso_web_enabled ? tempPassword : undefined, // Solo enviar si acceso web está habilitado
        username: acceso_web_enabled ? username : undefined,
        message: 'Médico creado exitosamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error desconocido en create-doctor:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido'
      }),
      {
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
