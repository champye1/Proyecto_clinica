import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    // Obtener variables de entorno
    let supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    let supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl) {
      supabaseUrl = Deno.env.get('SUPABASE_PROJECT_URL') || ''
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Variables de entorno no configuradas. Ve a Supabase Dashboard → Edge Functions → Settings → Secrets y agrega: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
          status: 200,
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

    const { userId, email, force } = await req.json()

    // Validar que se proporcione userId o email
    if (!userId && !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Debes proporcionar userId o email del usuario a eliminar'
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    let targetUserId = userId

    // Si se proporciona email, obtener el userId
    if (!targetUserId && email) {
      const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (searchError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Error al buscar usuario: ${searchError.message}`
          }),
          {
            headers: { ...cors, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `No se encontró usuario con el email: ${email}`
          }),
          {
            headers: { ...cors, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      targetUserId = user.id
    }

    // Verificar si el usuario existe en la tabla users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', targetUserId)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error al verificar usuario: ${userError.message}`
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Si el usuario es un doctor, verificar datos relacionados
    if (userData?.role === 'doctor') {
      const { data: doctorData, error: doctorError } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .eq('user_id', targetUserId)
        .single()

      if (doctorData) {
        const doctorId = doctorData.id

        // Verificar pacientes
        const { count: patientsCount } = await supabaseAdmin
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)

        // Verificar solicitudes quirúrgicas
        const { count: requestsCount } = await supabaseAdmin
          .from('surgery_requests')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)

        // Verificar cirugías
        const { count: surgeriesCount } = await supabaseAdmin
          .from('surgeries')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)

        // Verificar bloqueos de horario
        const { count: blocksCount } = await supabaseAdmin
          .from('schedule_blocks')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)

        const hasRelatedData = (patientsCount || 0) > 0 || 
                              (requestsCount || 0) > 0 || 
                              (surgeriesCount || 0) > 0 || 
                              (blocksCount || 0) > 0

        if (hasRelatedData && !force) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'No se puede eliminar el usuario porque tiene datos relacionados',
              details: {
                pacientes: patientsCount || 0,
                solicitudes: requestsCount || 0,
                cirugias: surgeriesCount || 0,
                bloqueos: blocksCount || 0
              },
              message: 'Si deseas eliminar el usuario de todas formas, envía force: true en el cuerpo de la petición. ADVERTENCIA: Esto puede causar problemas de integridad de datos.'
            }),
            {
              headers: { ...cors, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }
      }
    }

    // Eliminar usuario de Auth (esto también eliminará automáticamente de la tabla users por CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error al eliminar usuario: ${deleteError.message}`
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario eliminado exitosamente',
        userId: targetUserId
      }),
      {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error desconocido en delete-user:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido'
      }),
      {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
