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
    // Intentar múltiples formas de obtener las variables
    let supabaseUrl = Deno.env.get('SUPABASE_URL') || 
                      Deno.env.get('SUPABASE_PROJECT_URL') || 
                      Deno.env.get('SUPABASE_PROJECT_REF') || ''
    
    let supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 
                             Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    // Si no tenemos la URL, intentar construirla desde el proyecto
    if (!supabaseUrl) {
      const projectRef = Deno.env.get('SUPABASE_PROJECT_REF')
      if (projectRef) {
        supabaseUrl = `https://${projectRef}.supabase.co`
      }
    }
    
    // Si aún no tenemos las variables críticas, retornar error
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno faltantes:', {
        supabaseUrl: supabaseUrl ? '✓' : '✗',
        supabaseServiceKey: supabaseServiceKey ? '✓' : '✗',
        availableEnvVars: Object.keys(Deno.env.toObject())
      })
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Variables de entorno no configuradas. Ve a Supabase Dashboard → Edge Functions → Settings → Secrets y agrega: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. IMPORTANTE: Usa la SERVICE_ROLE_KEY, no la ANON_KEY.'
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
          error: 'No autorizado. Solo usuarios de Pabellón pueden eliminar médicos.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        },
      )
    }

    const { doctorId } = await req.json()

    if (!doctorId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Debes proporcionar el ID del médico a eliminar'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Obtener información del doctor
    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id, user_id, rut, email, nombre, apellido')
      .eq('id', doctorId)
      .single()

    if (doctorError || !doctorData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No se encontró el médico con ID: ${doctorId}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const userId = doctorData.user_id
    const doctorEmail = doctorData.email
    const doctorRut = doctorData.rut
    const doctorNombre = `${doctorData.nombre} ${doctorData.apellido}`

    // PASO 1: Eliminar datos relacionados en orden correcto
    
    // 1.1: Obtener IDs de solicitudes quirúrgicas del doctor
    const { data: surgeryRequests } = await supabaseAdmin
      .from('surgery_requests')
      .select('id')
      .eq('doctor_id', doctorId)

    const surgeryRequestIds = surgeryRequests?.map(sr => sr.id) || []

    // 1.2: Eliminar insumos de cirugías (si hay cirugías asociadas)
    if (surgeryRequestIds.length > 0) {
      // Obtener IDs de cirugías
      const { data: surgeries } = await supabaseAdmin
        .from('surgeries')
        .select('id')
        .in('surgery_request_id', surgeryRequestIds)

      const surgeryIds = surgeries?.map(s => s.id) || []

      if (surgeryIds.length > 0) {
        // Eliminar insumos de cirugías
        await supabaseAdmin
          .from('surgery_supplies')
          .delete()
          .in('surgery_id', surgeryIds)
      }

      // Eliminar cirugías programadas
      await supabaseAdmin
        .from('surgeries')
        .delete()
        .in('surgery_request_id', surgeryRequestIds)

      // Eliminar insumos de solicitudes
      await supabaseAdmin
        .from('surgery_request_supplies')
        .delete()
        .in('surgery_request_id', surgeryRequestIds)
    }

    // 1.3: Eliminar solicitudes quirúrgicas
    await supabaseAdmin
      .from('surgery_requests')
      .delete()
      .eq('doctor_id', doctorId)

    // 1.4: Eliminar pacientes del doctor
    await supabaseAdmin
      .from('patients')
      .delete()
      .eq('doctor_id', doctorId)

    // 1.5: Eliminar bloqueos de horario del doctor
    await supabaseAdmin
      .from('schedule_blocks')
      .delete()
      .eq('doctor_id', doctorId)

    // 1.6: Eliminar recordatorios y notificaciones del usuario
    await supabaseAdmin
      .from('reminders')
      .delete()
      .eq('user_id', userId)

    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    // PASO 2: Eliminar el registro del doctor
    const { error: deleteDoctorError } = await supabaseAdmin
      .from('doctors')
      .delete()
      .eq('id', doctorId)

    if (deleteDoctorError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error al eliminar médico: ${deleteDoctorError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // PASO 3: Eliminar usuario de auth.users (esto eliminará automáticamente de users por CASCADE)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Error al eliminar usuario de Auth:', deleteUserError)
      // Aunque falle la eliminación del usuario, el doctor ya fue eliminado
      return new Response(
        JSON.stringify({
          success: true,
          warning: `Médico eliminado pero hubo un problema al eliminar el usuario de autenticación: ${deleteUserError.message}`,
          deleted: {
            doctor: doctorNombre,
            rut: doctorRut,
            email: doctorEmail
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Médico y todos sus datos eliminados completamente',
        deleted: {
          doctor: doctorNombre,
          rut: doctorRut,
          email: doctorEmail,
          userId: userId
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error desconocido en delete-doctor:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
