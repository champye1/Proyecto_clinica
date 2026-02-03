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

    let userId: string
    let reusedExistingAuthUser = false

    // Crear usuario en Auth (o reutilizar si el correo ya existe por un intento anterior fallido)
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: tempPassword,
      email_confirm: true,
    })

    const isDuplicateEmail = createUserError?.message?.toLowerCase().includes('already') ||
      createUserError?.message?.toLowerCase().includes('registered') ||
      createUserError?.message?.toLowerCase().includes('duplicate')

    if (isDuplicateEmail) {
      // El correo ya existe en Auth. Buscar id: primero en public.users (más fiable), si no en Auth listUsers
      const { data: rowInUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .limit(1)
        .maybeSingle()

      if (rowInUsers?.id) {
        userId = rowInUsers.id
        reusedExistingAuthUser = true
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword })
      } else {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const existing = listData?.users?.find(u => u.email?.toLowerCase() === userEmail)
        if (!existing?.id) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Ese correo ya está registrado en Auth pero no se encontró el usuario. Elimina el usuario en Authentication → Users o usa otro correo y vuelve a intentar.'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }
        userId = existing.id
        reusedExistingAuthUser = true
        await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: tempPassword })
      }
    } else if (createUserError || !authData?.user) {
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
    } else {
      userId = authData.user.id
    }

    // Crear registro en public.users si no existe (obligatorio para que doctors.user_id cumpla la FK)
    const { data: insertedUser, error: insertUserError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        role: 'doctor',
      })
      .select('id')
      .single()

    if (insertUserError) {
      if (!reusedExistingAuthUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Error al crear registro en users:', insertUserError)
      // 23505 = unique violation: si reutilizamos usuario existente, public.users ya tiene la fila → continuar a crear médico
      if (insertUserError.code === '23505' && reusedExistingAuthUser) {
        // No devolver error; seguir a crear el médico
      } else if (insertUserError.code === '23505') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'El correo electrónico ya está registrado. Usa otro correo para este médico.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Error al crear usuario en el sistema: ${insertUserError.message}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    // Verificar que la fila existe (salvo si reutilizamos usuario y ya estaba en public.users)
    const userRowOk = insertedUser?.id || (insertUserError?.code === '23505' && reusedExistingAuthUser)
    if (!userRowOk) {
      if (!reusedExistingAuthUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('El registro en users no se creó correctamente')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se pudo crear el usuario en el sistema. Comprueba que la tabla users permita inserciones con la clave de servicio (RLS/permisos).'
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

      // 23503 = foreign key violation (doctors_user_id_fkey): el user_id no existe en users
      if (insertDoctorError.code === '23503') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No se pudo vincular el médico al usuario. El usuario se creó en Auth pero no en la tabla de usuarios. Contacta al administrador o revisa permisos/RLS de la tabla users.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

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
